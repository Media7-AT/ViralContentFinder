import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { MetricBreakdownPanel } from '@/components/metrics/MetricBreakdownPanel'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import type { VideoAnalysisFull } from '@/types/video'

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram Reels',
  facebook: 'Facebook Reels',
}

async function getVideo(id: string): Promise<VideoAnalysisFull | null> {
  try {
    const video = await prisma.videoAnalysis.findUnique({
      where: { videoId: id },
      include: { snapshots: { orderBy: { hoursSincePublish: 'asc' } } },
    })
    if (!video) return null

    return {
      ...video,
      publishTimestamp: video.publishTimestamp.toISOString(),
      analyzedAt: video.analyzedAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
      viewsAt6h: video.viewsAt6h != null ? Number(video.viewsAt6h) : null,
      viewsAt48h: video.viewsAt48h != null ? Number(video.viewsAt48h) : null,
      dachSignalTier: video.dachSignalTier as 1 | 2 | 3 | null,
      rawApiResponse: undefined,
      snapshots: video.snapshots.map((s) => ({
        ...s,
        snapshotAt: s.snapshotAt.toISOString(),
        viewCount: s.viewCount != null ? Number(s.viewCount) : null,
        likeCount: s.likeCount != null ? Number(s.likeCount) : null,
        commentCount: s.commentCount != null ? Number(s.commentCount) : null,
        shareCount: s.shareCount != null ? Number(s.shareCount) : null,
      })),
    } as unknown as VideoAnalysisFull
  } catch {
    return null
  }
}

export default async function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const video = await getVideo(id)
  if (!video) notFound()

  const timeAgo = formatDistanceToNow(new Date(video.publishTimestamp), {
    addSuffix: true,
    locale: de,
  })

  return (
    <div className="max-w-4xl space-y-4">
      {/* Back */}
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to Feed
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold leading-tight">{video.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{video.channelName ?? 'Unknown channel'}</span>
          <span>·</span>
          <Badge variant="secondary" className="text-xs">
            {PLATFORM_LABELS[video.platform] ?? video.platform}
          </Badge>
          <span>·</span>
          <span>{timeAgo}</span>
          {video.vehicleCategory && (
            <>
              <span>·</span>
              <Badge variant="outline" className="text-xs">
                {video.vehicleCategory}
              </Badge>
            </>
          )}
        </div>
        {video.videoUrl && (
          <a
            href={video.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline"
          >
            View original →
          </a>
        )}
      </div>

      <MetricBreakdownPanel video={video} />
    </div>
  )
}
