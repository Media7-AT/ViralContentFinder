import axios from 'axios'

const AUDD_API_URL = 'https://api.audd.io/'

export interface AudioAnalysisResult {
  bpm: number | null
  dominantFreqBand: 'bass' | 'mid' | 'treble' | null
  title: string | null
  artist: string | null
}

/** Extract BPM and audio metadata from a URL using AudD API */
export async function analyzeAudioFromUrl(audioUrl: string): Promise<AudioAnalysisResult> {
  const token = process.env.AUDD_API_TOKEN
  if (!token) {
    console.warn('[AudD] AUDD_API_TOKEN not set — skipping audio analysis')
    return { bpm: null, dominantFreqBand: null, title: null, artist: null }
  }

  try {
    const res = await axios.post(
      AUDD_API_URL,
      new URLSearchParams({
        url: audioUrl,
        api_token: token,
        return: 'spotify',
      }),
      { timeout: 30_000 }
    )

    const result = res.data?.result
    if (!result) return { bpm: null, dominantFreqBand: null, title: null, artist: null }

    const bpm: number | null = result.spotify?.audio_features?.tempo ?? null
    const energy: number | null = result.spotify?.audio_features?.energy ?? null

    return {
      bpm,
      dominantFreqBand: classifyFreqBand(energy),
      title: result.title ?? null,
      artist: result.artist ?? null,
    }
  } catch (err) {
    console.error('[AudD] Audio analysis failed:', err)
    return { bpm: null, dominantFreqBand: null, title: null, artist: null }
  }
}

/**
 * Rough frequency band classification from Spotify energy score.
 * Energy 0.0–0.4 → bass-heavy, 0.4–0.7 → mid, 0.7–1.0 → treble-heavy
 */
function classifyFreqBand(energy: number | null): 'bass' | 'mid' | 'treble' | null {
  if (energy === null) return null
  if (energy < 0.4) return 'bass'
  if (energy < 0.7) return 'mid'
  return 'treble'
}
