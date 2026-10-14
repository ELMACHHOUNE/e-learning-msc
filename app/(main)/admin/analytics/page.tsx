'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  BarChart3,
  Clock,
  Eye,
  Globe,
  MapPin,
  MousePointerClick,
  Repeat,
  RotateCw,
  Settings2,
  ShieldAlert,
  UserPlus,
  Users,
} from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { toast } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { AnalyticsTimeseriesPoint } from '@/types/analytics'
import { ANALYTICS_EVENT_TYPES } from '@/types/analytics'
import {
  AnalyticsFilters,
  AnalyticsPanel,
  DataTable,
  DEFAULT_FILTERS,
  DistributionPieChart,
  EmptyState,
  ErrorState,
  KpiCard,
  LegendList,
  LoadingPanel,
  RankBarChart,
  TrafficChart,
  filtersToParams,
  formatPercent,
  formatTimestamp,
  type AnalyticsFilterState,
  type Column,
  type RankRow,
} from '@/components/analytics'

type Tab = 'overview' | 'geography' | 'visitors' | 'pages' | 'events' | 'settings'

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'geography', label: 'Geography', icon: Globe },
  { id: 'visitors', label: 'Visitors', icon: Users },
  { id: 'pages', label: 'Pages', icon: Eye },
  { id: 'events', label: 'Events', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings2 },
]

interface DistributionRow {
  name: string
  visitors: number
  pageViews: number
}

interface KpiPayload {
  value: number
  previous: number
  deltaPercent: number | null
}

interface OverviewPayload {
  period: { from: string; to: string }
  previousPeriod: { from: string; to: string }
  kpis: {
    pageViews: KpiPayload
    sessions: KpiPayload
    visitors: KpiPayload
    newVisitors: KpiPayload
    returningVisitors: KpiPayload
    avgPagesPerSession: KpiPayload
    engagementRate: KpiPayload
    avgSessionDurationSeconds: number | null
    topCountry: { countryCode: string; countryName?: string; visitors: number } | null
    geoCoverageRate: KpiPayload
  }
  isEmpty: boolean
  recentEvents: EventRow[]
  timeseries: AnalyticsTimeseriesPoint[]
  topCountries: { countryCode: string; countryName: string; visitors: number; sessions: number; pageViews: number }[]
  topCities: { city: string; regionName?: string; countryCode: string; visitors: number; sessions: number; pageViews: number }[]
  topPages: { path: string; pageTitle: string; pageViews: number; visitors: number; sessions: number; entrances: number; exits: number }[]
  topReferrers: { host: string | null; label: string; visitors: number; pageViews: number; sessions: number }[]
  devices: DistributionRow[]
}

interface GeographyPayload {
  countries: OverviewPayload['topCountries']
  regions: { regionName: string; countryCode: string; visitors: number; pageViews: number }[]
  cities: OverviewPayload['topCities']
  trend: { bucket: string; countryCode: string; visitors: number }[]
  coverage: { country: number; region: number; city: number; pageViews: number }
}

interface VisitorsPayload {
  totals: {
    visitors: number
    newVisitors: number
    returningVisitors: number
    sessions: number
    avgPagesPerSession: number
    engagementRate: number
  }
  distributions: {
    devices: DistributionRow[]
    browsers: DistributionRow[]
    operatingSystems: DistributionRow[]
  }
  series: AnalyticsTimeseriesPoint[]
  recentSessions: {
    sessionId: string
    visitorIdHash: string
    startedAt: string
    lastSeenAt: string
    pageViewCount: number
    landingPath: string
    exitPath: string
    countryName?: string
    city?: string
    deviceType: string
    browserFamily?: string
    osFamily?: string
    isAuthenticated: boolean
    userRole?: string
  }[]
}

interface EventRow {
  eventId: string
  eventType: string
  occurredAt: string
  path: string
  pageTitle?: string
  countryName?: string
  city?: string
  deviceType: string
  sessionShortId: string
  visitorShortId: string
  isAuthenticated: boolean
  userRole?: string
}

interface ProviderStatus {
  enabled: boolean
  geolocationConfigured: boolean
  warning: string | null
  cacheTtlHours: number
  retentionDays: number
  sessionWindowMinutes: number
  reportingTimezone: string
  excludeAdmins: boolean
  usage: {
    attempts: number
    successes: number
    failures: number
    cacheHits: number
    quotaErrors: number
    lastSuccessAt: string | null
    lastErrorCode: string | null
  }
}

