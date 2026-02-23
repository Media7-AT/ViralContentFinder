import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'
import type { Prisma } from '@prisma/client'

const MAX_ROWS = 10_000

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl

  const platform = searchParams.get('platform')
  const tier = searchParams.get('tier')
  const category = searchParams.get('category')
  const range = searchParams.get('range') ?? '30d'
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')

  const where: Prisma.VideoAnalysisWhereInput = {}
  if (platform && platform !== 'all') where.platform = platform
  if (tier && tier !== 'all') where.viralityTier = tier
  if (category) where.vehicleCategory = category

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

  const videos = await prisma.videoAnalysis.findMany({
    where,
    orderBy: { viralityScore: 'desc' },
    take: MAX_ROWS,
    select: {
      videoId: true,
      platform: true,
      publishTimestamp: true,
      title: true,
      channelName: true,
      vehicleCategory: true,
      viralityScore: true,
      viralityTier: true,
      vsConfidence: true,
      hsi: true,
      ev1h: true,
      ev6h: true,
      ev24h: true,
      vpi: true,
      bpm: true,
      rdpResilienceScore: true,
      viewsAt6h: true,
      // rawApiResponse intentionally excluded (GDPR)
    },
  })

  const rows = videos.map((v) => ({
    video_id: v.videoId,
    platform: v.platform,
    published: v.publishTimestamp.toISOString(),
    title: v.title,
    channel: v.channelName ?? '',
    category: v.vehicleCategory ?? '',
    virality_score: v.viralityScore ?? '',
    virality_tier: v.viralityTier ?? '',
    vs_confidence: v.vsConfidence ?? '',
    hsi: v.hsi ?? '',
    ev_1h: v.ev1h ?? '',
    ev_6h: v.ev6h ?? '',
    ev_24h: v.ev24h ?? '',
    vpi: v.vpi ?? '',
    bpm: v.bpm ?? '',
    rdp_resilience: v.rdpResilienceScore ?? '',
    views_at_6h: v.viewsAt6h != null ? Number(v.viewsAt6h) : '',
  }))

  const csv = Papa.unparse(rows)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="viral-content-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
