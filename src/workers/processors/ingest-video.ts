import type { Job } from 'bullmq'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { computeDachSignal, passesDachFilter } from '@/lib/dach-signal'
import { enqueueCollectSnapshot, enqueueComputeMetrics, type IngestVideoPayload } from '@/lib/queue'
import { franc } from 'franc-min'

const SNAPSHOT_DELAYS_MS = [
  1 * 60 * 60 * 1000, // T+1h
  6 * 60 * 60 * 1000, // T+6h
  24 * 60 * 60 * 1000, // T+24h
  48 * 60 * 60 * 1000, // T+48h
]

export async function processIngestVideo(job: Job<IngestVideoPayload>): Promise<void> {
  const { video_id, platform, raw_data } = job.data

  // Check for existing record
  const existing = await prisma.videoAnalysis.findUnique({
    where: { videoId: video_id },
    select: { videoId: true },
  })
  if (existing) {
    job.log(`Video ${video_id} already exists — skipping`)
    return
  }

  // Extract normalized fields from raw_data based on platform
  const normalized = normalizeRawData(platform, raw_data)

  // Language detection
  const textForLangDetect = [normalized.title, ...normalized.hashtags].join(' ')
  const detectedLang = detectLanguage(textForLangDetect)

  // DACH signal
  const dachResult = computeDachSignal({
    languageDetected: detectedLang,
    hashtags: normalized.hashtags,
    channelCountry: normalized.channelCountry,
  })

  if (!passesDachFilter(dachResult)) {
    job.log(
      `Video ${video_id} failed DACH filter (score=${dachResult.score}) — stored with weak flag`
    )
  }

  // Facebook-specific EV share weight
  const evShareWeight = platform === 'facebook' ? 1.5 : 1.0

  // Write to DB
  await prisma.videoAnalysis.create({
    data: {
      videoId: video_id,
      platform,
      publishTimestamp: new Date(normalized.publishedAt),
      title: normalized.title,
      channelId: normalized.channelId,
      channelName: normalized.channelName,
      videoUrl: normalized.videoUrl,
      thumbnailUrl: normalized.thumbnailUrl,
      durationSeconds: normalized.durationSeconds,
      hashtags: normalized.hashtags,
      languageDetected: detectedLang,
      vehicleCategory: detectVehicleCategory(normalized.title, normalized.hashtags),
      dachSignalTier: dachResult.tier,
      dachSignalScore: dachResult.score,
      // Facebook: always estimate HSI for non-owned Reels; others default to null until computed
      hsi: platform === 'facebook' ? 60.0 : null,
      hsiEstimated: platform === 'facebook',
      evShareWeight,
      // For facebook: pre-compute adjusted EV
      ev24h: platform === 'facebook' ? ((raw_data.evAdjusted as number) ?? null) : null,
      rawApiResponse: raw_data as unknown as Prisma.InputJsonValue,
    },
  })

  // Create initial snapshot from publish-time data
  await prisma.videoSnapshot.create({
    data: {
      videoId: video_id,
      snapshotAt: new Date(),
      hoursSincePublish: 0,
      viewCount: BigInt(normalized.viewCount ?? 0),
      likeCount: BigInt(normalized.likeCount ?? 0),
      commentCount: BigInt(normalized.commentCount ?? 0),
      shareCount: BigInt(normalized.shareCount ?? 0),
    },
  })

  // Schedule delayed snapshot collection jobs
  for (const delayMs of SNAPSHOT_DELAYS_MS) {
    await enqueueCollectSnapshot({ video_id, target_hours: delayMs / (60 * 60 * 1000) }, delayMs)
  }

  // Trigger initial metric computation
  await enqueueComputeMetrics({ video_id })

  job.log(`Ingested video ${video_id} (platform=${platform}, dach_tier=${dachResult.tier})`)
}

interface NormalizedVideoData {
  title: string
  channelId: string
  channelName: string
  channelCountry: string | null
  publishedAt: string
  thumbnailUrl: string
  videoUrl: string | null
  durationSeconds: number
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  hashtags: string[]
}

