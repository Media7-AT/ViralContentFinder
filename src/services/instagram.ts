import { runApifyActor } from './apify'

const APIFY_INSTAGRAM_ACTOR = 'apify/instagram-scraper'

const DACH_HASHTAGS = [
  'autohaus',
  'probefahrt',
  'sportwagen',
  'elektroauto',
  'tuning',
  'gebrauchtwagen',
  'neuewagen',
  'fahrbericht',
  'bmw',
  'mercedes',
]

export interface InstagramVideoRaw {
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
  hashtags: string[]
  webVideoUrl: string
}

interface ApifyInstagramItem {
  id?: string
  shortCode?: string
  caption?: string
  ownerUsername?: string
  ownerId?: string
  timestamp?: string
  displayUrl?: string
  videoViewCount?: number
  likesCount?: number
  commentsCount?: number
  videoDuration?: number
  hashtags?: string[]
  url?: string
}

/** Scrape DACH automotive Instagram Reels via Apify */
export async function searchDachAutomotiveReels(): Promise<InstagramVideoRaw[]> {
  const items = (await runApifyActor(APIFY_INSTAGRAM_ACTOR, {
    hashtags: DACH_HASHTAGS.slice(0, 5),
    resultsType: 'posts',
    resultsLimit: 50,
    mediaType: 'VIDEO',
  })) as ApifyInstagramItem[]

  return items.flatMap((item) => {
    if (!item.id && !item.shortCode) return []

    const videoId = item.id ?? item.shortCode ?? ''
    const hashtags = item.hashtags ?? extractHashtags(item.caption ?? '')

    return [
      {
        videoId,
        title: item.caption ?? '',
        channelId: item.ownerId ?? '',
        channelName: item.ownerUsername ?? '',
        publishedAt: item.timestamp ?? new Date().toISOString(),
        thumbnailUrl: item.displayUrl ?? '',
        durationSeconds: item.videoDuration ?? 0,
        viewCount: item.videoViewCount ?? 0,
        likeCount: item.likesCount ?? 0,
        commentCount: item.commentsCount ?? 0,
        hashtags,
        webVideoUrl: item.url ?? `https://www.instagram.com/reel/${videoId}/`,
      },
    ]
  })
}

function extractHashtags(text: string): string[] {
  return (text.match(/#[\w]+/g) ?? []).map((h) => h.slice(1).toLowerCase())
}
