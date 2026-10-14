import type { PipelineStage } from 'mongoose'
import type {
  AnalyticsFilterQuery,
  AnalyticsKpi,
  AnalyticsTimeseriesPoint,
} from '@/types/analytics'
import { normalizePath } from '@/lib/analytics/paths'
import { getAnalyticsConfig, isSupportedTimezone } from '@/lib/analytics/config'
import AnalyticsEvent from '@/models/AnalyticsEvent'
import AnalyticsSession from '@/models/AnalyticsSession'

/**
 * Aggregation pipeline inputs are built as plain values; `match` objects are assembled
 * from validated scalars only, so no client-supplied key can reach a query operator.
 */
type MatchStage = Record<string, unknown>

/**
 * Mongoose's pipeline typing stops at `$group`, so results that pass through `$project`
 * with `$size` are asserted at this single boundary. Every pipeline below is assembled
 * from validated scalars — never from raw request input.
 */
function aggregateAs<T>(model: typeof AnalyticsEvent | typeof AnalyticsSession, pipeline: PipelineStage[]): Promise<T[]> {
  return model.aggregate(pipeline) as unknown as Promise<T[]>
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MAX_PAGE_SIZE = 100

export interface ParsedFilters extends AnalyticsFilterQuery {
  preset: string
  granularity: 'hour' | 'day'
}

function clampString(value: string | null, maxLength = 120) {
  if (!value) return undefined
  const trimmed = value.trim().slice(0, maxLength)
  return trimmed || undefined
}

function getTimezoneOffsetMs(date: Date, timeZone: string) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    const parts = formatter.formatToParts(date)
    const map: Record<string, string> = {}
    for (const part of parts) map[part.type] = part.value
    const asUtc = Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day),
      Number(map.hour) % 24,
      Number(map.minute),
      Number(map.second),
    )
    return asUtc - date.getTime()
  } catch {
    return 0
  }
}

/** Converts a wall-clock time in the reporting timezone into the matching UTC instant. */
export function zonedToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
) {
  const naive = Date.UTC(year, month - 1, day, hour, minute, second)
  let utc = naive - getTimezoneOffsetMs(new Date(naive), timeZone)
  utc = naive - getTimezoneOffsetMs(new Date(utc), timeZone)
  return new Date(utc)
}

function parseBoundary(value: string | null | undefined, timeZone: string, endOfDay: boolean) {
  if (!value || !DATE_PATTERN.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  return zonedToUtc(year, month, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, timeZone)
}

function startOfReportingDay(date: Date, timeZone: string) {
  const offset = getTimezoneOffsetMs(date, timeZone)
  const local = new Date(date.getTime() + offset)
  const day = local.getUTCDate()
  const localMidnightUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), day)
  return new Date(localMidnightUtc - getTimezoneOffsetMs(new Date(localMidnightUtc), timeZone))
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000)
}

export function resolvePresetRange(preset: string, timeZone: string, fromParam?: string | null, toParam?: string | null) {
  const today = startOfReportingDay(new Date(), timeZone)
  const yesterday = addDays(today, -1)

  if (preset === 'custom') {
    const from = parseBoundary(fromParam, timeZone, false) ?? addDays(today, -29)
    const to = parseBoundary(toParam, timeZone, true) ?? today
    if (to.getTime() < from.getTime()) return { from, to: from, invalid: true }
    return { from, to, invalid: false }
  }

  switch (preset) {
    case 'today':
      return { from: today, to: addDays(today, 1), invalid: false }
    case 'yesterday':
      return { from: yesterday, to: today, invalid: false }
    case '7d':
      return { from: addDays(today, -6), to: addDays(today, 1), invalid: false }
    case '90d':
      return { from: addDays(today, -89), to: addDays(today, 1), invalid: false }
    case '30d':
    default:
      return { from: addDays(today, -29), to: addDays(today, 1), invalid: false }
  }
}

