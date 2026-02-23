import { Card, CardContent } from '@/components/ui/card'
import type { GetMetricsSummaryResponse } from '@/types/api'

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  facebook: 'Facebook',
}

interface Props {
  summary: GetMetricsSummaryResponse
}

export function KPITileRow({ summary }: Props) {
  const vsDelta = summary.avg_vs_current_period - summary.avg_vs_previous_period
  const deltaSign = vsDelta >= 0 ? '+' : ''

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KPITile
        label="Videos Analyzed"
        value={summary.total_videos_analyzed.toLocaleString('de-DE')}
        sub="Rolling 30 days"
      />
      <KPITile
        label="Avg Virality Score"
        value={summary.avg_vs_current_period.toFixed(2)}
        sub={`${deltaSign}${vsDelta.toFixed(2)} vs. last period`}
        deltaPositive={vsDelta >= 0}
      />
      <KPITile
        label="Top Platform"
        value={
          summary.top_platform
            ? (PLATFORM_LABELS[summary.top_platform] ?? summary.top_platform)
            : '—'
        }
        sub="By avg VS"
      />
      <KPITile label="Top Category" value={summary.top_vehicle_category ?? '—'} sub="By avg VS" />
    </div>
  )
}

function KPITile({
  label,
  value,
  sub,
  deltaPositive,
}: {
  label: string
  value: string
  sub: string
  deltaPositive?: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
        <p
          className={`text-xs mt-0.5 ${
            deltaPositive === true
              ? 'text-green-600'
              : deltaPositive === false
                ? 'text-red-500'
                : 'text-muted-foreground'
          }`}
        >
          {sub}
        </p>
      </CardContent>
    </Card>
  )
}
