import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { GetVideoResponse } from '@/types/api'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<GetVideoResponse | { error: string }>> {
  const { id } = await params

  const video = await prisma.videoAnalysis.findUnique({
    where: { videoId: id },
    include: {
      snapshots: { orderBy: { hoursSincePublish: 'asc' } },
    },
  })

  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  const serialized = {
    ...video,
    publishTimestamp: video.publishTimestamp.toISOString(),
    analyzedAt: video.analyzedAt.toISOString(),
    updatedAt: video.updatedAt.toISOString(),
    viewsAt6h: video.viewsAt6h != null ? Number(video.viewsAt6h) : null,
    viewsAt48h: video.viewsAt48h != null ? Number(video.viewsAt48h) : null,
    snapshots: video.snapshots.map((s) => ({
      ...s,
      snapshotAt: s.snapshotAt.toISOString(),
      viewCount: s.viewCount != null ? Number(s.viewCount) : null,
      likeCount: s.likeCount != null ? Number(s.likeCount) : null,
      commentCount: s.commentCount != null ? Number(s.commentCount) : null,
      shareCount: s.shareCount != null ? Number(s.shareCount) : null,
    })),
    rawApiResponse: undefined, // never expose raw response
  }

  return NextResponse.json(serialized as unknown as GetVideoResponse)
}
