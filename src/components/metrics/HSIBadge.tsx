'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  hsi: number | null
  estimated?: boolean
}

function getHSIVariant(hsi: number): { label: string; className: string } {
  if (hsi < 55) return { label: 'CRITICAL', className: 'bg-red-500 text-white' }
  if (hsi < 65) return { label: 'BELOW AVG', className: 'bg-yellow-500 text-white' }
  if (hsi < 75) return { label: 'ABOVE AVG', className: 'bg-blue-500 text-white' }
  return { label: 'TOP DECILE', className: 'bg-green-500 text-white' }
}

export function HSIBadge({ hsi, estimated }: Props) {
  if (hsi === null) {
    return <span className="text-muted-foreground text-sm">HSI: —</span>
  }

  const { label, className } = getHSIVariant(hsi)

  return (
    <span className="flex items-center gap-1.5">
      <span className="font-mono font-semibold tabular-nums">{hsi.toFixed(0)}%</span>
      <Badge className={cn(className, 'text-[10px] px-1.5 py-0 hover:opacity-90', className)}>
        {label}
        {estimated && ' ~'}
      </Badge>
    </span>
  )
}