export function parseFilters(searchParams: URLSearchParams): ParsedFilters {
  const config = getAnalyticsConfig()
  const requestedTimezone = clampString(searchParams.get('tz'), 64)
  const timezone = requestedTimezone && isSupportedTimezone(requestedTimezone) ? requestedTimezone : config.reportingTimezone

  const preset = clampString(searchParams.get('range'), 24) ?? '30d'
  const resolved = resolvePresetRange(preset, timezone, searchParams.get('from'), searchParams.get('to'))

  // An inverted or unparseable range collapses to a safe default window rather than
  // throwing, so a hand-edited URL can never produce a negative-length query.
  const range = resolved.invalid ? defaultRange(timezone) : clampRange(resolved.from, resolved.to, config.maxReportingRangeDays)

  // Derived from the final window so the comparison period always has the same length.
  const durationMs = range.to.getTime() - range.from.getTime()

  return {
    preset: resolved.invalid ? 'invalid' : preset,
    from: range.from,
    to: range.to,
    previousFrom: new Date(range.from.getTime() - durationMs),
    previousTo: range.from,
    countryCode: clampString(searchParams.get('country'), 8)?.toUpperCase(),
    regionName: clampString(searchParams.get('region'), 120),
    city: clampString(searchParams.get('city'), 120),
    deviceType: clampString(searchParams.get('device'), 24),
    browserFamily: clampString(searchParams.get('browser'), 48),
    osFamily: clampString(searchParams.get('os'), 48),
    path: normalizePath(clampString(searchParams.get('path'), 512)) ?? undefined,
    includeInternal: searchParams.get('includeInternal') === 'true',
    includeBots: searchParams.get('includeBots') === 'true',
    timezone,
    granularity: durationMs <= 3 * 86_400_000 ? 'hour' : 'day',
  }
}

function defaultRange(timeZone: string) {
  const today = startOfReportingDay(new Date(), timeZone)
  return { from: addDays(today, -29), to: addDays(today, 1) }
}

/** Trims `to` so the window never exceeds the configured reporting cap. */
function clampRange(from: Date, to: Date, maxDays: number) {
  if (to.getTime() <= from.getTime()) return defaultRange('UTC')
  const spanDays = Math.ceil((to.getTime() - from.getTime()) / 86_400_000)
  if (spanDays <= maxDays) return { from, to }
  return { from, to: new Date(from.getTime() + maxDays * 86_400_000) }
}

export function eventMatch(filter: ParsedFilters, range?: { from: Date; to: Date }) {
  const match: MatchStage = {
    occurredAt: { $gte: range?.from ?? filter.from, $lt: range?.to ?? filter.to },
  }
  if (!filter.includeInternal) match.isInternal = false
  if (!filter.includeBots) match.isBot = false
  if (filter.countryCode) match.countryCode = filter.countryCode
  if (filter.regionName) match.regionName = filter.regionName
  if (filter.city) match.city = filter.city
  if (filter.deviceType) match.deviceType = filter.deviceType
  if (filter.browserFamily) match.browserFamily = filter.browserFamily
  if (filter.osFamily) match.osFamily = filter.osFamily
  if (filter.path) match.path = filter.path
  return match
}

export function sessionMatch(filter: ParsedFilters, range?: { from: Date; to: Date }) {
  const match: MatchStage = {
    startedAt: { $gte: range?.from ?? filter.from, $lt: range?.to ?? filter.to },
  }
  if (!filter.includeInternal) match.isInternal = false
  if (!filter.includeBots) match.isBot = false
  if (filter.countryCode) match.countryCode = filter.countryCode
  if (filter.regionName) match.regionName = filter.regionName
  if (filter.city) match.city = filter.city
  if (filter.deviceType) match.deviceType = filter.deviceType
  if (filter.browserFamily) match.browserFamily = filter.browserFamily
  if (filter.osFamily) match.osFamily = filter.osFamily
  return match
}

function computeDelta(current: number, previous: number): AnalyticsKpi {
  const deltaPercent =
    previous === 0 ? (current === 0 ? 0 : null) : Math.round(((current - previous) / previous) * 1000) / 10
  return { value: current, previous, deltaPercent }
}

