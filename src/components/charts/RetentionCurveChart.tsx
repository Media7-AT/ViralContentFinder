'use client'

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
} from 'recharts'
import type { RetentionPoint, DropOffPoint } from '@/types/metrics'

interface Props {
  retentionCurve: RetentionPoint[] | null
  dropOffPoints?: DropOffPoint[] | null
  durationSeconds?: number | null
}

const NICHE_AVERAGE: RetentionPoint[] = [
  { t: 0, pct: 1.0 },
  { t: 5, pct: 0.85 },
  { t: 10, pct: 0.75 },
  { t: 20, pct: 0.65 },
  { t: 30, pct: 0.55 },
  { t: 45, pct: 0.45 },
  { t: 60, pct: 0.38 },
]

export function RetentionCurveChart({ retentionCurve, dropOffPoints, durationSeconds }: Props) {
  if (!retentionCurve || retentionCurve.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
        Retention curve not available (requires channel owner access)
      </div>
    )
  }

  const chartData = retentionCurve.map((p) => ({
    t: p.t,
    retention: Math.round(p.pct * 100),
    nicheAvg: Math.round(
      (NICHE_AVERAGE.find((n) => n.t >= p.t)?.pct ?? NICHE_AVERAGE[NICHE_AVERAGE.length - 1].pct) *
        100
    ),
  }))

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-blue-500 inline-block" /> This video
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-slate-400 border-dashed border-t inline-block" /> Niche avg
        </span>
        {dropOffPoints && dropOffPoints.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="text-red-500">▼</span> Drop-off
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="t"
            tickFormatter={(v) => `${v}s`}
            tick={{ fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            width={36}
          />
          <Tooltip
            formatter={(value: number | undefined, name: string | undefined) => [
              `${value ?? 0}%`,
              name === 'retention' ? 'Retention' : ('Niche Avg' as const),
            ]}
            labelFormatter={(t) => `${t}s`}
          />
          <Line type="monotone" dataKey="retention" stroke="#3b82f6" strokeWidth={2} dot={false} />
          <Line
            type="monotone"
            dataKey="nicheAvg"
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
          {/* Drop-off markers */}
          {dropOffPoints?.map((dp) => (
            <ReferenceLine
              key={dp.t}
              x={dp.t}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              label={{ value: '▼', fill: '#ef4444', fontSize: 10, position: 'top' }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Drop-off table */}
      {dropOffPoints && dropOffPoints.length > 0 && (
        <div className="text-xs space-y-1">
          {dropOffPoints.slice(0, 3).map((dp) => (
            <div key={dp.t} className="flex items-center gap-2 text-muted-foreground">
              <span className="text-red-500">▼</span>
              <span>
                t={dp.t}s — drop {Math.abs(dp.magnitude).toFixed(1)}%/s
                {dp.sceneType && ` · ${dp.sceneType}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
