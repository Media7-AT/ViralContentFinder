import type { Job } from 'bullmq'
import { prisma } from '@/lib/prisma'
import { analyzeAudioFromUrl } from '@/services/audd'
import { enqueueComputeVS, type ExtractAudioPayload } from '@/lib/queue'

export async function processExtractAudio(job: Job<ExtractAudioPayload>): Promise<void> {
  const { video_id, audio_url } = job.data

  const result = await analyzeAudioFromUrl(audio_url)

  await prisma.videoAnalysis.update({
    where: { videoId: video_id },
    data: {
      bpm: result.bpm,
      dominantFreqBand: result.dominantFreqBand,
      accEstimated: result.bpm === null,
      updatedAt: new Date(),
    },
  })

  // Re-trigger VS with updated audio data
  await enqueueComputeVS({ video_id })

  job.log(`Audio extracted for ${video_id}: BPM=${result.bpm}, band=${result.dominantFreqBand}`)
}