async function periodTotals(filter: ParsedFilters, range: { from: Date; to: Date }) {
  const [eventAgg, sessionAgg, geoAgg] = await Promise.all([
    aggregateAs<{ pageViews: number; visitors: number }>(AnalyticsEvent, [
      { $match: eventMatch(filter, range) },
      { $group: { _id: null, pageViews: { $sum: 1 }, visitors: { $addToSet: '$visitorIdHash' } } },
      { $project: { _id: 0, pageViews: 1, visitors: { $size: '$visitors' } } },
    ]),
aggregateAs<{ sessions: number; engagedSessions: number }>(AnalyticsSession, [
      { $match: sessionMatch(filter, range) },
      {
        $group: {
          _id: null,
          sessions: { $sum: 1 },
          engagedSessions: { $sum: { $cond: [{ $gte: ['$pageViewCount', 2] }, 1, 0] } },
        },
      },
      { $project: { _id: 0, sessions: 1, engagedSessions: 1 } },
    ]),
    aggregateAs<{ known: number }>(AnalyticsEvent, [
      { $match: { ...eventMatch(filter, range), countryCode: { $exists: true, $nin: [null, ''] } } },
      { $count: 'known' },
    ]),
  ])

const pageViews = eventAgg[0]?.pageViews ?? 0
  const visitors = eventAgg[0]?.visitors ?? 0
  const sessions = sessionAgg[0]?.sessions ?? 0
  const engagedSessions = sessionAgg[0]?.engagedSessions ?? 0

  return {
    pageViews,
    visitors,
    sessions,
    engagedSessions,
    knownGeo: geoAgg[0]?.known ?? 0,
    avgPagesPerSession: sessions > 0 ? Math.round((pageViews / sessions) * 100) / 100 : 0,
    engagementRate: sessions > 0 ? Math.round((engagedSessions / sessions) * 1000) / 10 : 0,
  }
}

async function newReturningVisitors(filter: ParsedFilters, range: { from: Date; to: Date }) {
  const [periodVisitors, priorVisitors] = await Promise.all([
    aggregateAs<{ _id: string }>(AnalyticsEvent, [
      { $match: eventMatch(filter, range) },
      { $group: { _id: '$visitorIdHash' } },
    ]),
    aggregateAs<{ _id: string }>(AnalyticsEvent, [
      { $match: { ...eventMatch({ ...filter, includeBots: true, includeInternal: true }, { from: new Date(0), to: range.from }) } },
      { $group: { _id: '$visitorIdHash' } },
    ]),
  ])

  const prior = new Set(priorVisitors.map((row) => row._id))
  let newCount = 0
  for (const row of periodVisitors) {
    if (!prior.has(row._id)) newCount += 1
  }

  return { newVisitors: newCount, returningVisitors: Math.max(0, periodVisitors.length - newCount) }
}

async function averageSessionDuration(filter: ParsedFilters, range: { from: Date; to: Date }) {
  const agg = await aggregateAs<{ totalMs: number; count: number }>(AnalyticsSession, [
    { $match: sessionMatch(filter, range) },
    // Only sessions with real elapsed time contribute; a non-positive gap means the
    // clock moved backwards or the row was backfilled, and must never skew the average.
    { $match: { pageViewCount: { $gte: 2 }, $expr: { $gt: [{ $subtract: ['$lastSeenAt', '$startedAt'] }, 0] } } },
    {
      $group: {
        _id: null,
        totalMs: { $sum: { $subtract: ['$lastSeenAt', '$startedAt'] } },
        count: { $sum: 1 },
      },
    },
  ])

  const row = agg[0]
  if (!row || row.count === 0) return null
  return Math.round(row.totalMs / row.count / 1000)
}

async function topCountry(filter: ParsedFilters, range: { from: Date; to: Date }) {
  const agg = await aggregateAs<{ _id: string; name: string; visitors: number }>(AnalyticsEvent, [
    { $match: { ...eventMatch(filter, range), countryCode: { $exists: true, $nin: [null, ''] } } },
    {
      $group: {
        _id: '$countryCode',
        name: { $first: '$countryName' },
        visitors: { $addToSet: '$visitorIdHash' },
      },
    },
    { $project: { _id: 1, name: 1, visitors: { $size: '$visitors' } } },
    { $sort: { visitors: -1 } },
    { $limit: 1 },
  ])

  const row = agg[0]
  return row ? { countryCode: row._id, countryName: row.name, visitors: row.visitors } : null
}

