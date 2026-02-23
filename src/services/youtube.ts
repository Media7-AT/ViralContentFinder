import axios from 'axios'

const BASE_URL = 'https://www.googleapis.com/youtube/v3'
const REGION_CODES = ['DE', 'AT', 'CH'] as const
const MAX_RESULTS_PER_SEARCH = 20

const DACH_KEYWORDS = [
  'Autohaus',
  'Probefahrt',
  'Sportwagen',
  'Gebrauchtwagen',
  'Tuning',
  'Elektroauto',
  'Fahrbericht',
  'Autotest',
  'Autokauf',
  'car review Deutschland',
  'Neuwagen Test',
]

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) throw new Error('YOUTUBE_API_KEY is not set')
  return key
}

export interface YoutubeVideoRaw {
  videoId: string
  title: string
  channelId: string
  channelTitle: string
  publishedAt: string
  thumbnailUrl: string
  durationIso: string
  viewCount: number
  likeCount: number
  commentCount: number
  defaultAudioLanguage: string | null
  tags: string[]
  regionCode: string
}

interface SearchItem {
  id: { videoId: string }
  snippet: {
    title: string
    channelId: string
    channelTitle: string
    publishedAt: string
    thumbnails: { medium?: { url: string }; default?: { url: string } }
    defaultAudioLanguage?: string
    tags?: string[]
  }
}

interface VideoItem {
  id: string
  contentDetails: { duration: string }
  statistics: {
    viewCount?: string
    likeCount?: string
    commentCount?: string
  }
  snippet: {
    defaultAudioLanguage?: string
    tags?: string[]
  }
}

/** Search YouTube for DACH automotive short-form videos, return raw video data */
export async function searchDachAutomotiveVideos(
  publishedAfter?: Date
): Promise<YoutubeVideoRaw[]> {
  const apiKey = getApiKey()
  const after = (publishedAfter ?? new Date(Date.now() - 48 * 60 * 60 * 1000)).toISOString()

  const videoIdMap = new Map<string, SearchItem & { regionCode: string }>()

  // Search across all DACH regions and a few keywords
  const keywords = DACH_KEYWORDS.slice(0, 3) // Limit to 3 keywords to stay within quota
  for (const regionCode of REGION_CODES) {
    for (const keyword of keywords) {
      try {
        const res = await axios.get<{ items: SearchItem[] }>(`${BASE_URL}/search`, {
          params: {
            key: apiKey,
            q: keyword,
            type: 'video',
            videoDuration: 'short',
            publishedAfter: after,
            regionCode,
            maxResults: MAX_RESULTS_PER_SEARCH,
            part: 'snippet',
            relevanceLanguage: 'de',
          },
          timeout: 15_000,
        })
        for (const item of res.data.items ?? []) {
          if (!videoIdMap.has(item.id.videoId)) {
            videoIdMap.set(item.id.videoId, { ...item, regionCode })
          }
        }
      } catch (err) {
        console.error(`[YouTube] Search failed for ${keyword} / ${regionCode}:`, err)
      }
    }
  }

  if (videoIdMap.size === 0) return []

  // Batch fetch video details (50 IDs per request)
  const ids = [...videoIdMap.keys()]
  const details = await batchFetchVideoDetails(ids, apiKey)

  return ids.flatMap((videoId) => {
    const searchItem = videoIdMap.get(videoId)!
    const detail = details.get(videoId)
    if (!detail) return []

    return [
      {
        videoId,
        title: searchItem.snippet.title,
        channelId: searchItem.snippet.channelId,
        channelTitle: searchItem.snippet.channelTitle,
        publishedAt: searchItem.snippet.publishedAt,
        thumbnailUrl:
          searchItem.snippet.thumbnails.medium?.url ??
          searchItem.snippet.thumbnails.default?.url ??
          '',
        durationIso: detail.contentDetails.duration,
        viewCount: parseInt(detail.statistics.viewCount ?? '0', 10),
        likeCount: parseInt(detail.statistics.likeCount ?? '0', 10),
        commentCount: parseInt(detail.statistics.commentCount ?? '0', 10),
        defaultAudioLanguage: detail.snippet.defaultAudioLanguage ?? null,
        tags: detail.snippet.tags ?? [],
        regionCode: searchItem.regionCode,
      },
    ]
  })
}

async function batchFetchVideoDetails(
  ids: string[],
  apiKey: string
): Promise<Map<string, VideoItem>> {
  const map = new Map<string, VideoItem>()
  const batchSize = 50

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize)
    try {
      const res = await axios.get<{ items: VideoItem[] }>(`${BASE_URL}/videos`, {
        params: {
          key: apiKey,
          id: batch.join(','),
          part: 'snippet,statistics,contentDetails',
        },
        timeout: 15_000,
      })
      for (const item of res.data.items ?? []) {
        map.set(item.id, item)
      }
    } catch (err) {
      console.error('[YouTube] Batch video fetch failed:', err)
    }
  }

  return map
}

/** Parse ISO 8601 duration (PT1M30S) to seconds */
export function parseDurationToSeconds(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  return (
    parseInt(match[1] ?? '0', 10) * 3600 +
    parseInt(match[2] ?? '0', 10) * 60 +
    parseInt(match[3] ?? '0', 10)
  )
}
