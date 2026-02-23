import type { VideoAnalysisSummary, VideoAnalysisFull, VideoSnapshot } from './video'
import type { BenchmarksMap } from './benchmark'
import type { Platform, ViralityTier, VehicleCategory } from './metrics'

// GET /api/videos
export interface GetVideosQuery {
  platform?: Platform | 'all'
  tier?: ViralityTier | 'all'
  category?: VehicleCategory
  range?: '24h' | '7d' | '30d' | 'custom'
  date_from?: string
  date_to?: string
  sort?: 'virality_score' | 'ev_24h' | 'hsi' | 'publish_timestamp'
  order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface GetVideosResponse {
  data: VideoAnalysisSummary[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// GET /api/videos/[id]
export type GetVideoResponse = VideoAnalysisFull

// GET /api/videos/[id]/snapshots
export interface GetSnapshotsResponse {
  snapshots: VideoSnapshot[]
}

// GET /api/benchmarks
export type GetBenchmarksResponse = BenchmarksMap

// GET /api/metrics/summary
export interface GetMetricsSummaryResponse {
  total_videos_analyzed: number
  avg_vs_current_period: number
  avg_vs_previous_period: number
  top_platform: Platform | null
  top_vehicle_category: VehicleCategory | null
}

// POST /api/ingest/trigger
export interface IngestTriggerBody {
  platforms?: Platform[]
  keyword_override?: string[]
}

export interface IngestTriggerResponse {
  job_ids: string[]
  queued_count: number
}

// POST /api/ingest/video
export interface IngestVideoBody {
  video_id: string
  platform: Platform
}

export interface IngestVideoResponse {
  video_id: string
  status: 'queued' | 'already_exists'
}

// GET /api/health
export interface HealthResponse {
  status: 'ok' | 'error'
  db: 'connected' | 'error'
  redis: 'connected' | 'error'
  timestamp: string
}

// Settings
export type AppSettings = Record<string, string>

// Error response
export interface ApiError {
  error: string
  details?: string
}