export async function getOverview(filter: ParsedFilters) {
  const range = { from: filter.from, to: filter.to }
  const previousRange = { from: filter.previousFrom, to: filter.previousTo }

const [current, previous, audience, durationSeconds, leadingCountry, recentEvents] = await Promise.all([
    periodTotals(filter, range),
    periodTotals(filter, previousRange),
    newReturningVisitors(filter, range),
    averageSessionDuration(filter, range),
    topCountry(filter, range),
    getEvents(filter, { page: 1, pageSize: 6 }),
  ])

  const geoCoverage = current.pageViews > 0 ? Math.round((current.knownGeo / current.pageViews) * 1000) / 10 : 0

  return {
    period: { from: filter.from, to: filter.to },
    previousPeriod: { from: filter.previousFrom, to: filter.previousTo },
    kpis: {
      pageViews: computeDelta(current.pageViews, previous.pageViews),
      sessions: computeDelta(current.sessions, previous.sessions),
      visitors: computeDelta(current.visitors, previous.visitors),
      newVisitors: { value: audience.newVisitors, previous: null, deltaPercent: null },
      returningVisitors: {
        value: audience.returningVisitors,
        previous: null,
        deltaPercent: null,
      },
      avgPagesPerSession: computeDelta(current.avgPagesPerSession, previous.avgPagesPerSession),
      engagementRate: computeDelta(current.engagementRate, previous.engagementRate),
      avgSessionDurationSeconds: durationSeconds,
      topCountry: leadingCountry,
      geoCoverageRate: { value: geoCoverage, previous: null, deltaPercent: null },
    },
    recentEvents: recentEvents.rows,
    isEmpty: current.pageViews === 0 && current.sessions === 0,
    filtersApplied: {
      country: filter.countryCode ?? null,
      device: filter.deviceType ?? null,
      path: filter.path ?? null,
      includeInternal: filter.includeInternal,
      includeBots: filter.includeBots,
    },
  }
}

export async function getTimeseries(filter: ParsedFilters): Promise<AnalyticsTimeseriesPoint[]> {
  const format = filter.granularity === 'hour' ? '%Y-%m-%dT%H:00' : '%Y-%m-%d'
  // A fresh object per pipeline: Mongoose casts aggregation stages in place, so sharing
  // one reference across concurrently running pipelines corrupts the expression.
  const bucket = (field: '$occurredAt' | '$startedAt') => ({
    $dateToString: { format, date: field, timezone: filter.timezone },
  })

  const [eventRows, sessionRows] = await Promise.all([
    aggregateAs<{ _id: string; pageViews: number; visitors: number }>(AnalyticsEvent, [
      { $match: eventMatch(filter) },
      { $group: { _id: bucket('$occurredAt'), pageViews: { $sum: 1 }, visitors: { $addToSet: '$visitorIdHash' } } },
      { $project: { _id: 1, pageViews: 1, visitors: { $size: '$visitors' } } },
    ]),
    aggregateAs<{ _id: string; sessions: number }>(AnalyticsSession, [
      { $match: sessionMatch(filter) },
      { $group: { _id: bucket('$startedAt'), sessions: { $sum: 1 } } },
    ]),
  ])

  const sessions = new Map(sessionRows.map((row) => [row._id, row.sessions]))
  const points = new Map<string, AnalyticsTimeseriesPoint>()
  for (const row of eventRows) {
    if (typeof row._id !== 'string') continue
    points.set(row._id, { bucket: row._id, pageViews: row.pageViews, visitors: row.visitors, sessions: 0 })
  }
  for (const [key, value] of sessions) {
    const existing = points.get(key)
    if (existing) existing.sessions = value
    else points.set(key, { bucket: key, pageViews: 0, visitors: 0, sessions: value })
  }

  return Array.from(points.values()).sort((a, b) => a.bucket.localeCompare(b.bucket))
}

export interface GeographyReport {
  countries: { countryCode: string; countryName: string; visitors: number; sessions: number; pageViews: number }[]
  regions: { regionName: string; countryCode: string; visitors: number; pageViews: number }[]
  cities: { city: string; regionName?: string; countryCode: string; visitors: number; sessions: number; pageViews: number }[]
  trend: { bucket: string; countryCode: string; visitors: number }[]
  coverage: { country: number; region: number; city: number; pageViews: number }
}

