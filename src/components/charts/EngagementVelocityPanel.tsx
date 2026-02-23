'use client'

interface Props {
  ev1h: number | null
  ev6h: number | null
  ev24h: number | null
}

export function EngagementVelocityPanel({ ev1h, ev6h, ev24h }: Props) {
  const frontLoaded = ev1h !== null && ev24h !== null && ev24h > 0 ? ev1h / ev24h : null

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'EV_1h', value: ev1h },
          { label: 'EV_6h', value: ev6h },
          { label: 'EV_24h', value: ev24h },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold font-mono tabular-nums mt-1">
              {value != null ? value.toLocaleString('de-DE') : '—'}
            </p>
          </div>
        ))}
      </div>

      {frontLoaded !== null && (
        <div
          className={`text-xs rounded-md px-3 py-2 ${
            frontLoaded > 0.35
              ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          EV_1h / EV_24h: <span className="font-mono font-semibold">{frontLoaded.toFixed(2)}</span>
          {frontLoaded > 0.35 && (
            <span className="ml-1 font-medium">— Front-loaded VIRAL signal ↑</span>
          )}
        </div>
      )}
    </div>
  )
}
