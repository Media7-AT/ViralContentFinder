import { prisma } from './prisma'
import { getCache, setCache } from './redis'
import type { BenchmarksMap, PlatformBenchmarks } from '@/types/benchmark'
import type { Platform } from '@/types/metrics'

const CACHE_TTL = 60 * 60 * 24 // 24 hours
const CACHE_KEY = 'benchmark:all'

// Seed values from CONCEPT.md Section 4.5
export const SEED_BENCHMARKS: BenchmarksMap = {
  youtube: { hsiAvg: 62, ev24hAvg: 850, optimalBpmLow: 95, optimalBpmHigh: 125 },
  tiktok: { hsiAvg: 58, ev24hAvg: 2400, optimalBpmLow: 100, optimalBpmHigh: 130 },
  instagram: { hsiAvg: 60, ev24hAvg: 420, optimalBpmLow: 90, optimalBpmHigh: 120 },
  facebook: { hsiAvg: 60, ev24hAvg: 310, optimalBpmLow: 90, optimalBpmHigh: 120 },
}

/** Fetch benchmarks from cache or DB, falling back to seed values */
export async function getBenchmarks(): Promise<BenchmarksMap> {
  const cached = await getCache<BenchmarksMap>(CACHE_KEY)
  if (cached) return cached

  try {
    const rows = await prisma.nicheBenchmark.findMany()

    if (rows.length === 0) return SEED_BENCHMARKS

    const map: BenchmarksMap = { ...SEED_BENCHMARKS }

    for (const row of rows) {
      const platform = row.platform as Platform
      if (!map[platform]) continue
      switch (row.metricName) {
        case 'hsi_avg':
          map[platform].hsiAvg = row.metricValue
          break
        case 'ev_24h_avg':
          map[platform].ev24hAvg = row.metricValue
          break
        case 'optimal_bpm_low':
          map[platform].optimalBpmLow = row.metricValue
          break
        case 'optimal_bpm_high':
          map[platform].optimalBpmHigh = row.metricValue
          break
      }
    }

    await setCache(CACHE_KEY, map, CACHE_TTL)
    return map
  } catch {
    return SEED_BENCHMARKS
  }
}

/** Get benchmarks for a specific platform */
export async function getPlatformBenchmarks(platform: Platform): Promise<PlatformBenchmarks> {
  const all = await getBenchmarks()
  return all[platform]
}

/**
 * Compute ACC signal per video:
 * 1.0 if BPM is within optimal range, linearly decaying to 0.0 outside
 */
export function computeAccSignal(bpm: number | null, benchmarks: PlatformBenchmarks): number {
  if (bpm === null) return 0.5

  const { optimalBpmLow, optimalBpmHigh } = benchmarks
  const midpoint = (optimalBpmLow + optimalBpmHigh) / 2
  const range = (optimalBpmHigh - optimalBpmLow) / 2

  if (bpm >= optimalBpmLow && bpm <= optimalBpmHigh) return 1.0

  const distance = bpm < optimalBpmLow ? optimalBpmLow - bpm : bpm - optimalBpmHigh
  const signal = Math.max(0, 1 - distance / range)
  return Math.round(signal * 100) / 100
}