export async function getGeography(filter: ParsedFilters, limit = 25): Promise<GeographyReport> {
  const bucket = () => ({ $dateToString: { format: '%Y-%m-%d', date: '$occurredAt', timezone: filter.timezone } })
  const geoRequired = { countryCode: { $exists: true, $nin: [null, ''] } }

  const [countryRows, regionRows, cityRows, trendRows, coverageAgg] = await Promise.all([
    aggregateAs<{ _id: string; name: string; visitors: number; pageViews: number; sessions: number }>(AnalyticsEvent, [
      { $match: { ...eventMatch(filter), ...geoRequired } },
      {
        $group: {
          _id: '$countryCode',
          name: { $first: '$countryName' },
          visitors: { $addToSet: '$visitorIdHash' },
          pageViews: { $sum: 1 },
          sessions: { $addToSet: '$sessionId' },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          visitors: { $size: '$visitors' },
          pageViews: 1,
          sessions: { $size: '$sessions' },
        },
      },
      { $sort: { visitors: -1 } },
      { $limit: limit },
    ]),
    aggregateAs<{ _id: { regionName: string; countryCode: string }; visitors: number; pageViews: number }>(AnalyticsEvent, [
      { $match: { ...eventMatch(filter), regionName: { $exists: true, $nin: [null, ''] } } },
      { $group: { _id: { regionName: '$regionName', countryCode: '$countryCode' }, visitors: { $addToSet: '$visitorIdHash' }, pageViews: { $sum: 1 } } },
      { $project: { _id: 1, visitors: { $size: '$visitors' }, pageViews: 1 } },
      { $sort: { visitors: -1 } },
      { $limit: limit },
    ]),
    aggregateAs<{ _id: { city: string; regionName: string; countryCode: string }; visitors: number; sessions: number; pageViews: number }>(AnalyticsEvent, [
      { $match: { ...eventMatch(filter), city: { $exists: true, $nin: [null, ''] } } },
      {
        $group: {
          _id: { city: '$city', regionName: '$regionName', countryCode: '$countryCode' },
          visitors: { $addToSet: '$visitorIdHash' },
          sessions: { $addToSet: '$sessionId' },
          pageViews: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 1,
          visitors: { $size: '$visitors' },
          sessions: { $size: '$sessions' },
          pageViews: 1,
        },
      },
      { $sort: { visitors: -1 } },
      { $limit: limit },
    ]),
    aggregateAs<{ _id: { bucket: string; countryCode: string }; visitors: number }>(AnalyticsEvent, [
      { $match: { ...eventMatch(filter), ...geoRequired } },
      { $group: { _id: { bucket: bucket(), countryCode: '$countryCode' }, visitors: { $addToSet: '$visitorIdHash' } } },
      { $project: { _id: 1, visitors: { $size: '$visitors' } } },
      { $sort: { '_id.bucket': 1, visitors: -1 } },
      { $limit: 400 },
    ]),
    aggregateAs<{ total: number; country: number; region: number; city: number }>(AnalyticsEvent, [
      { $match: eventMatch(filter) },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          country: { $sum: { $cond: [{ $ne: [{ $ifNull: ['$countryCode', ''] }, ''] }, 1, 0] } },
          region: { $sum: { $cond: [{ $ne: [{ $ifNull: ['$regionName', ''] }, ''] }, 1, 0] } },
          city: { $sum: { $cond: [{ $ne: [{ $ifNull: ['$city', ''] }, ''] }, 1, 0] } },
        },
      },
    ]),
  ])

  const coverageRow = coverageAgg[0] ?? { total: 0, country: 0, region: 0, city: 0 }
  const pct = (value: number) => (coverageRow.total > 0 ? Math.round((value / coverageRow.total) * 1000) / 10 : 0)

  return {
    countries: countryRows.map((row) => ({
      countryCode: row._id,
      countryName: row.name ?? row._id,
      visitors: row.visitors,
      sessions: row.sessions,
      pageViews: row.pageViews,
    })),
    regions: regionRows.map((row) => ({
      regionName: row._id?.regionName ?? 'Unknown',
      countryCode: row._id?.countryCode ?? '',
      visitors: row.visitors,
      pageViews: row.pageViews,
    })),
    cities: cityRows.map((row) => ({
      city: row._id?.city ?? 'Unknown',
      regionName: row._id?.regionName,
      countryCode: row._id?.countryCode ?? '',
      visitors: row.visitors,
      sessions: row.sessions,
      pageViews: row.pageViews,
    })),
    trend: trendRows.map((row) => ({
      bucket: row._id?.bucket ?? '',
      countryCode: row._id?.countryCode ?? '',
      visitors: row.visitors,
    })),
    coverage: {
      country: pct(coverageRow.country),
      region: pct(coverageRow.region),
      city: pct(coverageRow.city),
      pageViews: coverageRow.total,
    },
  }
}

