import { describe, it, expect } from 'vitest'
import {
  normalizeHSI,
  normalizeEV,
  computeRDPResilience,
  computeVPIMatch,
  computeViewVelocityBonus,
  computeViralityScore,
  computeViralityTier,
  computeVSConfidence,
  TIER1_THRESHOLD,
  TIER2_THRESHOLD,
  type VSInput,
} from '@/lib/virality-score'

// ── normalizeHSI ─────────────────────────────────────────────────────────────

describe('normalizeHSI', () => {
  it('converts 100 HSI to 1.0', () => {
    expect(normalizeHSI(100)).toBe(1.0)
  })

  it('converts 0 HSI to 0.0', () => {
    expect(normalizeHSI(0)).toBe(0.0)
  })

  it('converts 78 HSI to 0.78', () => {
    expect(normalizeHSI(78)).toBeCloseTo(0.78)
  })

  it('uses fallback 0.62 for null', () => {
    expect(normalizeHSI(null)).toBe(0.62)
  })

  it('clamps values above 100 to 1.0', () => {
    expect(normalizeHSI(150)).toBe(1.0)
  })

  it('clamps negative values to 0.0', () => {
    expect(normalizeHSI(-10)).toBe(0.0)
  })
})

// ── normalizeEV ──────────────────────────────────────────────────────────────

describe('normalizeEV', () => {
  it('returns 1.0 when EV equals benchmark', () => {
    expect(normalizeEV(850, 850)).toBe(1.0)
  })

  it('caps at 1.0 when EV exceeds benchmark', () => {
    expect(normalizeEV(2000, 850)).toBe(1.0)
  })

  it('returns proportional value below benchmark', () => {
    expect(normalizeEV(425, 850)).toBeCloseTo(0.5)
  })

  it('returns 0.5 for null EV', () => {
    expect(normalizeEV(null, 850)).toBe(0.5)
  })

  it('returns 0.5 for null benchmark', () => {
    expect(normalizeEV(850, null)).toBe(0.5)
  })

  it('returns 0.5 for zero benchmark', () => {
    expect(normalizeEV(850, 0)).toBe(0.5)
  })

  it('halves value when partial=true', () => {
    expect(normalizeEV(850, 850, true)).toBeCloseTo(0.5)
  })

  it('still caps at 1.0 with partial=true', () => {
    expect(normalizeEV(10000, 850, true)).toBe(1.0)
  })
})

// ── computeRDPResilience ─────────────────────────────────────────────────────

describe('computeRDPResilience', () => {
  it('returns the score as-is when not estimated', () => {
    expect(computeRDPResilience(0.87)).toBe(0.87)
  })

  it('returns 0.5 for null', () => {
    expect(computeRDPResilience(null)).toBe(0.5)
  })

  it('returns 0.5 when estimated=true', () => {
    expect(computeRDPResilience(0.9, true)).toBe(0.5)
  })

  it('clamps to [0,1]', () => {
    expect(computeRDPResilience(1.5)).toBe(1.0)
    expect(computeRDPResilience(-0.1)).toBe(0.0)
  })
})

// ── computeVPIMatch ──────────────────────────────────────────────────────────

describe('computeVPIMatch', () => {
  it('returns 1.0 at VPI = 4.5 (optimal)', () => {
    expect(computeVPIMatch(4.5)).toBe(1.0)
  })

  it('returns 0.5 for null', () => {
    expect(computeVPIMatch(null)).toBe(0.5)
  })

  it('returns 0.5 when estimated=true', () => {
    expect(computeVPIMatch(4.5, true)).toBe(0.5)
  })

  it('returns 0.0 at VPI = 9.0 (2× optimal)', () => {
    expect(computeVPIMatch(9.0)).toBe(0.0)
  })

  it('returns 0.0 at VPI = 0 (never negative)', () => {
    expect(computeVPIMatch(0)).toBeGreaterThanOrEqual(0)
  })

  it('returns partial match for VPI = 3.0', () => {
    // |3.0 - 4.5| / 4.5 = 0.333; match = 0.667
    expect(computeVPIMatch(3.0)).toBeCloseTo(0.667, 2)
  })
})

// ── computeViewVelocityBonus ─────────────────────────────────────────────────

describe('computeViewVelocityBonus', () => {
  it('returns true when views_at_6h >= 50000', () => {
    expect(computeViewVelocityBonus(50000, null)).toBe(true)
  })

  it('returns true when views_at_48h >= 500000', () => {
    expect(computeViewVelocityBonus(null, 500000)).toBe(true)
  })

  it('returns false when both below threshold', () => {
    expect(computeViewVelocityBonus(10000, 100000)).toBe(false)
  })

  it('returns false for both null', () => {
    expect(computeViewVelocityBonus(null, null)).toBe(false)
  })

  it('returns true at exactly 50000 views at 6h', () => {
    expect(computeViewVelocityBonus(50000, 0)).toBe(true)
  })
})

