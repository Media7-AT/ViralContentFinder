import { createWorker } from '@/lib/queue'
import { processIngestVideo } from './processors/ingest-video'
import { processCollectSnapshot } from './processors/collect-snapshot'
import { processComputeMetrics } from './processors/compute-metrics'
import { processExtractAudio } from './processors/extract-audio'
import { processComputeVS } from './processors/compute-vs'
import { processEvaluateAlerts } from './processors/evaluate-alerts'
import { startIngestCron, startBenchmarkCron, startGdprCleanupCron } from './cron'
import type { Job } from 'bullmq'

console.log('[Worker] Starting ViralContentFinder background worker...')

const worker = createWorker(async (job: Job) => {
  switch (job.name) {
    case 'INGEST_VIDEO':
      return processIngestVideo(job)
    case 'COLLECT_SNAPSHOT':
      return processCollectSnapshot(job)
    case 'COMPUTE_METRICS':
      return processComputeMetrics(job)
    case 'EXTRACT_AUDIO':
      return processExtractAudio(job)
    case 'COMPUTE_VS':
      return processComputeVS(job)
    case 'EVALUATE_ALERTS':
      return processEvaluateAlerts(job)
    default:
      console.warn(`[Worker] Unknown job type: ${job.name}`)
  }
})

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} (${job.name}) completed`)
})

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} (${job?.name}) failed:`, err.message)
})

worker.on('error', (err) => {
  console.error('[Worker] Worker error:', err)
})

// Start cron jobs
startIngestCron()
startBenchmarkCron()
startGdprCleanupCron()

console.log('[Worker] All processors registered. Cron jobs started.')
console.log('[Worker] Processing queue: video-analysis')