export interface DistributionRow {
  name: string
  visitors: number
  pageViews: number
}

function distribution(field: 'deviceType' | 'browserFamily' | 'osFamily', filter: ParsedFilters) {
  return aggregateAs<{ _id: string; visitors: number; pageViews: number }>(AnalyticsEvent, [
    { $match: { ...eventMatch(filter), [field]: { $exists: true, $nin: [null, '', 'unknown'] } } },
    { $group: { _id: `$${field}`, visitors: { $addToSet: '$visitorIdHash' }, pageViews: { $sum: 1 } } },
    { $project: { _id: 1, visitors: { $size: '$visitors' }, pageViews: 1 } },
    { $sort: { visitors: -1 } },
    { $limit: 10 },
  ]).then((rows) =>
    rows.map<DistributionRow>((row) => ({ name: row._id, visitors: row.visitors, pageViews: row.pageViews })),
  )
}

export function getDeviceDistribution(filter: ParsedFilters) {
  return distribution('deviceType', filter)
}

export async function getVisitors(filter: ParsedFilters) {
  const range = { from: filter.from, to: filter.to }
  const [totals, audience, devices, browsers, operatingSystems, recentSessions, series] = await Promise.all([
    periodTotals(filter, range),
    newReturningVisitors(filter, range),
    distribution('deviceType', filter),
    distribution('browserFamily', filter),
    distribution('osFamily', filter),
    AnalyticsSession.find(sessionMatch(filter))
      .sort({ lastSeenAt: -1 })
      .limit(12)
      .select('-__v')
      .lean(),
    getTimeseries(filter),
  ])

  return {
    totals: {
      visitors: totals.visitors,
      newVisitors: audience.newVisitors,
      returningVisitors: audience.returningVisitors,
      sessions: totals.sessions,
      avgPagesPerSession: totals.avgPagesPerSession,
      engagementRate: totals.engagementRate,
    },
    distributions: { devices, browsers, operatingSystems },
    series,
    recentSessions: recentSessions.map((session) => ({
      sessionId: session.sessionId,
      visitorIdHash: session.visitorIdHash.slice(0, 8),
      startedAt: session.startedAt,
      lastSeenAt: session.lastSeenAt,
      pageViewCount: session.pageViewCount,
      landingPath: session.landingPath,
      exitPath: session.exitPath,
      countryCode: session.countryCode,
      countryName: session.countryName,
      regionName: session.regionName,
      city: session.city,
      deviceType: session.deviceType,
      browserFamily: session.browserFamily,
      osFamily: session.osFamily,
      isAuthenticated: session.isAuthenticated,
      userRole: session.userRole,
      isInternal: session.isInternal,
      isBot: session.isBot,
    })),
  }
}

export interface PageRow {
  path: string
  pageTitle: string
  pageViews: number
  visitors: number
  sessions: number
  entrances: number
  exits: number
}

