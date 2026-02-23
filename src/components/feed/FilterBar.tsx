'use client'

import { useQueryStates, parseAsString } from 'nuqs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function FilterBar() {
  const [filters, setFilters] = useQueryStates({
    platform: parseAsString.withDefault('all'),
    tier: parseAsString.withDefault('all'),
    category: parseAsString.withDefault('all'),
    range: parseAsString.withDefault('7d'),
    sort: parseAsString.withDefault('virality_score'),
  })

  return (
    <div className="flex flex-wrap gap-2 py-2">
      <Select value={filters.platform} onValueChange={(v) => setFilters({ platform: v })}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder="Platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Platforms</SelectItem>
          <SelectItem value="youtube">YouTube</SelectItem>
          <SelectItem value="tiktok">TikTok</SelectItem>
          <SelectItem value="instagram">Instagram</SelectItem>
          <SelectItem value="facebook">Facebook</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.range} onValueChange={(v) => setFilters({ range: v })}>
        <SelectTrigger className="w-28 h-8 text-xs">
          <SelectValue placeholder="Date Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="24h">Last 24h</SelectItem>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.category} onValueChange={(v) => setFilters({ category: v })}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="Sportwagen">Sportwagen</SelectItem>
          <SelectItem value="SUV">SUV</SelectItem>
          <SelectItem value="Elektroauto">Elektroauto</SelectItem>
          <SelectItem value="Tuning">Tuning</SelectItem>
          <SelectItem value="Gebrauchtwagen">Gebrauchtwagen</SelectItem>
          <SelectItem value="Probefahrt">Probefahrt</SelectItem>
          <SelectItem value="Motorrad">Motorrad</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.tier} onValueChange={(v) => setFilters({ tier: v })}>
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue placeholder="Tier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tiers</SelectItem>
          <SelectItem value="Tier1">Tier 1 · Viral</SelectItem>
          <SelectItem value="Tier2">Tier 2 · High</SelectItem>
          <SelectItem value="NonViral">Non-Viral</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.sort} onValueChange={(v) => setFilters({ sort: v })}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="virality_score">Sort: VS Score</SelectItem>
          <SelectItem value="ev_24h">Sort: EV 24h</SelectItem>
          <SelectItem value="hsi">Sort: HSI</SelectItem>
          <SelectItem value="publish_timestamp">Sort: Newest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
