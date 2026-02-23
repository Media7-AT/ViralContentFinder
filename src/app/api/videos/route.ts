import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { GetVideosResponse } from '@/types/api'
import type { Prisma } from '@prisma/client'
import type { Platform, VehicleCategory, ViralityTier, VSConfidence } from '@/types/metrics'

export async function GET(
  req: NextRequest
): Promise<NextResponse<GetVideosResponse | { error: string }>> {
  const { searchParams } = req.nextUrl

  const platform = searchParams.get('platform') ?? 'all'
  const tier = searchParams.get('tier') ?? 'all'
  const category = searchParams.get('category')
  const range = searchParams.get('range') ?? '7d'
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')
  const sort = searchParams.get('sort') ?? 'virality_score'
  const order = (searchParams.get('order') ?? 'desc') as 'asc' | 'desc'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '20', 10)))

  // Build where clause
  const where: Prisma.VideoAnalysisWhereInput = {}

  if (platform !== 'all') where.platform = platform
  if (tier !== 'all') where.viralityTier = tier
  if (category) where.vehicleCategory = category

  // Date range filter
  const now = new Date()
  let rangeStart: Date | undefined
  if (range === '24h') rangeStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  else if (range === '7d') rangeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  else if (range === '30d') rangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  else if (range === 'custom' && dateFrom) rangeStart = new Date(dateFrom)

  if (rangeStart) {
    where.publishTimestamp = { gte: rangeStart }
    if (range === 'custom' && dateTo) {
      where.publishTimestamp = { gte: rangeStart, lte: new Date(dateTo) }
    }
  }

  // Sort
  const sortField: Record<string, string> = {
    virality_score: 'viralityScore',
    ev_24h: 'ev24h',
    hsi: 'hsi',
    publish_timestamp: 'publishTimestamp',
  }
  const orderBy: Prisma.VideoAnalysisOrderByWithRelationInput = {
    [sortField[sort] ?? 'viralityScore']: order,
  }

  const [total, videos] = await Promise.all([
    prisma.videoAnalysis.count({ where }),
    prisma.videoAnalysis.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        videoId: true,
        platform: true,
        publishTimestamp: true,
        title: true,
        channelName: true,
        thumbnailUrl: true,
        durationSeconds: true,
        vehicleCategory: true,
        hashtags: true,
        viralityScore: true,
        viralityTier: true,
        vsConfidence: true,
        hsi: true,
        hsiEstimated: true,
        ev1h: true,
        ev6h: true,
        ev24h: true,
        vpi: true,
        bpm: true,
        viewsAt6h: true,
        dachSignalTier: true,
        analyzedAt: true,
      },
    }),
  ])

  const data = videos.map((v) => ({
    ...v,
    platform: v.platform as Platform,
    vehicleCategory: v.vehicleCategory as VehicleCategory | null,
    viralityTier: v.viralityTier as ViralityTier | null,
    vsConfidence: v.vsConfidence as VSConfidence | null,
    publishTimestamp: v.publishTimestamp.toISOString(),
    analyzedAt: v.analyzedAt.toISOString(),
    viewsAt6h: v.viewsAt6h != null ? Number(v.viewsAt6h) : null,
    dachSignalTier: v.dachSignalTier as 1 | 2 | 3 | null,
  }))

  return NextResponse.json({
    data,
    total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage),
  })
}
