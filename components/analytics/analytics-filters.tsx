'use client'

import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Download, Filter, RotateCw } from 'lucide-react'

export type RangePreset = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom'

export interface AnalyticsFilterState {
  range: RangePreset
  from: string
  to: string
  country: string
  device: string
  path: string
  includeInternal: boolean
  includeBots: boolean
}

export const DEFAULT_FILTERS: AnalyticsFilterState = {
  range: '30d',
  from: '',
  to: '',
  country: '',
  device: '',
  path: '',
  includeInternal: false,
  includeBots: false,
}

export const RANGE_OPTIONS: { value: RangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
]

export const DEVICE_OPTIONS = ['desktop', 'mobile', 'tablet', 'unknown']

export function filtersToParams(filters: AnalyticsFilterState) {
  const params = new URLSearchParams()
  params.set('range', filters.range)
  if (filters.range === 'custom') {
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
  }
  if (filters.country) params.set('country', filters.country)
  if (filters.device) params.set('device', filters.device)
  if (filters.path) params.set('path', filters.path)
  if (filters.includeInternal) params.set('includeInternal', 'true')
  if (filters.includeBots) params.set('includeBots', 'true')
  params.set('tz', Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
  return params
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function defaultCustomRange() {
  const to = new Date()
  const from = new Date(to.getTime() - 29 * 86_400_000)
  return { from: toDateInput(from), to: toDateInput(to) }
}

interface AnalyticsFiltersProps {
  filters: AnalyticsFilterState
  onChange: (filters: AnalyticsFilterState) => void
  onRefresh: () => void
  onExport?: () => void
  countries?: { countryCode: string; countryName: string }[]
  loading?: boolean
}

export function AnalyticsFilters({
  filters,
  onChange,
  onRefresh,
  onExport,
  countries = [],
  loading = false,
}: AnalyticsFiltersProps) {
  const update = (patch: Partial<AnalyticsFilterState>) => onChange({ ...filters, ...patch })

  return (
    <div className="bg-canvas border border-hairline p-lg mb-xxl">
      <div className="flex items-center gap-2 mb-lg">
        <Filter className="w-4 h-4 text-mute" />
        <h2 className="text-caption text-charcoal font-600 uppercase tracking-[0.1em]">Report filters</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <label className="flex flex-col gap-xxs">
          <span className="text-caption text-mute">Period</span>
          <select
            value={filters.range}
            onChange={(event) => {
              const next = event.target.value as RangePreset
              if (next === 'custom') {
                const { from, to } = defaultCustomRange()
                update({ range: 'custom', from: filters.from || from, to: filters.to || to })
              } else {
                update({ range: next })
              }
            }}
            className="h-10 px-3 bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none cursor-pointer w-full"
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {filters.range === 'custom' && (
          <>
            <label className="flex flex-col gap-xxs">
              <span className="text-caption text-mute">From</span>
              <input
                type="date"
                value={filters.from}
                max={filters.to || undefined}
                onChange={(event) => update({ from: event.target.value })}
                className="h-10 px-3 bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none"
              />
            </label>
            <label className="flex flex-col gap-xxs">
              <span className="text-caption text-mute">To</span>
              <input
                type="date"
                value={filters.to}
                min={filters.from || undefined}
                onChange={(event) => update({ to: event.target.value })}
                className="h-10 px-3 bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none"
              />
            </label>
          </>
        )}

        <label className="flex flex-col gap-xxs">
          <span className="text-caption text-mute">Country</span>
          <select
            value={filters.country}
            onChange={(event) => update({ country: event.target.value })}
            className="h-10 px-3 bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none cursor-pointer w-full"
          >
            <option value="">All countries</option>
            {countries.map((country) => (
              <option key={country.countryCode} value={country.countryCode}>
                {country.countryName} ({country.countryCode})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-xxs">
          <span className="text-caption text-mute">Device</span>
          <select
            value={filters.device}
            onChange={(event) => update({ device: event.target.value })}
            className="h-10 px-3 bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none cursor-pointer w-full"
          >
            <option value="">All devices</option>
            {DEVICE_OPTIONS.map((device) => (
              <option key={device} value={device}>
                {device}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-xxs">
          <span className="text-caption text-mute">Page path</span>
          <input
            value={filters.path}
            onChange={(event) => update({ path: event.target.value })}
            placeholder="/programs"
            className="h-10 px-3 bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-lg mt-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.includeInternal}
            onChange={(event) => update({ includeInternal: event.target.checked })}
            className="w-4 h-4 accent-[var(--color-primary)]"
          />
          <span className="text-body-sm text-charcoal">Include internal (admin) traffic</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.includeBots}
            onChange={(event) => update({ includeBots: event.target.checked })}
            className="w-4 h-4 accent-[var(--color-primary)]"
          />
          <span className="text-body-sm text-charcoal">Include bots</span>
        </label>

        <div className="flex items-center gap-2 ml-auto">
          {onExport && (
            <Button variant="outline-dark" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={onRefresh} disabled={loading}>
            <RotateCw className={cn('w-4 h-4 mr-1', loading && 'animate-spin')} /> Refresh
          </Button>
        </div>
      </div>

      <p className="text-caption text-mute mt-md">
        IP geolocation is an estimate of network location and never a GPS-accurate position.
        {filters.includeInternal || filters.includeBots
          ? ' Internal and bot traffic is included in this report.'
          : ' Internal and bot traffic is excluded from this report.'}
      </p>
    </div>
  )
}