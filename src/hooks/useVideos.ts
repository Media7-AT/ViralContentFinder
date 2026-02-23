import useSWR from 'swr'
import type { GetVideosResponse, GetVideosQuery } from '@/types/api'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useVideos(query: GetVideosQuery = {}) {
  const params = new URLSearchParams()
  if (query.platform) params.set('platform', query.platform)
  if (query.tier) params.set('tier', query.tier)
  if (query.category) params.set('category', query.category)
  if (query.range) params.set('range', query.range)
  if (query.sort) params.set('sort', query.sort)
  if (query.order) params.set('order', query.order)
  if (query.page) params.set('page', String(query.page))
  if (query.per_page) params.set('per_page', String(query.per_page))

  const url = `/api/videos?${params.toString()}`

  return useSWR<GetVideosResponse>(url, fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
  })
}
