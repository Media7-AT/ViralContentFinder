'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ViralityTier, VSConfidence } from '@/types/metrics'
import { cn } from '@/lib/utils'

interface Props {
  score: number | null
  tier: ViralityTier | null
  confidence?: VSConfidence | null
  size?: 'sm' | 'md' | 'lg'
}

const TIER_CONFIG = {
  Tier1: { label: 'TIER 1 · VIRAL', className: 'bg-green-500 text-white hover:bg-green-500' },
  Tier2: { label: 'TIER 2 · HIGH', className: 'bg-blue-500 text-white hover:bg-blue-500' },
  NonViral: { label: 'NON-VIRAL', className: 'bg-slate-400 text-white hover:bg-slate-400' },
}

const CONFIDENCE_LABEL: Record<VSConfidence, string> = {
  high: 'High confidence — all metrics computed',
  medium: 'Medium confidence — 1–2 metrics estimated',
  low: 'Low confidence — 3+ metrics estimated',
}

export function ViralityScoreBadge({ score, tier, confidence, size = 'md' }: Props) {
  if (score === null || tier === null) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Pending
      </Badge>
    )
  }

  const config = TIER_CONFIG[tier]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex items-center gap-1.5', size === 'lg' && 'flex-col')}>
          <span
            className={cn(
              'font-mono font-bold tabular-nums',
              size === 'sm' && 'text-sm',
              size === 'md' && 'text-base',
              size === 'lg' && 'text-3xl'
            )}
          >
            {score.toFixed(2)}
          </span>
          <Badge className={cn(config.className, size === 'sm' && 'text-[10px] px-1.5 py-0')}>
            {config.label}
            {confidence === 'low' && ' ⚠'}
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1 text-sm">
          <p className="font-semibold">Virality Score: {score.toFixed(3)}</p>
          <p>
            {tier === 'Tier1'
              ? '≥ 0.78 — Top-performing content'
              : tier === 'Tier2'
                ? '0.60–0.78 — Strong performer'
                : '< 0.60 — Below threshold'}
          </p>
          {confidence && (
            <p className="text-muted-foreground text-xs">{CONFIDENCE_LABEL[confidence]}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
