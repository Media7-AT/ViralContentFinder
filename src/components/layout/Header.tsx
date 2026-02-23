'use client'

import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Props {
  lastRefreshed?: Date
}

export function Header({ lastRefreshed }: Props) {
  return (
    <header className="h-12 border-b bg-card px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold">ViralContentFinder</span>
        {lastRefreshed && (
          <span className="text-xs text-muted-foreground">
            Refreshed {formatDistanceToNow(lastRefreshed, { addSuffix: true, locale: de })}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
          className="text-xs"
        >
          ↺ Refresh
        </Button>
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="text-xs">
            Settings
          </Button>
        </Link>
      </div>
    </header>
  )
}
