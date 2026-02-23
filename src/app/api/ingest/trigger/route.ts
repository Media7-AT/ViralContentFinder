import { NextRequest, NextResponse } from 'next/server'
import { searchDachAutomotiveVideos } from '@/services/youtube'
import { searchDachAutomotiveTikToks } from '@/services/tiktok'
import { searchDachAutomotiveReels } from '@/services/instagram'
import { searchDachAutomotiveFacebookReels } from '@/services/facebook'
import { prisma } from '@/lib/prisma'
import { enqueueIngestVideo } from '@/lib/queue'
import { ingestTriggerSchema } from '@/lib/validation/ingest.schema'
import type { IngestTriggerResponse } from '@/types/api'

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown = {}
  try {
    body = await req.json()
  } catch {}

  const parsed = ingestTriggerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.message },
      { status: 400 }
    )
  }

  const { platforms = ['youtube', 'tiktok', 'instagram', 'facebook'] } = parsed.data

  const jobIds: string[] = []
  let totalNew = 0

  try {
    // Fetch from each enabled platform
    const allVideos: Array<{ id: string; platform: string; raw: Record<string, unknown> }> = []

    if (platforms.includes('youtube')) {
      try {
        const videos = await searchDachAutomotiveVideos()
        for (const v of videos) {
          allVideos.push({
            id: v.videoId,
            platform: 'youtube',
            raw: v as unknown as Record<string, unknown>,
          })
        }
      } catch (err) {
        console.error('[Ingest] YouTube fetch failed:', err)
      }
    }

    if (platforms.includes('tiktok')) {
      try {
        const videos = await searchDachAutomotiveTikToks()
        for (const v of videos) {
          allVideos.push({
            id: v.videoId,
            platform: 'tiktok',
            raw: v as unknown as Record<string, unknown>,
          })
        }
      } catch (err) {
        console.error('[Ingest] TikTok fetch failed:', err)
      }
    }

    if (platforms.includes('instagram')) {
      try {
        const videos = await searchDachAutomotiveReels()
        for (const v of videos) {
          allVideos.push({
            id: v.videoId,
            platform: 'instagram',
            raw: v as unknown as Record<string, unknown>,
          })
        }
      } catch (err) {
        console.error('[Ingest] Instagram fetch failed:', err)
      }
    }

    if (platforms.includes('facebook')) {
      try {
        const videos = await searchDachAutomotiveFacebookReels()
        for (const v of videos) {
          allVideos.push({
            id: v.videoId,
            platform: 'facebook',
            raw: v as unknown as Record<string, unknown>,
          })
        }
      } catch (err) {
        console.error('[Ingest] Facebook fetch failed:', err)
      }
    }

    // Deduplicate against DB
    const ids = allVideos.map((v) => v.id)
    const existing = await prisma.videoAnalysis.findMany({
      where: { videoId: { in: ids } },
      select: { videoId: true },
    })
    const existingIds = new Set(existing.map((e) => e.videoId))

    const newVideos = allVideos.filter((v) => !existingIds.has(v.id))
    totalNew = newVideos.length

    // Enqueue new videos
    for (const video of newVideos) {
      const jobId = await enqueueIngestVideo({
        video_id: video.id,
        platform: video.platform,
        raw_data: video.raw,
      })
      jobIds.push(jobId)
    }

    const response: IngestTriggerResponse = { job_ids: jobIds, queued_count: totalNew }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[Ingest] Trigger failed:', err)
    return NextResponse.json({ error: 'Ingest failed' }, { status: 500 })
  }
}
