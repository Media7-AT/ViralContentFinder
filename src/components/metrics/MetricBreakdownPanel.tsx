'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ViralityScoreBadge } from './ViralityScoreBadge'
import { HSIBadge } from './HSIBadge'
import { RetentionCurveChart } from '@/components/charts/RetentionCurveChart'
import { EngagementVelocityPanel } from '@/components/charts/EngagementVelocityPanel'
import { GeoDonutChart } from '@/components/charts/GeoDonutChart'
import { ComponentBreakdownBar } from '@/components/charts/ComponentBreakdownBar'
import type { VideoAnalysisFull } from '@/types/video'
import type { VSComponents } from '@/types/metrics'

interface Props {
  video: VideoAnalysisFull
}

export function MetricBreakdownPanel({ video }: Props) {
  const vsComponents: VSComponents | null =
    video.viralityScore !== null
      ? {
          hsiNormalized: video.hsi !== null ? video.hsi / 100 : 0.62,
          evNormalized:
            video.ev24h !== null && video.evBenchmark90d
              ? Math.min(video.ev24h / video.evBenchmark90d, 1.0)
              : 0.5,
          rdpResilienceScore: video.rdpResilienceScore ?? 0.5,
          vpiOptimalMatch: video.vpiOptimalMatch ?? 0.5,
          accSignalPerVideo: video.accSignalPerVideo ?? 0.5,
        }
      : null

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* VS Score Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Virality Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <ViralityScoreBadge
              score={video.viralityScore}
              tier={video.viralityTier}
              confidence={video.vsConfidence}
              size="lg"
            />
            <div className="space-y-1 text-xs text-muted-foreground">
              {video.viewVelocityBonus && (
                <Badge variant="outline" className="text-green-600 border-green-300">
                  ⚡ View Velocity Bonus
                </Badge>
              )}
              {video.vsConfidence === 'low' && (
                <p className="text-amber-600">⚠ Low confidence (3+ metrics estimated)</p>
              )}
            </div>
          </div>
          <ComponentBreakdownBar components={vsComponents} score={video.viralityScore} />
        </CardContent>
      </Card>

      {/* Key Metrics Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Metric Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <MetricRow label="HSI">
              <HSIBadge hsi={video.hsi} estimated={video.hsiEstimated} />
            </MetricRow>
            <MetricRow label="VPI">
              {video.vpi != null
                ? `${video.vpi.toFixed(1)} cuts/10s (match: ${((video.vpiOptimalMatch ?? 0.5) * 100).toFixed(0)}%)`
                : '—'}
            </MetricRow>
            <MetricRow label="BPM">
              {video.bpm != null
                ? `${Math.round(video.bpm)} bpm · ${video.dominantFreqBand ?? '—'}`
                : '—'}
            </MetricRow>
            <MetricRow label="RDP Resilience">
              {video.rdpResilienceScore != null
                ? `${(video.rdpResilienceScore * 100).toFixed(0)}%${video.rdpEstimated ? ' (est.)' : ''}`
                : '—'}
            </MetricRow>
            <MetricRow label="ACC Signal">
              {video.accSignalPerVideo != null
                ? `${video.accSignalPerVideo.toFixed(2)}${video.accEstimated ? ' (est.)' : ''}`
                : '—'}
            </MetricRow>
          </dl>
        </CardContent>
      </Card>

      {/* Engagement Velocity */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Engagement Velocity</CardTitle>
        </CardHeader>
        <CardContent>
          <EngagementVelocityPanel ev1h={video.ev1h} ev6h={video.ev6h} ev24h={video.ev24h} />
        </CardContent>
      </Card>

      {/* Retention Curve */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Retention Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <RetentionCurveChart
            retentionCurve={video.retentionCurve}
            dropOffPoints={video.dropOffPoints}
            durationSeconds={video.durationSeconds}
          />
        </CardContent>
      </Card>

      {/* Geo Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">DACH Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <GeoDonutChart distribution={video.geoDistribution} />
        </CardContent>
      </Card>

      {/* Hashtags */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Hashtags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {video.hashtags.length > 0 ? (
              video.hashtags.slice(0, 20).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">No hashtags</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="font-medium text-right">{children}</dd>
    </div>
  )
}