function normalizeRawData(platform: string, raw: Record<string, unknown>): NormalizedVideoData {
  switch (platform) {
    case 'youtube':
      return {
        title: String(raw.title ?? ''),
        channelId: String(raw.channelId ?? ''),
        channelName: String(raw.channelTitle ?? ''),
        channelCountry: null,
        publishedAt: String(raw.publishedAt ?? new Date().toISOString()),
        thumbnailUrl: String(raw.thumbnailUrl ?? ''),
        videoUrl: `https://www.youtube.com/watch?v=${raw.videoId}`,
        durationSeconds: Number(raw.durationSeconds ?? 0),
        viewCount: Number(raw.viewCount ?? 0),
        likeCount: Number(raw.likeCount ?? 0),
        commentCount: Number(raw.commentCount ?? 0),
        shareCount: 0,
        hashtags: (raw.tags as string[]) ?? [],
      }
    case 'tiktok':
      return {
        title: String(raw.title ?? ''),
        channelId: String(raw.channelId ?? ''),
        channelName: String(raw.channelName ?? ''),
        channelCountry: null,
        publishedAt: String(raw.publishedAt ?? new Date().toISOString()),
        thumbnailUrl: String(raw.thumbnailUrl ?? ''),
        videoUrl: String(raw.webVideoUrl ?? ''),
        durationSeconds: Number(raw.durationSeconds ?? 0),
        viewCount: Number(raw.viewCount ?? 0),
        likeCount: Number(raw.likeCount ?? 0),
        commentCount: Number(raw.commentCount ?? 0),
        shareCount: Number(raw.shareCount ?? 0),
        hashtags: (raw.hashtags as string[]) ?? [],
      }
    case 'instagram':
      return {
        title: String(raw.title ?? ''),
        channelId: String(raw.channelId ?? ''),
        channelName: String(raw.channelName ?? ''),
        channelCountry: null,
        publishedAt: String(raw.publishedAt ?? new Date().toISOString()),
        thumbnailUrl: String(raw.thumbnailUrl ?? ''),
        videoUrl: String(raw.webVideoUrl ?? ''),
        durationSeconds: Number(raw.durationSeconds ?? 0),
        viewCount: Number(raw.viewCount ?? 0),
        likeCount: Number(raw.likeCount ?? 0),
        commentCount: Number(raw.commentCount ?? 0),
        shareCount: 0,
        hashtags: (raw.hashtags as string[]) ?? [],
      }
    case 'facebook':
      return {
        title: String(raw.title ?? ''),
        channelId: String(raw.channelId ?? ''),
        channelName: String(raw.channelName ?? ''),
        channelCountry: null,
        publishedAt: String(raw.publishedAt ?? new Date().toISOString()),
        thumbnailUrl: String(raw.thumbnailUrl ?? ''),
        videoUrl: String(raw.webVideoUrl ?? ''),
        durationSeconds: 0,
        viewCount: raw.viewCount != null ? Number(raw.viewCount) : 0,
        likeCount: Number(raw.likeCount ?? 0),
        commentCount: Number(raw.commentCount ?? 0),
        shareCount: Number(raw.shareCount ?? 0),
        hashtags: (raw.hashtags as string[]) ?? [],
      }
    default:
      return {
        title: String(raw.title ?? ''),
        channelId: '',
        channelName: '',
        channelCountry: null,
        publishedAt: new Date().toISOString(),
        thumbnailUrl: '',
        videoUrl: null,
        durationSeconds: 0,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        hashtags: [],
      }
  }
}

function detectLanguage(text: string): string | null {
  if (!text || text.length < 10) return null
  const result = franc(text, { minLength: 10 })
  return result === 'und' ? null : result
}

const VEHICLE_KEYWORDS: Record<string, string> = {
  sportwagen: 'Sportwagen',
  sportscar: 'Sportwagen',
  gts: 'Sportwagen',
  suv: 'SUV',
  geländewagen: 'SUV',
  crossover: 'SUV',
  elektroauto: 'Elektroauto',
  elektro: 'Elektroauto',
  ev: 'Elektroauto',
  tesla: 'Elektroauto',
  tuning: 'Tuning',
  modified: 'Tuning',
  stance: 'Tuning',
  gebrauchtwagen: 'Gebrauchtwagen',
  usedcar: 'Gebrauchtwagen',
  probefahrt: 'Probefahrt',
  testdrive: 'Probefahrt',
  fahrbericht: 'Probefahrt',
  motorrad: 'Motorrad',
  motorcycle: 'Motorrad',
  moto: 'Motorrad',
}

function detectVehicleCategory(title: string, hashtags: string[]): string | null {
  const text = [title, ...hashtags].join(' ').toLowerCase()
  for (const [keyword, category] of Object.entries(VEHICLE_KEYWORDS)) {
    if (text.includes(keyword)) return category
  }
  return null
}
