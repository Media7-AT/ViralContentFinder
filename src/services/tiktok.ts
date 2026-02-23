import { runApifyActor } from './apify'

const APIFY_TIKTOK_ACTOR = 'clockworks/tiktok-scraper'

const DACH_HASHTAGS = [
  'autohaus',
  'probefahrt',
  'sportwagen',
  'elektroauto',
  'tuning',
  'gebrauchtwagen',
  'neuewagen',
  'fahrbericht',
  'autotest',
  'bmw',
  'mercedes',
  'audi',
  'porsche',
  'volkswagen',
]

export interface TikTokVideoRaw {
  videoId: string
  title: string
  channelId: string
  channelName: string
  publishedAt: string
  thumbnailUrl: string
  durationSeconds: number
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  hashtags: string[]
  musicId: string | null
  webVideoUrl: string
}

interface ApifyTikTokItem {
  id: string
  text?: string
  authorMeta?: { id: string; name: string; nickName?: string }
  createTimeISO?: string
  createTime?: number
  covers?: { default?: string; dynamic?: string }
  videoMeta?: { duration?: number }
  playCount?: number
  diggCount?: number
  commentCount?: number
  shareCount?: number
  hashtags?: Array<{ name: string }>
  musicMeta?: { musicId?: string }
  webVideoUrl?: string
}

/** Scrape DACH automotive TikTok videos via Apify */
export async function searchDachAutomotiveTikToks(): Promise<TikTokVideoRaw[]> {
  const items = (await runApifyActor(APIFY_TIKTOK_ACTOR, {
    hashtags: DACH_HASHTAGS.slice(0, 5), // Limit to control cost
    maxItems: 50,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
  })) as ApifyTikTokItem[]

  return items.flatMap((item) => {
    if (!item.id) return []

    const publishedAt =
      item.createTimeISO ??
      (item.createTime ? new Date(item.createTime * 1000).toISOString() : new Date().toISOString())

    return [
      {
        videoId: item.id,
        title: item.text ?? '',
        channelId: item.authorMeta?.id ?? '',
        channelName: item.authorMeta?.nickName ?? item.authorMeta?.name ?? '',
        publishedAt,
        thumbnailUrl: item.covers?.default ?? item.covers?.dynamic ?? '',
        durationSeconds: item.videoMeta?.duration ?? 0,
        viewCount: item.playCount ?? 0,
        likeCount: item.diggCount ?? 0,
        commentCount: item.commentCount ?? 0,
        shareCount: item.shareCount ?? 0,
        hashtags: (item.hashtags ?? []).map((h) => h.name),
        musicId: item.musicMeta?.musicId ?? null,
        webVideoUrl:
          item.webVideoUrl ?? `https://www.tiktok.com/@${item.authorMeta?.name}/video/${item.id}`,
      },
    ]
  })
}
