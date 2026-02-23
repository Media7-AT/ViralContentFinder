import useSWR from 'swr'
import type { GetMetricsSummaryResponse } from '@/types/api'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useMetricsSummary(range: '24h' | '7d' | '30d' = '30d') {
  return useSWR<GetMetricsSummaryResponse>(`/api/metrics/summary?range=${range}`, fetcher, {
    refreshInterval: 60_000,
  })
}
