'use client'

import { useQueryStates, parseAsString } from 'nuqs'
import { useVideos } from '@/hooks/useVideos'
import { VideoCard } from './VideoCard'
import { Button } from '@/components/ui/button'
import type { GetVideosQuery } from '@/types/api'

export function VideoFeed() {
  const [filters] = useQueryStates({
    platform: parseAsString.withDefault('all'),
    tier: parseAsString.withDefault('all'),
    category: parseAsString.withDefault('all'),
    range: parseAsString.withDefault('7d'),
    sort: parseAsString.withDefault('virality_score'),
    page: parseAsString.withDefault('1'),
  })

  const query: GetVideosQuery = {
    platform:
      filters.platform !== 'all' ? (filters.platform as GetVideosQuery['platform']) : undefined,
    tier: filters.tier !== 'all' ? (filters.tier as GetVideosQuery['tier']) : undefined,
    category:
      filters.category !== 'all' ? (filters.category as GetVideosQuery['category']) : undefined,
    range: filters.range as GetVideosQuery['range'],
    sort: filters.sort as GetVideosQuery['sort'],
    order: 'desc',
    page: parseInt(filters.page, 10),
    per_page: 20,
  }

  const { data, isLoading, error } = useVideos(query)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Failed to load videos. Check your connection.</p>
      </div>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No videos found</p>
        <p className="text-sm mt-1">Try changing the filters or triggering a new ingest cycle.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.data.map((video) => (
        <VideoCard key={video.videoId} video={video} />
      ))}

      {/* Pagination */}
      {data.total_pages > 1 && (
        <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
          <span>
            Showing {(data.page - 1) * data.per_page + 1}–
            {Math.min(data.page * data.per_page, data.total)} of {data.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.set('page', String(data.page - 1))
                window.history.pushState({}, '', url)
                window.location.reload()
              }}
            >
              ← Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.total_pages}
              onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.set('page', String(data.page + 1))
                window.history.pushState({}, '', url)
                window.location.reload()
              }}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
