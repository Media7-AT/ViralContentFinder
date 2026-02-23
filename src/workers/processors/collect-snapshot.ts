import type { Job } from 'bullmq'
import { prisma } from '@/lib/prisma'
import { enqueueComputeMetrics, type CollectSnapshotPayload } from '@/lib/queue'
import axios from 'axios'

export async function processCollectSnapshot(job: Job<CollectSnapshotPayload>): Promise<void> {
  const { video_id, target_hours } = job.data

  const video = await prisma.videoAnalysis.findUnique({
    where: { videoId: video_id },
    select: { platform: true, videoUrl: true, channelId: true, publishTimestamp: true },
  })

  if (!video) {
    job.log(`Video ${video_id} not found — skipping snapshot`)
    return
  }

  const counts = await fetchCurrentEngagement(video.platform, video_id, video.channelId)
  if (!counts) {
    job.log(`Could not fetch engagement for ${video_id}`)
    return
  }

  await prisma.videoSnapshot.upsert({
    where: { videoId_hoursSincePublish: { videoId: video_id, hoursSincePublish: target_hours } },
    create: {
      videoId: video_id,
      snapshotAt: new Date(),
      hoursSincePublish: target_hours,
      viewCount: counts.viewCount != null ? BigInt(counts.viewCount) : null,
      likeCount: counts.likeCount != null ? BigInt(counts.likeCount) : null,
      commentCount: counts.commentCount != null ? BigInt(counts.commentCount) : null,
      shareCount: counts.shareCount != null ? BigInt(counts.shareCount) : null,
    },
    update: {
      snapshotAt: new Date(),
      viewCount: counts.viewCount != null ? BigInt(counts.viewCount) : null,
      likeCount: counts.likeCount != null ? BigInt(counts.likeCount) : null,
      commentCount: counts.commentCount != null ? BigInt(counts.commentCount) : null,
      shareCount: counts.shareCount != null ? BigInt(counts.shareCount) : null,
    },
  })

  job.log(`Snapshot collected for ${video_id} at T+${target_hours}h`)

  // Trigger metric recomputation after snapshot
  await enqueueComputeMetrics({ video_id })
}

async function fetchCurrentEngagement(
  platform: string,
  videoId: string,
  _channelId: string | null
): Promise<{
  viewCount: number | null
  likeCount: number
  commentCount: number
  shareCount: number
} | null> {
  switch (platform) {
    case 'youtube':
      return fetchYouTubeStats(videoId)
    default:
      // For TikTok/Instagram/Facebook: we'd need to re-run the scraper
      // For now, return null and mark as partial
      return null
  }
}

async function fetchYouTubeStats(videoId: string): Promise<{
  viewCount: number | null
  likeCount: number
  commentCount: number
  shareCount: number
} | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return null

  try {
    const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: { key: apiKey, id: videoId, part: 'statistics' },
      timeout: 10_000,
    })
    const stats = res.data.items?.[0]?.statistics
    if (!stats) return null
    return {
      viewCount: parseInt(stats.viewCount ?? '0', 10),
      likeCount: parseInt(stats.likeCount ?? '0', 10),
      commentCount: parseInt(stats.commentCount ?? '0', 10),
      shareCount: 0,
    }
  } catch {
    return null
  }
}
