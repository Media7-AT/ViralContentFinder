import type { Job } from 'bullmq'
import { prisma } from '@/lib/prisma'
import { getPlatformBenchmarks, computeAccSignal } from '@/lib/benchmarks'
import { enqueueComputeVS, type ComputeMetricsPayload } from '@/lib/queue'
import type { Platform } from '@/types/metrics'

export async function processComputeMetrics(job: Job<ComputeMetricsPayload>): Promise<void> {
  const { video_id } = job.data

  const video = await prisma.videoAnalysis.findUnique({
    where: { videoId: video_id },
    include: { snapshots: { orderBy: { hoursSincePublish: 'asc' } } },
  })

  if (!video) {
    job.log(`Video ${video_id} not found`)
    return
  }

  const benchmarks = await getPlatformBenchmarks(video.platform as Platform)

  // Compute EV from snapshots
  const { ev1h, ev6h, ev24h, evPartial, viewsAt6h, viewsAt48h } = computeEngagementVelocity(
    video.snapshots,
    video.platform,
    video.evShareWeight
  )

  // ACC signal
  const accSignalPerVideo = computeAccSignal(video.bpm, benchmarks)
  const accEstimated = video.bpm === null

  // Update video record
  await prisma.videoAnalysis.update({
    where: { videoId: video_id },
    data: {
      ev1h,
      ev6h,
      ev24h,
      evPartial,
      evBenchmark90d: benchmarks.ev24hAvg,
      accSignalPerVideo,
      accEstimated,
      viewsAt6h: viewsAt6h != null ? BigInt(viewsAt6h) : null,
      viewsAt48h: viewsAt48h != null ? BigInt(viewsAt48h) : null,
      updatedAt: new Date(),
    },
  })

  // Trigger VS computation
  await enqueueComputeVS({ video_id })

  job.log(`Metrics computed for ${video_id}: EV_24h=${ev24h}, ACC=${accSignalPerVideo}`)
}

interface Snapshot {
  hoursSincePublish: number
  likeCount: bigint | null
  commentCount: bigint | null
  shareCount: bigint | null
  viewCount: bigint | null
}

function computeEngagementVelocity(
  snapshots: Snapshot[],
  platform: string,
  shareWeight: number
): {
  ev1h: number | null
  ev6h: number | null
  ev24h: number | null
  evPartial: boolean
  viewsAt6h: number | null
  viewsAt48h: number | null
} {
  const getEV = (hours: number): number | null => {
    const snap = snapshots.find(
      (s) => Math.abs(s.hoursSincePublish - hours) <= hours * 0.2 // 20% tolerance
    )
    if (!snap) return null
    const likes = Number(snap.likeCount ?? 0)
    const comments = Number(snap.commentCount ?? 0)
    const shares = Number(snap.shareCount ?? 0)
    return likes + comments + (platform === 'facebook' ? shares * shareWeight : shares)
  }

  const getViews = (hours: number): number | null => {
    const snap = snapshots.find((s) => Math.abs(s.hoursSincePublish - hours) <= hours * 0.2)
    return snap?.viewCount != null ? Number(snap.viewCount) : null
  }

  const ev1h = getEV(1)
  const ev6h = getEV(6)
  const ev24h = getEV(24)

  const availableCount = [ev1h, ev6h, ev24h].filter((v) => v !== null).length
  const evPartial = availableCount < 3 && availableCount > 0

  return {
    ev1h,
    ev6h,
    ev24h,
    evPartial,
    viewsAt6h: getViews(6),
    viewsAt48h: getViews(48),
  }
}
