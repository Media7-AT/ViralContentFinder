import type { Job } from 'bullmq'
import { prisma } from '@/lib/prisma'
import { computeViralityScore, type VSInput } from '@/lib/virality-score'
import { enqueueEvaluateAlerts, type ComputeVSPayload } from '@/lib/queue'

export async function processComputeVS(job: Job<ComputeVSPayload>): Promise<void> {
  const { video_id } = job.data

  const video = await prisma.videoAnalysis.findUnique({
    where: { videoId: video_id },
  })

  if (!video) {
    job.log(`Video ${video_id} not found`)
    return
  }

  const input: VSInput = {
    hsi: video.hsi,
    hsiEstimated: video.hsiEstimated,
    ev24h: video.ev24h,
    evBenchmark90d: video.evBenchmark90d,
    evPartial: video.evPartial,
    rdpResilienceScore: video.rdpResilienceScore,
    rdpEstimated: video.rdpEstimated,
    vpi: video.vpi,
    vpiEstimated: video.vpiEstimated,
    accSignalPerVideo: video.accSignalPerVideo,
    accEstimated: video.accEstimated,
    viewsAt6h: video.viewsAt6h != null ? Number(video.viewsAt6h) : null,
    viewsAt48h: video.viewsAt48h != null ? Number(video.viewsAt48h) : null,
  }

  const result = computeViralityScore(input)

  await prisma.videoAnalysis.update({
    where: { videoId: video_id },
    data: {
      viralityScore: result.score,
      viralityTier: result.tier,
      vsConfidence: result.confidence,
      viewVelocityBonus: result.viewVelocityBonus,
      updatedAt: new Date(),
    },
  })

  job.log(`VS computed for ${video_id}: score=${result.score}, tier=${result.tier}`)

  // Trigger alert evaluation
  await enqueueEvaluateAlerts({ video_id, virality_score: result.score })
}
