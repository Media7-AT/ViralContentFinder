import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { GetSnapshotsResponse } from '@/types/api'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<GetSnapshotsResponse | { error: string }>> {
  const { id } = await params

  const snapshots = await prisma.videoSnapshot.findMany({
    where: { videoId: id },
    orderBy: { hoursSincePublish: 'asc' },
  })

  return NextResponse.json({
    snapshots: snapshots.map((s) => ({
      ...s,
      snapshotAt: s.snapshotAt.toISOString(),
      viewCount: s.viewCount != null ? Number(s.viewCount) : null,
      likeCount: s.likeCount != null ? Number(s.likeCount) : null,
      commentCount: s.commentCount != null ? Number(s.commentCount) : null,
      shareCount: s.shareCount != null ? Number(s.shareCount) : null,
    })),
  })
}
