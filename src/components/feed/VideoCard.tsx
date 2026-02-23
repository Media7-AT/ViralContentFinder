'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ViralityScoreBadge } from '@/components/metrics/ViralityScoreBadge'
import { HSIBadge } from '@/components/metrics/HSIBadge'
import type { VideoAnalysisSummary } from '@/types/video'

const PLATFORM_COLORS: Record<string, string> = {
  youtube: 'bg-red-600',
  tiktok: 'bg-black',
  instagram: 'bg-pink-600',
  facebook: 'bg-blue-700',
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Reels',
  facebook: 'FB Reels',
}

interface Props {
  video: VideoAnalysisSummary
}

export function VideoCard({ video }: Props) {
  const timeAgo = formatDistanceToNow(new Date(video.publishTimestamp), {
    addSuffix: true,
    locale: de,
  })

  return (
    <Link href={`/dashboard/video/${video.videoId}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-0">
          <div className="flex gap-3 p-3">
            {/* Thumbnail */}
            <div className="relative shrink-0 w-28 h-16 rounded-md overflow-hidden bg-muted">
              {video.thumbnailUrl ? (
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 dark:bg-slate-700" />
              )}
              {/* Platform badge overlay */}
              <span
                className={`absolute bottom-1 left-1 text-white text-[9px] font-bold px-1 rounded ${PLATFORM_COLORS[video.platform] ?? 'bg-slate-600'}`}
              >
                {PLATFORM_LABELS[video.platform] ?? video.platform}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* Title row */}
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary">
                  {video.title}
                </p>
                <div className="shrink-0">
                  <ViralityScoreBadge
                    score={video.viralityScore}
                    tier={video.viralityTier}
                    confidence={video.vsConfidence}
                    size="sm"
                  />
                </div>
              </div>

              {/* Channel + time */}
              <p className="text-xs text-muted-foreground">
                {video.channelName ?? 'Unknown'} · {timeAgo}
              </p>

              {/* Metrics row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {video.viewsAt6h != null && (
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {formatViews(video.viewsAt6h)}
                    </span>{' '}
                    views
                  </span>
                )}
                <HSIBadge hsi={video.hsi} estimated={video.hsiEstimated} />
                {video.ev1h != null && (
                  <span className="text-muted-foreground">
                    EV_1h:{' '}
                    <span className="font-medium text-foreground">
                      {video.ev1h.toLocaleString('de-DE')}
                    </span>
                  </span>
                )}
                {video.vpi != null && (
                  <span className="text-muted-foreground">
                    VPI: <span className="font-medium text-foreground">{video.vpi.toFixed(1)}</span>
                  </span>
                )}
                {video.bpm != null && (
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{Math.round(video.bpm)}</span> BPM
                  </span>
                )}
                {video.vehicleCategory && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {video.vehicleCategory}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}
