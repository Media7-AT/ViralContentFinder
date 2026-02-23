import type {
  Platform,
  ViralityTier,
  VSConfidence,
  FreqBand,
  VehicleCategory,
  DachSignalTier,
  RetentionPoint,
  DropOffPoint,
  GeoDistribution,
} from './metrics'

export interface VideoSnapshot {
  id: number
  videoId: string
  snapshotAt: string
  hoursSincePublish: number
  viewCount: number | null
  likeCount: number | null
  commentCount: number | null
  shareCount: number | null
}

export interface VideoAnalysisSummary {
  videoId: string
  platform: Platform
  publishTimestamp: string
  title: string
  channelName: string | null
  thumbnailUrl: string | null
  durationSeconds: number | null
  vehicleCategory: VehicleCategory | null
  hashtags: string[]
  // Core metrics for feed card
  viralityScore: number | null
  viralityTier: ViralityTier | null
  vsConfidence: VSConfidence | null
  hsi: number | null
  hsiEstimated: boolean
  ev1h: number | null
  ev6h: number | null
  ev24h: number | null
  vpi: number | null
  bpm: number | null
  viewsAt6h: number | null
  dachSignalTier: DachSignalTier | null
  analyzedAt: string
}

export interface VideoAnalysisFull extends VideoAnalysisSummary {
  videoUrl: string | null
  channelId: string | null
  dachSignalScore: number | null
  geoDistribution: GeoDistribution | null
  languageDetected: string | null
  // Detailed metrics
  hsiBenchmark: number | null
  retentionCurve: RetentionPoint[] | null
  dropOffPoints: DropOffPoint[] | null
  rdpResilienceScore: number | null
  rdpEstimated: boolean
  evPartial: boolean
  evBenchmark90d: number | null
  evShareWeight: number
  dominantFreqBand: FreqBand | null
  audioCorrelation: number | null
  accSignalPerVideo: number | null
  accEstimated: boolean
  vpiOptimalMatch: number | null
  vpiEstimated: boolean
  viewsAt48h: number | null
  viewVelocityBonus: boolean
  cvAnnotations: Record<string, unknown> | null
  updatedAt: string
  snapshots: VideoSnapshot[]
}
