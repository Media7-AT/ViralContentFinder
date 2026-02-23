import cron from 'node-cron'
import axios from 'axios'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

const APP_URL = process.env.AUTH_URL ?? 'http://localhost:3000'

/** Every 30 minutes: trigger full ingest cycle */
export function startIngestCron(): void {
  cron.schedule('*/30 * * * *', async () => {
    console.log('[Cron] Triggering ingest cycle...')
    try {
      await axios.post(`${APP_URL}/api/ingest/trigger`, {}, { timeout: 30_000 })
      console.log('[Cron] Ingest triggered successfully')
    } catch (err) {
      console.error('[Cron] Ingest trigger failed:', err)
    }
  })
}

/** Nightly at 03:00 CET: recalculate benchmark values */
export function startBenchmarkCron(): void {
  cron.schedule('0 3 * * *', async () => {
    console.log('[Cron] Recalculating benchmarks...')
    try {
      await recalculateBenchmarks()
      console.log('[Cron] Benchmarks updated')
    } catch (err) {
      console.error('[Cron] Benchmark recalculation failed:', err)
    }
  })
}

/** Weekly Sunday 04:00: GDPR cleanup */
export function startGdprCleanupCron(): void {
  cron.schedule('0 4 * * 0', async () => {
    console.log('[Cron] Running GDPR cleanup...')
    try {
      await runGdprCleanup()
      console.log('[Cron] GDPR cleanup complete')
    } catch (err) {
      console.error('[Cron] GDPR cleanup failed:', err)
    }
  })
}

async function recalculateBenchmarks(): Promise<void> {
  const platforms = ['youtube', 'tiktok', 'instagram', 'facebook']
  const windowDays = 90
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)

  for (const platform of platforms) {
    const videos = await prisma.videoAnalysis.findMany({
      where: {
        platform,
        analyzedAt: { gte: cutoff },
        viralityTier: { in: ['Tier1', 'Tier2'] },
      },
      select: { hsi: true, ev24h: true, bpm: true },
    })

    if (videos.length < 10) continue

    const hsiAvg = average(videos.map((v) => v.hsi).filter((v): v is number => v !== null)) ?? null
    const ev24hAvg =
      average(videos.map((v) => v.ev24h).filter((v): v is number => v !== null)) ?? null

    if (hsiAvg !== null) {
      await prisma.nicheBenchmark.upsert({
        where: { platform_metricName: { platform, metricName: 'hsi_avg' } },
        create: {
          platform,
          metricName: 'hsi_avg',
          metricValue: hsiAvg,
          sampleCount: videos.length,
        },
        update: { metricValue: hsiAvg, sampleCount: videos.length, computedAt: new Date() },
      })
    }

    if (ev24hAvg !== null) {
      await prisma.nicheBenchmark.upsert({
        where: { platform_metricName: { platform, metricName: 'ev_24h_avg' } },
        create: {
          platform,
          metricName: 'ev_24h_avg',
          metricValue: ev24hAvg,
          sampleCount: videos.length,
        },
        update: { metricValue: ev24hAvg, sampleCount: videos.length, computedAt: new Date() },
      })
    }
  }
}

async function runGdprCleanup(): Promise<void> {
  // Get configured TTL (default 90 days)
  const setting = await prisma.appSetting.findUnique({ where: { key: 'raw_data_ttl_days' } })
  const ttlDays = setting ? parseInt(setting.value, 10) : 90
  const cutoff = new Date(Date.now() - ttlDays * 24 * 60 * 60 * 1000)

  // Purge raw API responses (7-day TTL — shorter than analysis records)
  const rawCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  await prisma.videoAnalysis.updateMany({
    where: { analyzedAt: { lte: rawCutoff }, rawApiResponse: { not: Prisma.JsonNull } },
    data: { rawApiResponse: Prisma.DbNull },
  })

  // Delete old records entirely
  await prisma.videoAnalysis.deleteMany({
    where: { analyzedAt: { lte: cutoff } },
  })
}

function average(nums: number[]): number | null {
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}
