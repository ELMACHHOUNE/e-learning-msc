import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { getAnalyticsConfig, getGeolocationWarning, validateAnalyticsConfig } from '@/lib/analytics/config'
import { getGeoUsage } from '@/lib/analytics/ipstack'
import {
  getDeviceDistribution,
  getEvents,
  getEventExportRows,
  getGeography,
  getOverview,
  getPages,
  getReferrers,
  getTimeseries,
  getVisitors,
  parseFilters,
} from '@/lib/analytics/reports'
import { ANALYTICS_EVENT_TYPES } from '@/types/analytics'

export const dynamic = 'force-dynamic'

const REPORTS = [
  'overview',
  'timeseries',
  'geography',
  'visitors',
  'pages',
  'referrers',
  'events',
  'provider-status',
  'export',
] as const

type ReportName = (typeof REPORTS)[number]

function isReportName(value: string | null): value is ReportName {
  return typeof value === 'string' && (REPORTS as readonly string[]).includes(value)
}

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(parsed)))
}

function unauthorizedResponse(error: unknown) {
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
  }
  return null
}

function csvEscape(value: unknown) {
  if (value === undefined || value === null) return ''
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function toCsv(headers: string[], rows: unknown[][]) {
  return [headers.map(csvEscape).join(','), ...rows.map((row) => row.map(csvEscape).join(','))].join('\n')
}

export async function GET(req: Request) {
  validateAnalyticsConfig()

  let user
  try {
    user = await requireRole('admin')
  } catch (error) {
    const response = unauthorizedResponse(error)
    if (response) return response
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
  void user

  const { searchParams } = new URL(req.url)
  const report = searchParams.get('report') ?? 'overview'
  if (!isReportName(report)) {
    return NextResponse.json({ error: 'Unknown report' }, { status: 400 })
  }

  await connectToDatabase()

  const filter = parseFilters(searchParams)
  const headers = { 'Cache-Control': 'private, no-store' }

  try {
    switch (report) {
      case 'overview': {
        const [overview, series, countries, pages, referrers, devices] = await Promise.all([
          getOverview(filter),
          getTimeseries(filter),
          getGeography(filter, 8),
          getPages(filter, 8),
          getReferrers(filter, 8),
          getDeviceDistribution(filter),
        ])
        return NextResponse.json(
          {
            ...overview,
            timeseries: series,
            topCountries: countries.countries,
            topCities: countries.cities.slice(0, 8),
            topPages: pages,
            topReferrers: referrers,
            devices,
          },
          { headers },
        )
      }

      case 'timeseries':
        return NextResponse.json({ timeseries: await getTimeseries(filter) }, { headers })

      case 'geography':
        return NextResponse.json(await getGeography(filter, 25), { headers })

      case 'visitors':
        return NextResponse.json(await getVisitors(filter), { headers })

      case 'pages':
        return NextResponse.json({ pages: await getPages(filter, 50) }, { headers })

      case 'referrers':
        return NextResponse.json({ referrers: await getReferrers(filter, 20) }, { headers })

      case 'events': {
        const eventTypeParam = searchParams.get('eventType') ?? ''
        const eventType = (ANALYTICS_EVENT_TYPES as readonly string[]).includes(eventTypeParam)
          ? eventTypeParam
          : undefined
        const events = await getEvents(filter, {
          page: clampInt(searchParams.get('page'), 1, 1, 10000),
          pageSize: clampInt(searchParams.get('pageSize'), 25, 1, 100),
          search: searchParams.get('search')?.trim().slice(0, 80) || undefined,
          eventType,
        })
        return NextResponse.json(events, { headers })
      }

      case 'provider-status': {
        const config = getAnalyticsConfig()
        return NextResponse.json(
          {
            enabled: config.enabled,
            geolocationConfigured: Boolean(config.accessKey),
            warning: getGeolocationWarning(config),
            cacheTtlHours: config.cacheTtlHours,
            retentionDays: config.retentionDays,
            sessionWindowMinutes: config.sessionWindowMinutes,
            reportingTimezone: config.reportingTimezone,
            excludeAdmins: config.excludeAdmins,
            usage: getGeoUsage(),
          },
          { headers },
        )
      }

      case 'export': {
        const kind = searchParams.get('kind') === 'pages' ? 'pages' : 'events'
        if (kind === 'pages') {
          const pages = await getPages(filter, 1000)
          const csv = toCsv(
            ['path', 'page_title', 'page_views', 'visitors', 'sessions', 'entrances', 'exits'],
            pages.map((row) => [row.path, row.pageTitle, row.pageViews, row.visitors, row.sessions, row.entrances, row.exits]),
          )
          return new NextResponse(csv, {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="analytics-pages-${Date.now()}.csv"`,
              'Cache-Control': 'private, no-store',
            },
          })
        }

        const rows = await getEventExportRows(filter, 5000)
        const csv = toCsv(
          [
            'event_id',
            'event_type',
            'occurred_at',
            'path',
            'page_title',
            'referrer_host',
            'country_code',
            'country_name',
            'region',
            'city',
            'device',
            'browser',
            'os',
            'geo_status',
            'authenticated',
            'role',
            'internal',
            'bot',
          ],
          rows.map((row) => [
            row.eventId,
            row.eventType,
            row.occurredAt?.toISOString(),
            row.path,
            row.pageTitle,
            row.referrerHost,
            row.countryCode,
            row.countryName,
            row.regionName,
            row.city,
            row.deviceType,
            row.browserFamily,
            row.osFamily,
            row.geoStatus,
            row.isAuthenticated,
            row.userRole,
            row.isInternal,
            row.isBot,
          ]),
        )
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="analytics-events-${Date.now()}.csv"`,
            'Cache-Control': 'private, no-store',
          },
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown report' }, { status: 400 })
    }
  } catch (error) {
    console.error('[analytics] report failed:', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Unable to build this report' }, { status: 500 })
  }
}