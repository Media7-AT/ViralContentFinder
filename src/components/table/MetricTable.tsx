'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ViralityScoreBadge } from '@/components/metrics/ViralityScoreBadge'
import { HSIBadge } from '@/components/metrics/HSIBadge'
import type { VideoAnalysisSummary } from '@/types/video'
import Papa from 'papaparse'
import { format } from 'date-fns'

const col = createColumnHelper<VideoAnalysisSummary>()

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YT',
  tiktok: 'TT',
  instagram: 'IG',
  facebook: 'FB',
}

const columns = [
  col.display({
    id: 'rank',
    header: '#',
    cell: ({ row }) => <span className="text-muted-foreground">{row.index + 1}</span>,
    size: 40,
  }),
  col.accessor('title', {
    header: 'Title',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/video/${row.original.videoId}`}
        className="hover:text-primary line-clamp-1 text-sm font-medium max-w-xs block"
      >
        {row.original.title}
      </Link>
    ),
    size: 240,
  }),
  col.accessor('platform', {
    header: 'Plat.',
    cell: ({ getValue }) => (
      <Badge variant="outline" className="text-xs">
        {PLATFORM_LABELS[getValue()] ?? getValue()}
      </Badge>
    ),
    size: 50,
  }),
  col.accessor('publishTimestamp', {
    header: 'Published',
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">{format(new Date(getValue()), 'dd.MM')}</span>
    ),
    size: 70,
  }),
  col.accessor('viewsAt6h', {
    header: 'Views',
    cell: ({ getValue }) => {
      const v = getValue()
      if (v == null) return <span className="text-muted-foreground">—</span>
      return (
        <span className="font-mono tabular-nums text-sm">
          {v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
        </span>
      )
    },
    size: 70,
  }),
  col.accessor('hsi', {
    header: 'HSI',
    cell: ({ row }) => <HSIBadge hsi={row.original.hsi} estimated={row.original.hsiEstimated} />,
    size: 100,
  }),
  col.accessor('ev24h', {
    header: 'EV_24h',
    cell: ({ getValue }) => {
      const v = getValue()
      return v != null ? (
        <span className="font-mono tabular-nums text-sm">{v.toLocaleString('de-DE')}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
    size: 80,
  }),
  col.accessor('vpi', {
    header: 'VPI',
    cell: ({ getValue }) => {
      const v = getValue()
      return v != null ? (
        <span className="font-mono tabular-nums text-sm">{v.toFixed(1)}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
    size: 55,
  }),
  col.accessor('bpm', {
    header: 'BPM',
    cell: ({ getValue }) => {
      const v = getValue()
      return v != null ? (
        <span className="font-mono tabular-nums text-sm">{Math.round(v)}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
    size: 55,
  }),
  col.accessor('viralityScore', {
    header: 'VS',
    cell: ({ row }) => (
      <ViralityScoreBadge
        score={row.original.viralityScore}
        tier={row.original.viralityTier}
        confidence={row.original.vsConfidence}
        size="sm"
      />
    ),
    size: 110,
  }),
]

interface Props {
  videos: VideoAnalysisSummary[]
}

export function MetricTable({ videos }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'viralityScore', desc: true }])

  const table = useReactTable({
    data: videos,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const handleExport = () => {
    const rows = videos.map((v, i) => ({
      rank: i + 1,
      title: v.title,
      platform: v.platform,
      published: v.publishTimestamp,
      views: v.viewsAt6h ?? '',
      hsi: v.hsi ?? '',
      ev_24h: v.ev24h ?? '',
      vpi: v.vpi ?? '',
      bpm: v.bpm ?? '',
      virality_score: v.viralityScore ?? '',
      tier: v.viralityTier ?? '',
    }))
    const csv = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `viral-content-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{videos.length} videos</p>
        <Button variant="outline" size="sm" onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc'
                      ? ' ↑'
                      : header.column.getIsSorted() === 'desc'
                        ? ' ↓'
                        : ''}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/50">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-12 text-muted-foreground"
                >
                  No videos found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
