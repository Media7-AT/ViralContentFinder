import type { ViralityTier, VSConfidence, VSComponents, VSResult } from '@/types/metrics'

// Weights
const W_HSI = 0.3
const W_EV = 0.25
const W_RDP = 0.2
const W_VPI = 0.15
const W_ACC = 0.1

// Tier thresholds
export const TIER1_THRESHOLD = 0.78
export const TIER2_THRESHOLD = 0.6

// VPI optimal target
const VPI_OPTIMAL = 4.5

// View velocity bonus thresholds
const VVB_6H_THRESHOLD = 50_000
const VVB_48H_THRESHOLD = 500_000

export interface VSInput {
  hsi: number | null
  hsiEstimated?: boolean
  ev24h: number | null
  evBenchmark90d: number | null
  evPartial?: boolean
  rdpResilienceScore: number | null
  rdpEstimated?: boolean
  vpi: number | null
  vpiEstimated?: boolean
  accSignalPerVideo: number | null
  accEstimated?: boolean
  viewsAt6h: number | null
  viewsAt48h: number | null
}

/** Normalize HSI (0–100 scale) to 0–1 */
export function normalizeHSI(hsi: number | null, fallback = 0.62): number {
  if (hsi === null) return fallback
  return Math.min(Math.max(hsi / 100, 0), 1)
}

/** Normalize EV against 90-day benchmark */
export function normalizeEV(
  ev24h: number | null,
  benchmark: number | null,
  partial = false
): number {
  if (ev24h === null || benchmark === null || benchmark <= 0) return 0.5
  const raw = ev24h / benchmark
  if (partial) return Math.min(raw * 0.5, 1.0)
  return Math.min(raw, 1.0)
}

/** Compute RDP resilience score from retention curve derivative points */
export function computeRDPResilience(rdpScore: number | null, estimated = false): number {
  if (rdpScore === null || estimated) return 0.5
  return Math.min(Math.max(rdpScore, 0), 1)
}

/** Compute VPI optimal match */
export function computeVPIMatch(vpi: number | null, estimated = false): number {
  if (vpi === null || estimated) return 0.5
  const raw = 1 - Math.abs(vpi - VPI_OPTIMAL) / VPI_OPTIMAL
  return Math.max(0, raw)
}

/** Whether views qualify for view velocity bonus */
export function computeViewVelocityBonus(
  viewsAt6h: number | null,
  viewsAt48h: number | null
): boolean {
  return (
    (viewsAt6h !== null && viewsAt6h >= VVB_6H_THRESHOLD) ||
    (viewsAt48h !== null && viewsAt48h >= VVB_48H_THRESHOLD)
  )
}

/** Determine VS confidence based on how many components were estimated */
export function computeVSConfidence(input: VSInput): VSConfidence {
  const estimatedCount = [
    input.hsiEstimated ?? false,
    input.rdpEstimated ?? false,
    input.vpiEstimated ?? false,
    input.accEstimated ?? false,
    input.evPartial ?? false,
  ].filter(Boolean).length

  if (estimatedCount === 0) return 'high'
  if (estimatedCount <= 2) return 'medium'
  return 'low'
}

/** Determine virality tier from VS score */
export function computeViralityTier(score: number, vvb: boolean): ViralityTier {
  if (score >= TIER1_THRESHOLD) return 'Tier1'
  if (score >= TIER2_THRESHOLD || vvb) return 'Tier2'
  return 'NonViral'
}

/** Master VS computation */
export function computeViralityScore(input: VSInput): VSResult {
  const hsiNormalized = normalizeHSI(input.hsi)
  const evNormalized = normalizeEV(input.ev24h, input.evBenchmark90d, input.evPartial)
  const rdpResilienceScore = computeRDPResilience(input.rdpResilienceScore, input.rdpEstimated)
  const vpiOptimalMatch = computeVPIMatch(input.vpi, input.vpiEstimated)
  const accSignalPerVideo = input.accSignalPerVideo !== null ? input.accSignalPerVideo : 0.5

  const rawScore =
    W_HSI * hsiNormalized +
    W_EV * evNormalized +
    W_RDP * rdpResilienceScore +
    W_VPI * vpiOptimalMatch +
    W_ACC * accSignalPerVideo

  const vvb = computeViewVelocityBonus(input.viewsAt6h, input.viewsAt48h)

  // Apply VVB floor: fast-breaking content is never classified as NonViral
  const score = vvb ? Math.max(rawScore, TIER2_THRESHOLD) : rawScore

  const components: VSComponents = {
    hsiNormalized,
    evNormalized,
    rdpResilienceScore,
    vpiOptimalMatch,
    accSignalPerVideo,
  }

  return {
    score: Math.round(score * 1000) / 1000,
    tier: computeViralityTier(score, vvb),
    confidence: computeVSConfidence(input),
    components,
    viewVelocityBonus: vvb,
  }
}