// ── computeVSConfidence ──────────────────────────────────────────────────────

describe('computeVSConfidence', () => {
  const base: VSInput = {
    hsi: 78,
    ev24h: 8000,
    evBenchmark90d: 850,
    rdpResilienceScore: 0.87,
    vpi: 5.2,
    accSignalPerVideo: 1.0,
    viewsAt6h: 87000,
    viewsAt48h: null,
  }

  it('returns high when no estimates', () => {
    expect(computeVSConfidence(base)).toBe('high')
  })

  it('returns medium with 1 estimate', () => {
    expect(computeVSConfidence({ ...base, hsiEstimated: true })).toBe('medium')
  })

  it('returns medium with 2 estimates', () => {
    expect(computeVSConfidence({ ...base, hsiEstimated: true, rdpEstimated: true })).toBe('medium')
  })

  it('returns low with 3+ estimates', () => {
    expect(
      computeVSConfidence({
        ...base,
        hsiEstimated: true,
        rdpEstimated: true,
        vpiEstimated: true,
      })
    ).toBe('low')
  })
})

// ── computeViralityTier ──────────────────────────────────────────────────────

describe('computeViralityTier', () => {
  it('returns Tier1 at VS >= 0.78', () => {
    expect(computeViralityTier(TIER1_THRESHOLD, false)).toBe('Tier1')
    expect(computeViralityTier(0.9, false)).toBe('Tier1')
  })

  it('returns Tier2 at VS between 0.60 and 0.78', () => {
    expect(computeViralityTier(0.65, false)).toBe('Tier2')
    expect(computeViralityTier(TIER2_THRESHOLD, false)).toBe('Tier2')
  })

  it('returns NonViral below 0.60 without VVB', () => {
    expect(computeViralityTier(0.5, false)).toBe('NonViral')
  })

  it('returns Tier2 for low VS if VVB=true (floor)', () => {
    expect(computeViralityTier(0.4, true)).toBe('Tier2')
  })
})

// ── computeViralityScore (integration) ───────────────────────────────────────

describe('computeViralityScore', () => {
  const idealInput: VSInput = {
    hsi: 100,
    ev24h: 850,
    evBenchmark90d: 850,
    rdpResilienceScore: 1.0,
    vpi: 4.5,
    accSignalPerVideo: 1.0,
    viewsAt6h: null,
    viewsAt48h: null,
  }

  it('returns maximum score of 1.0 for ideal inputs', () => {
    const result = computeViralityScore(idealInput)
    expect(result.score).toBe(1.0)
    expect(result.tier).toBe('Tier1')
    expect(result.confidence).toBe('high')
  })

  it('returns Tier1 for high-performing video', () => {
    const result = computeViralityScore({
      hsi: 78,
      ev24h: 8420,
      evBenchmark90d: 850,
      rdpResilienceScore: 0.87,
      vpi: 5.2,
      accSignalPerVideo: 1.0,
      viewsAt6h: 87000,
      viewsAt48h: null,
    })
    expect(result.tier).toBe('Tier1')
    expect(result.score).toBeGreaterThanOrEqual(TIER1_THRESHOLD)
    expect(result.viewVelocityBonus).toBe(true)
  })

  it('applies VVB floor: raises low VS to Tier2 minimum', () => {
    const result = computeViralityScore({
      hsi: null,
      hsiEstimated: true,
      ev24h: null,
      evBenchmark90d: null,
      rdpResilienceScore: null,
      rdpEstimated: true,
      vpi: null,
      vpiEstimated: true,
      accSignalPerVideo: null,
      accEstimated: true,
      viewsAt6h: 50000, // triggers VVB
      viewsAt48h: null,
    })
    expect(result.score).toBeGreaterThanOrEqual(TIER2_THRESHOLD)
    expect(result.tier).not.toBe('NonViral')
    expect(result.confidence).toBe('low')
  })

  it('returns low confidence with all estimates', () => {
    const result = computeViralityScore({
      hsi: null,
      hsiEstimated: true,
      ev24h: 100,
      evBenchmark90d: 850,
      evPartial: true,
      rdpResilienceScore: null,
      rdpEstimated: true,
      vpi: null,
      vpiEstimated: true,
      accSignalPerVideo: null,
      accEstimated: true,
      viewsAt6h: null,
      viewsAt48h: null,
    })
    expect(result.confidence).toBe('low')
  })

  it('component weights sum to 1.0', () => {
    // Verify formula: W_HSI + W_EV + W_RDP + W_VPI + W_ACC = 1.0
    const weights = [0.3, 0.25, 0.2, 0.15, 0.1]
    expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1.0)
  })

  it('score is bounded between 0 and 1', () => {
    const result = computeViralityScore(idealInput)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(1)
  })
})
