import { prisma } from '@/lib/prisma'
import { MetricTable } from '@/components/table/MetricTable'
import type { VideoAnalysisSummary } from '@/types/video'

async function getVideos(): Promise<VideoAnalysisSummary[]> {
  try {
    const videos = await prisma.videoAnalysis.findMany({
      orderBy: { viralityScore: 'desc' },
      take: 200,
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
    })

    return videos.map((v) => ({
      ...v,
      publishTimestamp: v.publishTimestamp.toISOString(),
      analyzedAt: v.analyzedAt.toISOString(),
      viewsAt6h: v.viewsAt6h != null ? Number(v.viewsAt6h) : null,
      dachSignalTier: v.dachSignalTier as 1 | 2 | 3 | null,
    })) as unknown as VideoAnalysisSummary[]
  } catch {
    return []
  }
}

export default async function TablePage() {
  const videos = await getVideos()

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Metric Comparison Table</h1>
      <MetricTable videos={videos} />
    </div>
  )
}
