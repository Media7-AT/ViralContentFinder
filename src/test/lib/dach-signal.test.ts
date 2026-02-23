import { describe, it, expect } from 'vitest'
import {
  countDachHashtags,
  isCountryInDach,
  computeDachSignal,
  passesDachFilter,
} from '@/lib/dach-signal'

// ── countDachHashtags ─────────────────────────────────────────────────────────

describe('countDachHashtags', () => {
  it('counts matching DACH hashtags', () => {
    expect(countDachHashtags(['#autohaus', '#probefahrt', '#random'])).toBe(2)
  })

  it('handles hashtags without # prefix', () => {
    expect(countDachHashtags(['autohaus', 'bmw'])).toBe(2)
  })

  it('is case-insensitive', () => {
    expect(countDachHashtags(['#Autohaus', '#BMW'])).toBe(2)
  })

  it('returns 0 for empty array', () => {
    expect(countDachHashtags([])).toBe(0)
  })

  it('returns 0 for non-DACH hashtags', () => {
    expect(countDachHashtags(['#fashion', '#travel', '#food'])).toBe(0)
  })

  it('counts English equivalents (carreview, testdrive)', () => {
    expect(countDachHashtags(['#carreview', '#testdrive'])).toBe(2)
  })
})

// ── isCountryInDach ───────────────────────────────────────────────────────────

describe('isCountryInDach', () => {
  it('returns true for DE', () => expect(isCountryInDach('DE')).toBe(true))
  it('returns true for AT', () => expect(isCountryInDach('AT')).toBe(true))
  it('returns true for CH', () => expect(isCountryInDach('CH')).toBe(true))
  it('is case-insensitive', () => expect(isCountryInDach('de')).toBe(true))
  it('returns false for US', () => expect(isCountryInDach('US')).toBe(false))
  it('returns false for null', () => expect(isCountryInDach(null)).toBe(false))
  it('returns false for empty string', () => expect(isCountryInDach('')).toBe(false))
})

// ── computeDachSignal ─────────────────────────────────────────────────────────

describe('computeDachSignal', () => {
  const tier1Params = {
    languageDetected: 'de',
    hashtags: ['#autohaus', '#bmw'],
    channelCountry: 'DE',
  }

  it('assigns Tier 1 for all three signals present', () => {
    const result = computeDachSignal(tier1Params)
    expect(result.tier).toBe(1)
  })

  it('assigns Tier 2 for German language only', () => {
    const result = computeDachSignal({
      languageDetected: 'de',
      hashtags: [],
      channelCountry: null,
    })
    expect(result.tier).toBe(2)
  })

  it('assigns Tier 2 for >= 2 DACH hashtags', () => {
    const result = computeDachSignal({
      languageDetected: null,
      hashtags: ['#autohaus', '#probefahrt'],
      channelCountry: null,
    })
    expect(result.tier).toBe(2)
  })

  it('assigns Tier 3 for single weak hashtag', () => {
    const result = computeDachSignal({
      languageDetected: null,
      hashtags: ['#autohaus'],
      channelCountry: null,
    })
    expect(result.tier).toBe(3)
  })

  it('assigns Tier 3 for no signals', () => {
    const result = computeDachSignal({
      languageDetected: null,
      hashtags: [],
      channelCountry: null,
    })
    expect(result.tier).toBe(3)
  })

  it('computes correct estimated_DACH_pct for full Tier 1', () => {
    // 0.5 × 1 + 0.3 × min(2/3, 1) + 0.2 × 1 = 0.5 + 0.2 + 0.2 = 0.9
    const result = computeDachSignal(tier1Params)
    expect(result.estimatedDachPct).toBeCloseTo(0.9, 2)
  })

  it('computes correct estimated_DACH_pct for language only', () => {
    // 0.5 × 1 + 0 + 0 = 0.5
    const result = computeDachSignal({
      languageDetected: 'de',
      hashtags: [],
      channelCountry: null,
    })
    expect(result.estimatedDachPct).toBeCloseTo(0.5, 2)
  })

  it('caps hashtag contribution at 1.0 for large hashtag count', () => {
    const result = computeDachSignal({
      languageDetected: 'de',
      hashtags: ['#autohaus', '#bmw', '#audi', '#porsche', '#mercedes'],
      channelCountry: 'DE',
    })
    // hashtag contribution: 0.3 × min(5/3, 1.0) = 0.3
    expect(result.estimatedDachPct).toBeCloseTo(1.0, 2)
  })

  it('records signal details correctly', () => {
    const result = computeDachSignal(tier1Params)
    expect(result.signals.languageIsGerman).toBe(true)
    expect(result.signals.dachHashtagCount).toBe(2)
    expect(result.signals.channelCountryInDach).toBe(true)
  })
})

// ── passesDachFilter ──────────────────────────────────────────────────────────

describe('passesDachFilter', () => {
  it('passes Tier 1 signal (score >= 0.40)', () => {
    const result = computeDachSignal({
      languageDetected: 'de',
      hashtags: ['#autohaus'],
      channelCountry: 'DE',
    })
    expect(passesDachFilter(result)).toBe(true)
  })

  it('fails Tier 3 weak signal (score < 0.40)', () => {
    const result = computeDachSignal({
      languageDetected: null,
      hashtags: [],
      channelCountry: null,
    })
    expect(passesDachFilter(result)).toBe(false)
  })
})