/**
 * Single entry point for every analytics read. `base` carries the active filter state;
 * `extra` holds report-specific parameters. Returns null when the request was superseded
 * or failed so the caller can leave the previous view untouched.
 */
/** Tab id → API report name. Not every tab shares its name with its report. */
const TAB_REPORTS: Record<Tab, string> = {
  overview: 'overview',
  geography: 'geography',
  visitors: 'visitors',
  pages: 'pages',
  events: 'events',
  settings: 'provider-status',
}

async function fetchReport<T>(
  report: string,
  base: string | URLSearchParams,
  extra: URLSearchParams | undefined,
  signal: AbortSignal,
  onFailure: (message: string) => void,
): Promise<T | null> {
  const query = new URLSearchParams(typeof base === 'string' ? base : base.toString())
  query.set('report', report)
  extra?.forEach((value, key) => query.set(key, value))

  try {
    const response = await fetch(`/api/admin/analytics?${query.toString()}`, { cache: 'no-store', signal })
    if (!response.ok) {
      onFailure(
        response.status === 403
          ? 'You are not allowed to view analytics.'
          : response.status === 401
            ? 'Your session expired. Sign in again to continue.'
            : 'This report could not be built.',
      )
      return null
    }
    return (await response.json()) as T
  } catch (caught) {
    if ((caught as Error)?.name === 'AbortError') return null
    onFailure('Network error while loading this report.')
    return null
  }
}

interface EventsPayload {
  rows: EventRow[]
  total: number
  page: number
  totalPages: number
}

interface PagesPayload {
  pages: OverviewPayload['topPages']
  referrers: OverviewPayload['topReferrers']
}

type ReportPayload = OverviewPayload | GeographyPayload | VisitorsPayload | PagesPayload | EventsPayload | ProviderStatus

/** Chart components consume `{ name, value }`; API distributions report `{ name, visitors, pageViews }`. */
function toRank(rows: DistributionRow[]): RankRow[] {
  return rows.map((row) => ({ name: row.name, value: row.visitors ?? 0 }))
}

