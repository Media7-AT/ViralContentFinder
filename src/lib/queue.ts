import { Queue, Worker, type Processor } from 'bullmq'
import { redis } from './redis'

export const QUEUE_NAME = 'video-analysis'

export type JobType =
  | 'INGEST_VIDEO'
  | 'COLLECT_SNAPSHOT'
  | 'COMPUTE_METRICS'
  | 'EXTRACT_AUDIO'
  | 'COMPUTE_VS'
  | 'EVALUATE_ALERTS'

export interface IngestVideoPayload {
  video_id: string
  platform: string
  raw_data: Record<string, unknown>
}

export interface CollectSnapshotPayload {
  video_id: string
  target_hours: number
}

export interface ComputeMetricsPayload {
  video_id: string
}

export interface ExtractAudioPayload {
  video_id: string
  audio_url: string
}

export interface ComputeVSPayload {
  video_id: string
}

export interface EvaluateAlertsPayload {
  video_id: string
  virality_score: number
}

export type JobPayload =
  | IngestVideoPayload
  | CollectSnapshotPayload
  | ComputeMetricsPayload
  | ExtractAudioPayload
  | ComputeVSPayload
  | EvaluateAlertsPayload

// Singleton queue instance
const globalForQueue = globalThis as unknown as {
  videoAnalysisQueue: Queue | undefined
}

export const videoAnalysisQueue: Queue =
  globalForQueue.videoAnalysisQueue ??
  new Queue(QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForQueue.videoAnalysisQueue = videoAnalysisQueue

export function createWorker(processor: Processor): Worker {
  return new Worker(QUEUE_NAME, processor, {
    connection: redis,
    concurrency: 5,
  })
}

// Enqueue helpers
export async function enqueueIngestVideo(payload: IngestVideoPayload): Promise<string> {
  const job = await videoAnalysisQueue.add('INGEST_VIDEO', payload)
  return job.id ?? ''
}

export async function enqueueCollectSnapshot(
  payload: CollectSnapshotPayload,
  delayMs: number
): Promise<string> {
  const job = await videoAnalysisQueue.add('COLLECT_SNAPSHOT', payload, { delay: delayMs })
  return job.id ?? ''
}

export async function enqueueComputeMetrics(payload: ComputeMetricsPayload): Promise<string> {
  const job = await videoAnalysisQueue.add('COMPUTE_METRICS', payload)
  return job.id ?? ''
}

export async function enqueueExtractAudio(payload: ExtractAudioPayload): Promise<string> {
  const job = await videoAnalysisQueue.add('EXTRACT_AUDIO', payload, { priority: 10 })
  return job.id ?? ''
}

export async function enqueueComputeVS(payload: ComputeVSPayload): Promise<string> {
  const job = await videoAnalysisQueue.add('COMPUTE_VS', payload)
  return job.id ?? ''
}

export async function enqueueEvaluateAlerts(payload: EvaluateAlertsPayload): Promise<string> {
  const job = await videoAnalysisQueue.add('EVALUATE_ALERTS', payload)
  return job.id ?? ''
}
