import { runApifyActor } from './apify'
import axios from 'axios'

const APIFY_FB_ACTOR = 'apify/facebook-posts-scraper'

// Seed list of high-value DACH automotive Facebook Pages
const DACH_AUTO_PAGES = [
  'autobild',
  'adac',
  'autohaus24',
  'autoscout24',
  'mobile.de',
  'bmwdeutschland',
  'mercedesbenz',
  'volkswagen',
  'audiofficial',
  'porsche',
  'opel',
  'fordgermany',
  'skodadeutschland',
]

// Facebook EV share weight (shares × 1.5)
const FB_SHARE_WEIGHT = 1.5

export interface FacebookVideoRaw {
  videoId: string
  title: string
  channelId: string
  channelName: string
  publishedAt: string
  thumbnailUrl: string
  durationSeconds: number
  viewCount: number | null // may be null — Facebook hides views on some Reels
  likeCount: number
  commentCount: number
  shareCount: number
  evAdjusted: number // reactions + comments + (shares × 1.5)
  hashtags: string[]
  webVideoUrl: string
  hsiEstimated: true // Always true for non-owned Reels
  evShareWeight: 1.5
}

interface ApifyFacebookItem {
  postId?: string
  url?: string
  pageName?: string
  pageId?: string
  time?: string
  message?: string
  videoPlayCount?: number
  reactionsCount?: number
  commentsCount?: number
  sharesCount?: number
  videoUrl?: string
  thumbnailUrl?: string
}

/** Scrape DACH automotive Facebook Reels via Apify */
export async function searchDachAutomotiveFacebookReels(): Promise<FacebookVideoRaw[]> {
  const items = (await runApifyActor(APIFY_FB_ACTOR, {
    startUrls: DACH_AUTO_PAGES.slice(0, 5).map((page) => ({
      url: `https://www.facebook.com/${page}/videos`,
    })),
    maxPosts: 20,
    scrapeAbout: false,
    scrapeReviews: false,
    scrapeComments: false,
  })) as ApifyFacebookItem[]

  return items.flatMap((item) => {
    if (!item.postId) return []

    const reactions = item.reactionsCount ?? 0
    const comments = item.commentsCount ?? 0
    const shares = item.sharesCount ?? 0
    const evAdjusted = reactions + comments + shares * FB_SHARE_WEIGHT

    const hashtags = extractHashtags(item.message ?? '')

    return [
      {
        videoId: item.postId,
        title: item.message ?? '',
        channelId: item.pageId ?? '',
        channelName: item.pageName ?? '',
        publishedAt: item.time ?? new Date().toISOString(),
        thumbnailUrl: item.thumbnailUrl ?? '',
        durationSeconds: 0, // Not available from Apify scraper
        viewCount: item.videoPlayCount ?? null,
        likeCount: reactions,
        commentCount: comments,
        shareCount: shares,
        evAdjusted,
        hashtags,
        webVideoUrl: item.url ?? '',
        hsiEstimated: true,
        evShareWeight: 1.5,
      },
    ]
  })
}

/** Fetch video insights for owned Facebook Pages using Graph API */
export async function fetchOwnedPageVideoInsights(videoId: string): Promise<{
  totalViews: number
  avgWatchTimeSeconds: number
  countryBreakdown: Record<string, number>
} | null> {
  const token = process.env.META_PAGE_ACCESS_TOKEN
  if (!token) return null

  try {
    const res = await axios.get(`https://graph.facebook.com/v19.0/${videoId}/video_insights`, {
      params: {
        metric: 'total_video_views,total_video_avg_watch_time,total_video_view_time_by_country_id',
        access_token: token,
      },
      timeout: 10_000,
    })

    const data: Array<{ name: string; values: Array<{ value: number | Record<string, number> }> }> =
      res.data.data ?? []

    const getValue = (name: string) => data.find((d) => d.name === name)?.values?.[0]?.value

    return {
      totalViews: (getValue('total_video_views') as number) ?? 0,
      avgWatchTimeSeconds: (getValue('total_video_avg_watch_time') as number) ?? 0,
      countryBreakdown:
        (getValue('total_video_view_time_by_country_id') as Record<string, number>) ?? {},
    }
  } catch {
    return null
  }
}

function extractHashtags(text: string): string[] {
  return (text.match(/#[\w]+/g) ?? []).map((h) => h.slice(1).toLowerCase())
}