export default function AnalyticsAdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [filters, setFilters] = useState<AnalyticsFilterState>(DEFAULT_FILTERS)
  const [payload, setPayload] = useState<{ key: string; data: ReportPayload } | null>(null)
  const [settledKey, setSettledKey] = useState<string | null>(null)
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null)
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({})
  const [eventSearch, setEventSearch] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventPage, setEventPage] = useState(1)
  const [eventSearchDraft, setEventSearchDraft] = useState('')
  const [eventTypeDraft, setEventTypeDraft] = useState('')
  const [nonce, setNonce] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const applyEventFilters = useCallback(() => {
    setEventPage(1)
    setEventSearch(eventSearchDraft.trim())
    setEventType(eventTypeDraft)
  }, [eventSearchDraft, eventTypeDraft])

  const params = useMemo(() => filtersToParams(filters).toString(), [filters])
  const requestKey = `${activeTab}|${params}|${eventSearch}|${eventType}|${eventPage}|${nonce}`

  const overview = activeTab === 'overview' && payload?.key === requestKey ? (payload.data as OverviewPayload) : null
  const geography = activeTab === 'geography' && payload?.key === requestKey ? (payload.data as GeographyPayload) : null
  const visitors = activeTab === 'visitors' && payload?.key === requestKey ? (payload.data as VisitorsPayload) : null
  const pagesPayload = activeTab === 'pages' && payload?.key === requestKey ? (payload.data as PagesPayload) : null
  const eventsPayload = activeTab === 'events' && payload?.key === requestKey ? (payload.data as EventsPayload) : null
  const status = activeTab === 'settings' && payload?.key === requestKey ? (payload.data as ProviderStatus) : null

  const loading = settledKey !== requestKey
  const error = failure?.key === requestKey ? failure.message : null

  const countryOptions = useMemo(
    () =>
      (overview?.topCountries ?? []).map((country) => ({
        countryCode: country.countryCode,
        countryName: country.countryName,
      })),
    [overview],
  )

  useEffect(() => {
    if (settledKey === requestKey) return

    const controller = new AbortController()
    abortRef.current?.abort()
    abortRef.current = controller
    let cancelled = false

    const run = async () => {
      const fail = (message: string) => {
        if (!cancelled) setFailure({ key: requestKey, message })
      }

      try {
        let data: ReportPayload

        if (activeTab === 'pages') {
          const [pageRows, referrerRows] = await Promise.all([
            fetchReport<{ pages: OverviewPayload['topPages'] }>('pages', params, undefined, controller.signal, fail),
            fetchReport<{ referrers: OverviewPayload['topReferrers'] }>('referrers', params, undefined, controller.signal, fail),
          ])
          if (pageRows === null || referrerRows === null) return
          data = { pages: pageRows.pages, referrers: referrerRows.referrers }
        } else if (activeTab === 'events') {
          const extra = new URLSearchParams()
          extra.set('page', String(eventPage))
          extra.set('pageSize', '25')
          if (eventSearch.trim()) extra.set('search', eventSearch.trim())
          if (eventType) extra.set('eventType', eventType)
          const rows = await fetchReport<EventsPayload>('events', params, extra, controller.signal, fail)
          if (rows === null) return
          data = rows
        } else {
          const rows = await fetchReport<ReportPayload>(TAB_REPORTS[activeTab], params, undefined, controller.signal, fail)
          if (rows === null) return
          data = rows
        }

        if (cancelled) return
        setPayload({ key: requestKey, data })
        setFailure(null)
        setSettledKey(requestKey)
      } catch {
        fail('Network error while loading this report.')
        setSettledKey(requestKey)
      }
    }

    void run()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [requestKey, settledKey, activeTab, params, eventPage, eventSearch, eventType])

  const refresh = useCallback(() => {
    setNonce((value) => value + 1)
  }, [])

  const [syncingIndexes, setSyncingIndexes] = useState(false)

  const syncIndexes = useCallback(async () => {
    setSyncingIndexes(true)
    try {
      const response = await fetch('/api/admin/analytics/indexes', { method: 'POST', cache: 'no-store' })
      const body = (await response.json()) as { created?: string[]; ttlSeconds?: number; error?: string }
      if (!response.ok) {
        toast({ variant: 'error', title: 'Index sync failed', message: body.error ?? 'Unexpected error' })
        return
      }
      toast({
        variant: 'success',
        title: 'Analytics indexes are up to date',
        message: `Retention TTL set to ${Math.round((body.ttlSeconds ?? 0) / 86_400)} days · ${body.created?.length ?? 0} change(s)`,
      })
    } catch {
      toast({ variant: 'error', title: 'Index sync failed', message: 'Network error' })
    } finally {
      setSyncingIndexes(false)
    }
  }, [])

  const exportCsv = useCallback(
    (kind: 'events' | 'pages') => {
      const query = filtersToParams(filters)
      query.set('report', 'export')
      query.set('kind', kind)
      const link = document.createElement('a')
      link.href = `/api/admin/analytics?${query.toString()}`
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      link.remove()
    },
    [filters],
  )

  const eventColumns: Column<EventRow>[] = [
    { key: 'eventType', header: 'Event', render: (row) => <Badge variant="default">{row.eventType}</Badge> },
    { key: 'occurredAt', header: 'Timestamp (UTC)', render: (row) => formatTimestamp(row.occurredAt, 'UTC') },
    { key: 'path', header: 'Path', render: (row) => <span className="whitespace-nowrap">{row.path}</span> },
    { key: 'countryName', header: 'Location', render: (row) => [row.city, row.countryName].filter(Boolean).join(', ') || '—' },
    { key: 'deviceType', header: 'Device', render: (row) => row.deviceType },
    { key: 'sessionShortId', header: 'Session', render: (row) => <code className="text-caption">{row.sessionShortId}</code> },
    { key: 'visitorShortId', header: 'Visitor', render: (row) => <code className="text-caption">{row.visitorShortId}</code> },
    {
      key: 'userRole',
      header: 'Identity',
      render: (row) => (row.isAuthenticated ? <Badge variant="info">{row.userRole ?? 'member'}</Badge> : <span className="text-mute">Anonymous</span>),
    },
  ]

  return (
    <div className="max-w-[1440px] mx-auto px-md sm:px-xl py-xxl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-xxl">
        <div className="min-w-0">
          <h1 className="text-display-md text-ink font-700 leading-[0.95]">Visitor Analytics</h1>
          <p className="text-body-md text-mute mt-sm">
            First-party traffic intelligence with IPstack geolocation enrichment
          </p>
        </div>
        <Badge variant="new" className="self-start sm:self-auto shrink-0">
          Admin Access
        </Badge>
      </div>

      <div className="flex gap-lg mb-xxl border-b border-hairline overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-lg py-md text-button-md bg-transparent border-none cursor-pointer transition-colors shrink-0 whitespace-nowrap',
                isActive ? 'text-ink border-b-2 border-ink -mb-px' : 'text-mute hover:text-charcoal',
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <AnalyticsFilters
        filters={filters}
        onChange={setFilters}
        onRefresh={refresh}
        onExport={activeTab === 'pages' || activeTab === 'events' ? () => exportCsv(activeTab === 'pages' ? 'pages' : 'events') : undefined}
        countries={countryOptions}
        loading={loading}
      />

      {error && <ErrorState message={error} onRetry={refresh} />}

      {!error && loading && !overview && <LoadingPanel />}

      {!error && activeTab === 'overview' && overview && (
        <div className="space-y-xxl">
          {overview.isEmpty && (
            <div className="bg-canvas border border-hairline">
              <EmptyState
                title="No traffic recorded yet"
                message="Tracking starts as soon as the first visitor loads a page. Historical reports cannot be reconstructed, so every number on this page begins from the moment collection was activated."
              />
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-lg">
            <KpiCard label="Page views" value={overview.kpis.pageViews.value.toLocaleString()} icon={Eye} deltaPercent={overview.kpis.pageViews.deltaPercent} index={0} />
            <KpiCard label="Sessions" value={overview.kpis.sessions.value.toLocaleString()} icon={Activity} deltaPercent={overview.kpis.sessions.deltaPercent} index={1} />
            <KpiCard label="Unique visitors" value={overview.kpis.visitors.value.toLocaleString()} icon={Users} deltaPercent={overview.kpis.visitors.deltaPercent} index={2} />
            <KpiCard label="New visitors" value={overview.kpis.newVisitors.value.toLocaleString()} icon={UserPlus} hint="First recorded visit in retained history" index={3} />
            <KpiCard label="Returning visitors" value={overview.kpis.returningVisitors.value.toLocaleString()} icon={Repeat} hint="Seen before the period started" index={4} />
            <KpiCard label="Pages / session" value={overview.kpis.avgPagesPerSession.value} icon={MousePointerClick} deltaPercent={overview.kpis.avgPagesPerSession.deltaPercent} index={5} />
            <KpiCard label="Engagement rate" value={`${overview.kpis.engagementRate.value}%`} icon={Activity} deltaPercent={overview.kpis.engagementRate.deltaPercent} hint="Sessions with 2+ page views" index={6} />
            <KpiCard
              label="Avg session duration"
              value={overview.kpis.avgSessionDurationSeconds !== null ? `${overview.kpis.avgSessionDurationSeconds}s` : '—'}
              icon={Clock}
              hint={overview.kpis.avgSessionDurationSeconds !== null ? 'Sessions with 2+ events only' : 'Needs multi-event sessions'}
              index={7}
            />
            <KpiCard
              label="Top country"
              value={overview.kpis.topCountry?.countryName ?? overview.kpis.topCountry?.countryCode ?? '—'}
              icon={Globe}
              hint={overview.kpis.topCountry ? `${overview.kpis.topCountry.visitors.toLocaleString()} visitors` : 'No geolocated traffic'}
              index={8}
            />
            <KpiCard label="Geo coverage" value={`${overview.kpis.geoCoverageRate.value}%`} icon={MapPin} hint="Page views with a known country" index={9} />
          </div>

          <AnalyticsPanel
            title="Traffic over time"
            action={
              <span className="text-caption text-mute">
                {formatTimestamp(overview.period.from, 'UTC')} → {formatTimestamp(overview.period.to, 'UTC')}
              </span>
            }
          >
            <TrafficChart
              data={overview.timeseries}
              hidden={hiddenSeries}
              onToggle={(key) => setHiddenSeries((prev) => ({ ...prev, [key]: !prev[key] }))}
            />
          </AnalyticsPanel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
            <AnalyticsPanel title="Top countries">
              <RankBarChart data={overview.topCountries.map((row) => ({ name: row.countryName || row.countryCode, value: row.visitors }))} emptyLabel="No geolocated visitors yet" />
            </AnalyticsPanel>
            <AnalyticsPanel title="Top cities">
              <RankBarChart data={overview.topCities.map((row) => ({ name: `${row.city}${row.countryCode ? `, ${row.countryCode}` : ''}`, value: row.visitors }))} emptyLabel="No city-level data yet" />
            </AnalyticsPanel>
            <AnalyticsPanel title="Top pages">
              <RankBarChart data={overview.topPages.map((row) => ({ name: row.path, value: row.pageViews }))} />
            </AnalyticsPanel>
            <AnalyticsPanel title="Referrer sources">
              <RankBarChart data={overview.topReferrers.map((row) => ({ name: row.label, value: row.sessions }))} />
            </AnalyticsPanel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg items-start">
            <AnalyticsPanel title="Device distribution">
              <div className="flex flex-col lg:flex-row lg:items-center gap-lg">
                <DistributionPieChart data={toRank(overview.devices)} />
                <LegendList data={toRank(overview.devices)} layout="inline" />
              </div>
            </AnalyticsPanel>
            <AnalyticsPanel title="Recent events" className="lg:col-span-2">
              <DataTable
                rows={overview.recentEvents}
                rowKey={(row) => row.eventId}
                emptyLabel="No events recorded yet"
                pageSize={6}
                columns={eventColumns}
              />
            </AnalyticsPanel>
          </div>
        </div>
      )}

      {!error && activeTab === 'geography' && (
        <div className="space-y-xxl">
          {!geography ? (
            <LoadingPanel />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
                <KpiCard label="Country coverage" value={`${geography.coverage.country}%`} icon={Globe} hint={`${geography.coverage.pageViews.toLocaleString()} page views analysed`} />
                <KpiCard label="Region coverage" value={`${geography.coverage.region}%`} icon={MapPin} />
                <KpiCard label="City coverage" value={`${geography.coverage.city}%`} icon={MapPin} />
                <KpiCard label="Countries reached" value={geography.countries.length.toLocaleString()} icon={Globe} />
              </div>

              <AnalyticsPanel title="Visitors by country">
                <DataTable
                  rows={geography.countries}
                  rowKey={(row) => row.countryCode}
                  searchable
                  searchPlaceholder="Search country"
                  columns={[
                    { key: 'country', header: 'Country', render: (row) => `${row.countryName} (${row.countryCode})` },
                    { key: 'visitors', header: 'Visitors', align: 'right', sortable: true, sortValue: (row) => row.visitors, render: (row) => row.visitors.toLocaleString() },
                    { key: 'sessions', header: 'Sessions', align: 'right', sortable: true, sortValue: (row) => row.sessions, render: (row) => row.sessions.toLocaleString() },
                    { key: 'pageViews', header: 'Page views', align: 'right', sortable: true, sortValue: (row) => row.pageViews, render: (row) => row.pageViews.toLocaleString() },
                    {
                      key: 'share',
                      header: 'Share',
                      align: 'right',
                      sortable: true,
                      sortValue: (row) => (row.visitors / Math.max(1, geography.countries.reduce((sum, c) => sum + c.visitors, 0))) * 100,
                      render: (row) =>
                        formatPercent(
                          (row.visitors / Math.max(1, geography.countries.reduce((sum, c) => sum + c.visitors, 0))) * 100,
                        ),
                    },
                  ]}
                />
              </AnalyticsPanel>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
                <AnalyticsPanel title="Visitors by region">
                  <RankBarChart data={geography.regions.map((row) => ({ name: `${row.regionName}${row.countryCode ? `, ${row.countryCode}` : ''}`, value: row.visitors }))} emptyLabel="No region-level data yet" />
                </AnalyticsPanel>
                <AnalyticsPanel title="Visitors by city">
                  <RankBarChart data={geography.cities.map((row) => ({ name: row.city, value: row.visitors }))} emptyLabel="No city-level data yet" />
                </AnalyticsPanel>
              </div>

              <AnalyticsPanel title="Cities">
                <DataTable
                  rows={geography.cities}
                  rowKey={(row) => `${row.city}-${row.countryCode}-${row.regionName ?? ''}`}
                  searchable
                  searchPlaceholder="Search city"
                  columns={[
                    { key: 'city', header: 'City', render: (row) => row.city },
                    { key: 'regionName', header: 'Region', render: (row) => row.regionName ?? '—' },
                    { key: 'countryCode', header: 'Country', render: (row) => row.countryCode || '—' },
                    { key: 'visitors', header: 'Visitors', align: 'right', sortable: true, sortValue: (row) => row.visitors, render: (row) => row.visitors.toLocaleString() },
                    { key: 'sessions', header: 'Sessions', align: 'right', sortable: true, sortValue: (row) => row.sessions, render: (row) => row.sessions.toLocaleString() },
                    { key: 'pageViews', header: 'Page views', align: 'right', sortable: true, sortValue: (row) => row.pageViews, render: (row) => row.pageViews.toLocaleString() },
                  ]}
                />
              </AnalyticsPanel>

              <p className="text-caption text-mute">
                IP geolocation estimates the network location of a visitor, not their physical address. City-level results can be off by tens of kilometres on mobile networks and VPNs.
              </p>
            </>
          )}
        </div>
      )}

      {!error && activeTab === 'visitors' && (
        <div className="space-y-xxl">
          {!visitors ? (
            <LoadingPanel />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-lg">
                <KpiCard label="Visitors" value={visitors.totals.visitors.toLocaleString()} icon={Users} index={0} />
                <KpiCard label="New visitors" value={visitors.totals.newVisitors.toLocaleString()} icon={UserPlus} index={1} />
                <KpiCard label="Returning visitors" value={visitors.totals.returningVisitors.toLocaleString()} icon={Repeat} index={2} />
                <KpiCard label="Sessions" value={visitors.totals.sessions.toLocaleString()} icon={Activity} index={3} />
                <KpiCard label="Pages / session" value={visitors.totals.avgPagesPerSession} icon={MousePointerClick} index={4} />
              </div>

              <AnalyticsPanel title="Visitors over time">
                <TrafficChart data={visitors.series} hidden={hiddenSeries} onToggle={(key) => setHiddenSeries((prev) => ({ ...prev, [key]: !prev[key] }))} />
              </AnalyticsPanel>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start">
                <AnalyticsPanel title="Devices">
                  <div className="flex flex-col xl:flex-row xl:items-center gap-lg">
                    <DistributionPieChart data={toRank(visitors.distributions.devices)} />
                    <LegendList data={toRank(visitors.distributions.devices)} layout="inline" />
                  </div>
                </AnalyticsPanel>
                <AnalyticsPanel title="Browsers">
                  <RankBarChart data={toRank(visitors.distributions.browsers)} emptyLabel="No browser data yet" />
                </AnalyticsPanel>
                <AnalyticsPanel title="Operating systems">
                  <RankBarChart data={toRank(visitors.distributions.operatingSystems)} emptyLabel="No OS data yet" />
                </AnalyticsPanel>
              </div>

              <AnalyticsPanel title="Recent sessions">
                <DataTable
                  rows={visitors.recentSessions}
                  rowKey={(row) => row.sessionId}
                  pageSize={10}
                  columns={[
                    { key: 'visitorIdHash', header: 'Visitor', render: (row) => <code className="text-caption">{row.visitorIdHash}</code> },
                    { key: 'startedAt', header: 'Started (UTC)', render: (row) => formatTimestamp(row.startedAt, 'UTC') },
                    { key: 'lastSeenAt', header: 'Last seen (UTC)', render: (row) => formatTimestamp(row.lastSeenAt, 'UTC') },
                    { key: 'pageViewCount', header: 'Pages', align: 'right', sortable: true, sortValue: (row) => row.pageViewCount, render: (row) => row.pageViewCount },
                    { key: 'landingPath', header: 'Landing', render: (row) => <span className="whitespace-nowrap">{row.landingPath}</span> },
                    { key: 'exitPath', header: 'Exit', render: (row) => <span className="whitespace-nowrap">{row.exitPath}</span> },
                    { key: 'location', header: 'Location', render: (row) => [row.city, row.countryName].filter(Boolean).join(', ') || '—' },
                    { key: 'stack', header: 'Client', render: (row) => [row.browserFamily, row.osFamily, row.deviceType].filter(Boolean).join(' · ') },
                    {
                      key: 'isAuthenticated',
                      header: 'Identity',
                      render: (row) => (row.isAuthenticated ? <Badge variant="info">{row.userRole ?? 'member'}</Badge> : <span className="text-mute">Anonymous</span>),
                    },
                  ]}
                />
              </AnalyticsPanel>
            </>
          )}
        </div>
      )}

      {!error && activeTab === 'pages' && (
        <div className="space-y-xxl">
          {!pagesPayload ? (
            <LoadingPanel />
          ) : (
            <>
              <AnalyticsPanel title="Top pages">
                <DataTable
                  rows={pagesPayload.pages}
                  rowKey={(row) => row.path}
                  searchable
                  searchPlaceholder="Search path"
                  columns={[
                    { key: 'path', header: 'Path', render: (row) => <span className="whitespace-nowrap">{row.path}</span> },
                    { key: 'pageTitle', header: 'Title', render: (row) => row.pageTitle },
                    { key: 'pageViews', header: 'Page views', align: 'right', sortable: true, sortValue: (row) => row.pageViews, render: (row) => row.pageViews.toLocaleString() },
                    { key: 'visitors', header: 'Visitors', align: 'right', sortable: true, sortValue: (row) => row.visitors, render: (row) => row.visitors.toLocaleString() },
                    { key: 'sessions', header: 'Sessions', align: 'right', sortable: true, sortValue: (row) => row.sessions, render: (row) => row.sessions.toLocaleString() },
                    { key: 'entrances', header: 'Entrances', align: 'right', sortable: true, sortValue: (row) => row.entrances, render: (row) => row.entrances.toLocaleString() },
                    { key: 'exits', header: 'Exits', align: 'right', sortable: true, sortValue: (row) => row.exits, render: (row) => row.exits.toLocaleString() },
                  ]}
                />
              </AnalyticsPanel>

              <AnalyticsPanel title="Referrer sources">
                <DataTable
                  rows={pagesPayload.referrers}
                  rowKey={(row) => row.host ?? 'direct'}
                  emptyLabel="No referrer data in this period"
                  columns={[
                    { key: 'label', header: 'Referrer host', render: (row) => (row.host ? row.label : <span className="text-mute">Direct / unknown</span>) },
                    { key: 'sessions', header: 'Sessions', align: 'right', sortable: true, sortValue: (row) => row.sessions, render: (row) => row.sessions.toLocaleString() },
                    { key: 'pageViews', header: 'Page views', align: 'right', sortable: true, sortValue: (row) => row.pageViews, render: (row) => row.pageViews.toLocaleString() },
                    { key: 'visitors', header: 'Visitors', align: 'right', sortable: true, sortValue: (row) => row.visitors, render: (row) => row.visitors.toLocaleString() },
                  ]}
                />
                <p className="text-caption text-mute mt-md">
                  A missing referrer is not proof of direct navigation — privacy settings, redirects, and stripped referrers all produce the same empty value.
                </p>
              </AnalyticsPanel>
            </>
          )}
        </div>
      )}

      {!error && activeTab === 'events' && (
        <div className="space-y-xxl">
          <AnalyticsPanel title="Event stream">
            <div className="flex flex-col sm:flex-row sm:items-end gap-md mb-lg">
              <label className="flex flex-col gap-xxs flex-1 sm:flex-none">
                <span className="text-caption text-mute">Search</span>
                <input
                  value={eventSearchDraft}
                  onChange={(event) => setEventSearchDraft(event.target.value)}
                  placeholder="path, title, city"
                  className="h-10 px-3 bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none"
                />
              </label>
              <label className="flex flex-col gap-xxs">
                <span className="text-caption text-mute">Event type</span>
                <select
                  value={eventTypeDraft}
                  onChange={(event) => setEventTypeDraft(event.target.value)}
                  className="h-10 px-3 bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none cursor-pointer"
                >
                  <option value="">All events</option>
                  {ANALYTICS_EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <Button variant="primary" size="sm" onClick={applyEventFilters}>
                Apply
              </Button>
            </div>

            {!eventsPayload ? (
              <LoadingPanel label="Loading events..." />
            ) : (
              <>
                <DataTable
                  rows={eventsPayload.rows}
                  rowKey={(row) => row.eventId}
                  emptyLabel="No events match these filters"
                  pageSize={Math.max(1, eventsPayload.totalPages)}
                  columns={eventColumns}
                />

                {eventsPayload.totalPages > 1 && (
                  <div className="flex items-center gap-2 mt-lg">
                    <Button
                      variant="outline-dark"
                      size="sm"
                      disabled={eventsPayload.page <= 1}
                      onClick={() => setEventPage(eventsPayload.page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-body-sm text-mute px-2">
                      Page {eventsPayload.page} of {eventsPayload.totalPages} ({eventsPayload.total.toLocaleString()} events)
                    </span>
                    <Button
                      variant="outline-dark"
                      size="sm"
                      disabled={eventsPayload.page >= eventsPayload.totalPages}
                      onClick={() => setEventPage(eventsPayload.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </AnalyticsPanel>
        </div>
      )}

      {!error && activeTab === 'settings' && (
        <div className="space-y-xxl">
          {!status ? (
            <LoadingPanel />
          ) : (
            <>
              {status.warning && (
                <div className="bg-warning/10 border border-warning p-lg flex items-start gap-md">
                  <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-xxs" />
                  <div>
                    <p className="text-body-md text-ink font-600">Configuration warning</p>
                    <p className="text-body-sm text-mute mt-xs">{status.warning}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
                <AnalyticsPanel title="Collection">
                  <dl className="space-y-md">
                    <StatusRow label="Collection enabled" value={status.enabled ? 'Yes' : 'No'} ok={status.enabled} />
                    <StatusRow label="Geolocation provider configured" value={status.geolocationConfigured ? 'Yes' : 'No'} ok={status.geolocationConfigured} />
                    <StatusRow label="Admin traffic excluded by default" value={status.excludeAdmins ? 'Yes' : 'No'} ok={status.excludeAdmins} />
                    <StatusRow label="Session window" value={`${status.sessionWindowMinutes} minutes of inactivity`} ok />
                    <StatusRow label="Reporting timezone" value={status.reportingTimezone} ok />
                    <StatusRow label="Geolocation cache TTL" value={`${status.cacheTtlHours} hours`} ok />
                    <StatusRow label="Event retention" value={`${status.retentionDays} days`} ok />
                  </dl>
                  <div className="mt-xl">
                    <Button variant="outline-dark" size="sm" onClick={syncIndexes} disabled={syncingIndexes}>
                      <RotateCw className={cn('w-4 h-4 mr-1', syncingIndexes && 'animate-spin')} />
                      {syncingIndexes ? 'Syncing indexes...' : 'Sync database indexes'}
                    </Button>
                    <p className="text-caption text-mute mt-sm">
                      Idempotent. Creates any missing analytics index and aligns the retention TTL with
                      ANALYTICS_RETENTION_DAYS. Safe to run at any time; it never deletes data.
                    </p>
                  </div>
                </AnalyticsPanel>

                <AnalyticsPanel title="IPstack usage (this process)">
                  <dl className="space-y-md">
                    <StatusRow label="Lookup attempts" value={status.usage.attempts.toLocaleString()} />
                    <StatusRow label="Successful lookups" value={status.usage.successes.toLocaleString()} />
                    <StatusRow label="Failed lookups" value={status.usage.failures.toLocaleString()} />
                    <StatusRow label="Cache hits" value={status.usage.cacheHits.toLocaleString()} />
                    <StatusRow label="Quota / rate-limit errors" value={status.usage.quotaErrors.toLocaleString()} />
                    <StatusRow label="Last successful lookup" value={status.usage.lastSuccessAt ? formatTimestamp(status.usage.lastSuccessAt, 'UTC') : 'Never'} />
                    <StatusRow label="Last error code" value={status.usage.lastErrorCode ?? '—'} />
                  </dl>
                  <p className="text-caption text-mute mt-lg">
                    Counters are per running process and reset on restart. IPstack does not expose a remaining-quota figure through its API, so none is invented here — check the APILayer dashboard for plan usage.
                  </p>
                </AnalyticsPanel>
              </div>

              <AnalyticsPanel title="Definitions">
                <ul className="space-y-sm text-body-sm text-mute">
                  <li>
                    <span className="text-ink font-600">Page view</span> — one recorded navigation to an eligible route. API,
                    asset, upload, and admin-analytics routes are excluded.
                  </li>
                  <li>
                    <span className="text-ink font-600">Session</span> — page views from one visitor with no gap longer than{' '}
                    {status.sessionWindowMinutes} minutes. Sessionization is server-authoritative.
                  </li>
                  <li>
                    <span className="text-ink font-600">Unique visitor</span> — a keyed HMAC of a browser-generated random id.
                    The raw identifier and the IP address are never stored.
                  </li>
                  <li>
                    <span className="text-ink font-600">New vs returning</span> — a visitor is new when no earlier page view exists in
                    the retained history before the reporting period started.
                  </li>
                  <li>
                    <span className="text-ink font-600">Engagement rate</span> — share of sessions containing at least two page views.
                  </li>
                  <li>
                    <span className="text-ink font-600">Average session duration</span> — mean gap between first and last event,
                    computed only over sessions with two or more events. Shown as “—” otherwise.
                  </li>
                </ul>
              </AnalyticsPanel>
            </>
          )}
        </div>
      )}

      <p className="text-caption text-mute mt-xxxl">
        Reports read from first-party events only. No historical traffic is imported from server logs, so data begins when
        collection was first enabled. Use the CSV export in the Pages or Events tab for offline analysis.
      </p>
    </div>
  )
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-md">
      <dt className="text-body-sm text-mute">{label}</dt>
      <dd className="text-body-sm text-ink font-600 text-right">
        {ok === undefined ? value : <Badge variant={ok ? 'success' : 'warning'}>{value}</Badge>}
      </dd>
    </div>
  )
}
