import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { GetMetricsSummaryResponse } from '@/types/api'
import type { Platform, VehicleCategory } from '@/types/metrics'

export async function GET(req: NextRequest): Promise<NextResponse<GetMetricsSummaryResponse>> {
  const range = req.nextUrl.searchParams.get('range') ?? '30d'

  const now = new Date()
  const periodMs: Record<string, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  }
  const ms = periodMs[range] ?? periodMs['30d']
  const currentStart = new Date(now.getTime() - ms)
  const previousStart = new Date(currentStart.getTime() - ms)

  const [total, currentStats, previousStats, topPlatformRow, topCategoryRow] = await Promise.all([
    prisma.videoAnalysis.count({ where: { analyzedAt: { gte: currentStart } } }),

    prisma.videoAnalysis.aggregate({
      where: { analyzedAt: { gte: currentStart }, viralityScore: { not: null } },
      _avg: { viralityScore: true },
    }),

    prisma.videoAnalysis.aggregate({
      where: {
        analyzedAt: { gte: previousStart, lt: currentStart },
        viralityScore: { not: null },
      },
      _avg: { viralityScore: true },
    }),

    prisma.videoAnalysis.groupBy({
      by: ['platform'],
      where: { analyzedAt: { gte: currentStart }, viralityScore: { not: null } },
      _avg: { viralityScore: true },
      orderBy: { _avg: { viralityScore: 'desc' } },
      take: 1,
    }),

    prisma.videoAnalysis.groupBy({
      by: ['vehicleCategory'],
      where: {
        analyzedAt: { gte: currentStart },
        viralityScore: { not: null },
        vehicleCategory: { not: null },
      },
      _avg: { viralityScore: true },
      orderBy: { _avg: { viralityScore: 'desc' } },
      take: 1,
    }),
  ])

  return NextResponse.json({
    total_videos_analyzed: total,
    avg_vs_current_period: Math.round((currentStats._avg.viralityScore ?? 0) * 1000) / 1000,
    avg_vs_previous_period: Math.round((previousStats._avg.viralityScore ?? 0) * 1000) / 1000,
    top_platform: (topPlatformRow[0]?.platform as Platform | null) ?? null,
    top_vehicle_category: (topCategoryRow[0]?.vehicleCategory as VehicleCategory | null) ?? null,
  })
}
