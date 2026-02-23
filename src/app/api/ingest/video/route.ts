import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enqueueIngestVideo } from '@/lib/queue'
import { ingestVideoSchema } from '@/lib/validation/ingest.schema'
import type { IngestVideoResponse } from '@/types/api'

export async function POST(
  req: NextRequest
): Promise<NextResponse<IngestVideoResponse | { error: string }>> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ingestVideoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  }

  const { video_id, platform } = parsed.data

  const existing = await prisma.videoAnalysis.findUnique({
    where: { videoId: video_id },
    select: { videoId: true },
  })

  if (existing) {
    return NextResponse.json({ video_id, status: 'already_exists' })
  }

  await enqueueIngestVideo({ video_id, platform, raw_data: { video_id, platform } })

  return NextResponse.json({ video_id, status: 'queued' })
}
