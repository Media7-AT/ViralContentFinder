export type Platform = 'youtube' | 'tiktok' | 'instagram' | 'facebook'

export type ViralityTier = 'Tier1' | 'Tier2' | 'NonViral'

export type VSConfidence = 'high' | 'medium' | 'low'

export type FreqBand = 'bass' | 'mid' | 'treble'

export type VehicleCategory =
  | 'Sportwagen'
  | 'SUV'
  | 'Elektroauto'
  | 'Tuning'
  | 'Gebrauchtwagen'
  | 'Probefahrt'
  | 'Motorrad'

export type DachSignalTier = 1 | 2 | 3

export interface HSIBadgeVariant {
  label: string
  color: 'red' | 'yellow' | 'blue' | 'green'
}

export interface RetentionPoint {
  t: number
  pct: number
}

export interface DropOffPoint {
  t: number
  magnitude: number
  sceneType?: string
}

export interface GeoDistribution {
  DE?: number
  AT?: number
  CH?: number
  [key: string]: number | undefined
}

export interface VSComponents {
  hsiNormalized: number
  evNormalized: number
  rdpResilienceScore: number
  vpiOptimalMatch: number
  accSignalPerVideo: number
}

export interface VSResult {
  score: number
  tier: ViralityTier
  confidence: VSConfidence
  components: VSComponents
  viewVelocityBonus: boolean
}

export interface DachSignalResult {
  tier: DachSignalTier
  score: number
  estimatedDachPct: number
  signals: {
    languageIsGerman: boolean
    dachHashtagCount: number
    channelCountryInDach: boolean
  }
}
