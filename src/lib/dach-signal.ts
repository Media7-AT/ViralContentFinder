import type { DachSignalResult } from '@/types/metrics'

const DACH_HASHTAGS = new Set([
  'autohaus',
  'probefahrt',
  'sportwagen',
  'gebrauchtwagen',
  'tuning',
  'elektroauto',
  'neuewagen',
  'autotest',
  'fahrbericht',
  'autokauf',
  'gebrauchtwagenkauf',
  'dachautomotive',
  'deutschesauto',
  'bmw',
  'mercedes',
  'audi',
  'volkswagen',
  'porsche',
  'opel',
  // English equivalents
  'carreview',
  'testdrive',
  'sportscar',
  'electriccar',
  'usedcar',
  'cardealer',
  'germancars',
])

const DACH_COUNTRIES = new Set(['DE', 'AT', 'CH'])

/** Normalize a hashtag: strip # prefix and lowercase */
function normalizeHashtag(tag: string): string {
  return tag.replace(/^#/, '').toLowerCase().trim()
}

/** Count how many DACH automotive hashtags appear in the list */
export function countDachHashtags(hashtags: string[]): number {
  return hashtags.filter((tag) => DACH_HASHTAGS.has(normalizeHashtag(tag))).length
}

/** Check if a country code is in DACH */
export function isCountryInDach(country: string | null | undefined): boolean {
  if (!country) return false
  return DACH_COUNTRIES.has(country.toUpperCase())
}

/**
 * Compute DACH geo signal score using the formula from CONCEPT.md Section 3.4
 *
 * estimated_DACH_pct =
 *   0.5 × (language_is_german ? 1 : 0) +
 *   0.3 × min(dach_hashtag_count / 3, 1.0) +
 *   0.2 × (channel_country_in_DACH ? 1 : 0)
 */
export function computeDachSignal(params: {
  languageDetected: string | null
  hashtags: string[]
  channelCountry: string | null
}): DachSignalResult {
  const languageIsGerman =
    params.languageDetected !== null &&
    (params.languageDetected === 'de' || params.languageDetected.startsWith('de-'))

  const dachHashtagCount = countDachHashtags(params.hashtags)
  const channelCountryInDach = isCountryInDach(params.channelCountry)

  const estimatedDachPct =
    0.5 * (languageIsGerman ? 1 : 0) +
    0.3 * Math.min(dachHashtagCount / 3, 1.0) +
    0.2 * (channelCountryInDach ? 1 : 0)

  // Tier classification
  let tier: 1 | 2 | 3
  if (languageIsGerman && dachHashtagCount >= 1 && channelCountryInDach) {
    tier = 1 // Tier 1: all three signals
  } else if (languageIsGerman || dachHashtagCount >= 2) {
    tier = 2 // Tier 2: language OR ≥2 hashtags
  } else {
    tier = 3 // Tier 3: weak signal
  }

  return {
    tier,
    score: Math.round(estimatedDachPct * 100) / 100,
    estimatedDachPct,
    signals: {
      languageIsGerman,
      dachHashtagCount,
      channelCountryInDach,
    },
  }
}

/** Returns true if the video passes the DACH geo filter (Tier 1 or 2) */
export function passesDachFilter(result: DachSignalResult): boolean {
  return result.estimatedDachPct >= 0.4
}
