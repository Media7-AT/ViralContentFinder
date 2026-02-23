import type { Platform } from './metrics'

export interface PlatformBenchmarks {
  hsiAvg: number
  ev24hAvg: number
  optimalBpmLow: number
  optimalBpmHigh: number
}

export type BenchmarksMap = Record<Platform, PlatformBenchmarks>

export interface NicheBenchmark {
  id: number
  platform: Platform
  metricName: string
  metricValue: number
  computedAt: string
  windowDays: number
  sampleCount: number | null
}
