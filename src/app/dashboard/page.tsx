import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { SEED_BENCHMARKS } from '@/lib/benchmarks'
import { KPITileRow } from '@/components/layout/KPITileRow'
import { FilterBar } from '@/components/feed/FilterBar'
import { VideoFeed } from '@/components/feed/VideoFeed'
import type { GetMetricsSummaryResponse } from '@/types/api'
import type { Platform, VehicleCategory } from '@/types/metrics'

async function getSummary(): Promise<GetMetricsSummaryResponse> {
  try {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const prevCutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

    const [total, current, previous, topPlatform, topCategory] = await Promise.all([
      prisma.videoAnalysis.count({ where: { analyzedAt: { gte: cutoff } } }),
      prisma.videoAnalysis.aggregate({
        where: { analyzedAt: { gte: cutoff }, viralityScore: { not: null } },
        _avg: { viralityScore: true },
      }),
      prisma.videoAnalysis.aggregate({
        where: { analyzedAt: { gte: prevCutoff, lt: cutoff }, viralityScore: { not: null } },
        _avg: { viralityScore: true },
      }),
      prisma.videoAnalysis.groupBy({
        by: ['platform'],
        where: { analyzedAt: { gte: cutoff }, viralityScore: { not: null } },
        _avg: { viralityScore: true },
        orderBy: { _avg: { viralityScore: 'desc' } },
        take: 1,
      }),
      prisma.videoAnalysis.groupBy({
        by: ['vehicleCategory'],
        where: { analyzedAt: { gte: cutoff }, vehicleCategory: { not: null } },
        _avg: { viralityScore: true },
        orderBy: { _avg: { viralityScore: 'desc' } },
        take: 1,
      }),
    ])

    return {
      total_videos_analyzed: total,
      avg_vs_current_period: current._avg.viralityScore ?? 0,
      avg_vs_previous_period: previous._avg.viralityScore ?? 0,
      top_platform: (topPlatform[0]?.platform as Platform | null) ?? null,
      top_vehicle_category: (topCategory[0]?.vehicleCategory as VehicleCategory | null) ?? null,
    }
  } catch {
    return {
      total_videos_analyzed: 0,
      avg_vs_current_period: SEED_BENCHMARKS.youtube.hsiAvg / 100,
      avg_vs_previous_period: 0,
      top_platform: null,
      top_vehicle_category: null,
    }
  }
}

export default async function DashboardPage() {
  const summary = await getSummary()

  return (
    <div className="space-y-4 max-w-4xl">
      <KPITileRow summary={summary} />
      <div className="space-y-3">
        <Suspense>
          <FilterBar />
        </Suspense>
        <Suspense
          fallback={
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          }
        >
          <VideoFeed />
        </Suspense>
      </div>
    </div>
  )
}
