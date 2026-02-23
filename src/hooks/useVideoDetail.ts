import useSWR from 'swr'
import type { VideoAnalysisFull } from '@/types/video'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useVideoDetail(videoId: string | null) {
  return useSWR<VideoAnalysisFull>(videoId ? `/api/videos/${videoId}` : null, fetcher, {
    revalidateOnFocus: false,
  })
}