export async function getPages(filter: ParsedFilters, limit = 50) {
  const [rows, entrances, exits] = await Promise.all([
    aggregateAs<{ _id: string; title: string; pageViews: number; visitors: number; sessions: number }>(
      AnalyticsEvent,
      [
{ $match: eventMatch(filter) },
        {
          $group: {
            _id: '$path',
            title: { $first: '$pageTitle' },
            pageViews: { $sum: 1 },
            visitors: { $addToSet: '$visitorIdHash' },
            sessions: { $addToSet: '$sessionId' },
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            pageViews: 1,
            visitors: { $size: '$visitors' },
            sessions: { $size: '$sessions' },
          },
        },
        { $sort: { pageViews: -1 } },
        { $limit: limit },
      ],
    ),
    aggregateAs<{ _id: string; count: number }>(AnalyticsSession, [
      { $match: sessionMatch(filter) },
      { $group: { _id: '$landingPath', count: { $sum: 1 } } },
    ]),
    aggregateAs<{ _id: string; count: number }>(AnalyticsSession, [
      { $match: sessionMatch(filter) },
      { $group: { _id: '$exitPath', count: { $sum: 1 } } },
    ]),
  ])

  const entranceMap = new Map(entrances.map((row) => [row._id, row.count]))
  const exitMap = new Map(exits.map((row) => [row._id, row.count]))

  return rows.map<PageRow>((row) => ({
    path: row._id,
    pageTitle: row.title ?? row._id,
    pageViews: row.pageViews,
    visitors: row.visitors,
    sessions: row.sessions,
    entrances: entranceMap.get(row._id) ?? 0,
    exits: exitMap.get(row._id) ?? 0,
  }))
}

export async function getReferrers(filter: ParsedFilters, limit = 20) {
  const rows = await aggregateAs<{ _id: string | null; visitors: number; pageViews: number; sessions: number }>(AnalyticsEvent, [
    { $match: eventMatch(filter) },
    {
      $group: {
        _id: '$referrerHost',
        visitors: { $addToSet: '$visitorIdHash' },
        pageViews: { $sum: 1 },
        sessions: { $addToSet: '$sessionId' },
      },
    },
    {
      $project: {
        _id: 1,
        visitors: { $size: '$visitors' },
        pageViews: 1,
        sessions: { $size: '$sessions' },
      },
    },
    { $sort: { pageViews: -1 } },
    { $limit: limit },
  ])

  return rows.map((row) => ({
    host: row._id ?? null,
    label: row._id ?? 'Direct / unknown',
    visitors: row.visitors,
    pageViews: row.pageViews,
    sessions: row.sessions,
  }))
}

export interface EventsPage {
  rows: {
    eventId: string
    eventType: string
    occurredAt: Date
    path: string
    pageTitle?: string
    countryName?: string
    city?: string
    deviceType: string
    sessionShortId: string
    visitorShortId: string
    isAuthenticated: boolean
    userRole?: string
  }[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getEvents(filter: ParsedFilters, options: { page: number; pageSize: number; search?: string; eventType?: string }) {
  const pageSize = Math.min(Math.max(1, options.pageSize), MAX_PAGE_SIZE)
  const page = Math.max(1, options.page)

  const match = eventMatch(filter)
  if (options.eventType) match.eventType = options.eventType
  if (options.search) {
    const escaped = options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(escaped, 'i')
    match.$or = [{ path: pattern }, { pageTitle: pattern }, { city: pattern }, { countryName: pattern }]
  }

  const [total, rows] = await Promise.all([
    AnalyticsEvent.countDocuments(match),
    AnalyticsEvent.find(match)
      .sort({ occurredAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select('eventId eventType occurredAt path pageTitle countryName city deviceType sessionId visitorIdHash isAuthenticated userRole')
      .lean(),
  ])

  return {
    rows: rows.map((row) => ({
      eventId: row.eventId,
      eventType: row.eventType,
      occurredAt: row.occurredAt,
      path: row.path,
      pageTitle: row.pageTitle,
      countryName: row.countryName,
      city: row.city,
      deviceType: row.deviceType,
      sessionShortId: row.sessionId.slice(0, 8),
      visitorShortId: row.visitorIdHash.slice(0, 8),
      isAuthenticated: row.isAuthenticated,
      userRole: row.userRole,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  } satisfies EventsPage
}

export async function getEventExportRows(filter: ParsedFilters, limit = 5000) {
  return AnalyticsEvent.find(eventMatch(filter))
    .sort({ occurredAt: -1 })
    .limit(limit)
    .select(
      'eventId eventType occurredAt path pageTitle referrerHost countryCode countryName regionName city deviceType browserFamily osFamily geoStatus isAuthenticated userRole isInternal isBot',
    )
    .lean()
}