'use client'

import type { VSComponents } from '@/types/metrics'

interface Props {
  components: VSComponents | null
  score: number | null
}

const COMPONENT_CONFIG = [
  { key: 'hsiNormalized', label: 'HSI', weight: 0.3, color: 'bg-blue-500' },
  { key: 'evNormalized', label: 'EV', weight: 0.25, color: 'bg-green-500' },
  { key: 'rdpResilienceScore', label: 'RDP', weight: 0.2, color: 'bg-purple-500' },
  { key: 'vpiOptimalMatch', label: 'VPI', weight: 0.15, color: 'bg-orange-500' },
  { key: 'accSignalPerVideo', label: 'ACC', weight: 0.1, color: 'bg-pink-500' },
] as const

export function ComponentBreakdownBar({ components, score }: Props) {
  if (!components || score === null) {
    return <div className="text-muted-foreground text-sm">No breakdown available</div>
  }

  return (
    <div className="space-y-2">
      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex">
        {COMPONENT_CONFIG.map(({ key, color, weight }) => {
          const contribution = components[key] * weight
          const pct = (contribution / score) * 100
          return (
            <div
              key={key}
              className={`${color} h-full transition-all`}
              style={{ width: `${Math.max(pct, 0)}%` }}
              title={`${key}: ${contribution.toFixed(3)}`}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="space-y-1">
        {COMPONENT_CONFIG.map(({ key, label, color, weight }) => {
          const raw = components[key]
          const contribution = raw * weight
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className={`w-2.5 h-2.5 rounded-sm ${color} shrink-0`} />
              <span className="w-8 font-mono text-muted-foreground">{label}</span>
              <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                <div className={`${color} h-full`} style={{ width: `${raw * 100}%` }} />
              </div>
              <span className="font-mono tabular-nums w-10 text-right">
                {contribution.toFixed(3)}
              </span>
              <span className="text-muted-foreground w-8 text-right">
                {(weight * 100).toFixed(0)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
