'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { GeoDistribution } from '@/types/metrics'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#94a3b8']
const GEO_LABELS: Record<string, string> = { DE: 'Germany', AT: 'Austria', CH: 'Switzerland' }

interface Props {
  distribution: GeoDistribution | null
}

export function GeoDonutChart({ distribution }: Props) {
  if (!distribution || Object.keys(distribution).length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
        Geo data not available
      </div>
    )
  }

  const data = Object.entries(distribution)
    .map(([key, value]) => ({
      name: GEO_LABELS[key] ?? key,
      value: Math.round((value ?? 0) * 100),
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={60}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number | undefined) => `${v ?? 0}%`} />
        <Legend
          formatter={(value) => <span className="text-xs">{value}</span>}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
