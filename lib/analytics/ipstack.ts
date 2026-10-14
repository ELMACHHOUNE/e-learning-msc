import type { IAnalyticsGeoData, AnalyticsGeoStatus } from '@/types/analytics'
import AnalyticsGeoCache from '@/models/AnalyticsGeoCache'
import { connectToDatabase } from '@/lib/db'
import { getAnalyticsConfig } from '@/lib/analytics/config'
import { isEligibleForGeolocation } from '@/lib/analytics/ip'

export interface IpstackErrorBody {
  error?: {
    code?: number
    type?: string
    info?: string
  }
}

export type GeoLookupResult =
  | { status: 'ok'; geo: IAnalyticsGeoData; fromCache: boolean }
  | { status: 'failed'; code: string; fromCache: boolean }
  | { status: 'skipped'; code: string; fromCache: boolean }

interface UsageState {
  attempts: number
  successes: number
  failures: number
  cacheHits: number
  quotaErrors: number
  lastSuccessAt: Date | null
  lastErrorCode: string | null
}

declare global {
  var analyticsGeoUsage: UsageState | undefined
}

function usage(): UsageState {
  if (!global.analyticsGeoUsage) {
    global.analyticsGeoUsage = {
      attempts: 0,
      successes: 0,
      failures: 0,
      cacheHits: 0,
      quotaErrors: 0,
      lastSuccessAt: null,
      lastErrorCode: null,
    }
  }
  return global.analyticsGeoUsage
}

export function getGeoUsage() {
  const state = usage()
  return {
    attempts: state.attempts,
    successes: state.successes,
    failures: state.failures,
    cacheHits: state.cacheHits,
    quotaErrors: state.quotaErrors,
    lastSuccessAt: state.lastSuccessAt,
    lastErrorCode: state.lastErrorCode,
  }
}

export function resetGeoUsage() {
  global.analyticsGeoUsage = undefined
}

function cleanString(value: unknown, maxLength = 120): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, maxLength)
}

function cleanNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  return value
}

/**
 * Normalizes the IPstack response into the internal geo schema.
 *
 * Fields are only kept when the active subscription actually returned them — the free
 * plan omits ISP/ASN/connection type/latency and the security block is never requested.
 */
export function normalizeIpstackResponse(payload: Record<string, unknown>): IAnalyticsGeoData | null {
  if (payload && typeof payload.success === 'boolean' && payload.success === false) return null

  const countryCode = cleanString(payload.country_code, 4)?.toUpperCase()
  const countryName = cleanString(payload.country_name, 120)
  if (!countryCode && !countryName) return null

  const timezone = payload.time_zone as Record<string, unknown> | undefined
  const connection = payload.connection as Record<string, unknown> | undefined

  return {
    countryCode,
    countryName,
    continentCode: cleanString(payload.continent_code, 8)?.toUpperCase(),
    continentName: cleanString(payload.continent_name, 80),
    regionCode: cleanString(payload.region_code, 16),
    regionName: cleanString(payload.region_name, 120),
    city: cleanString(payload.city, 120),
    latitude: cleanNumber(payload.latitude),
    longitude: cleanNumber(payload.longitude),
    timezone: cleanString(timezone?.id, 64),
    isp: cleanString(connection?.isp, 160),
    asn: cleanNumber(connection?.asn),
    connectionType: cleanString(connection?.type, 40),
  }
}

export function describeIpstackError(status: number, body: IpstackErrorBody | null) {
  const code = body?.error?.code ?? status
  const type = body?.error?.type ?? 'unknown_error'
  let normalized = 'provider_error'

  if (code === 101 || type === 'missing_access_key') normalized = 'missing_access_key'
  else if (code === 102 || type === 'invalid_access_key') normalized = 'invalid_access_key'
  else if (code === 104 || type === 'inactive_user') normalized = 'inactive_account'
  else if (code === 301 || type === 'usage_limit_reached') normalized = 'quota_exceeded'
  else if (code === 302 || type === 'feature_not_enabled') normalized = 'feature_disabled'
  else if (status === 429) normalized = 'rate_limited'

  return normalized
}

async function fetchFromProvider(ip: string, accessKey: string, baseUrl: string, timeoutMs: number) {
  const url = new URL(`${baseUrl}/${encodeURIComponent(ip)}`)
  url.searchParams.set('access_key', accessKey)
  url.searchParams.set('output', 'json')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      headers: { accept: 'application/json' },
    })

    let payload: Record<string, unknown> | null = null
    try {
      payload = (await response.json()) as Record<string, unknown>
    } catch {
      payload = null
    }

    if (!response.ok) {
      const error = payload as unknown as IpstackErrorBody
      if (error?.error?.code === 301 || error?.error?.type === 'usage_limit_reached' || response.status === 429) {
        usage().quotaErrors += 1
      }
      return { ok: false as const, code: describeIpstackError(response.status, error) }
    }

    const geo = payload ? normalizeIpstackResponse(payload) : null
    if (!geo) return { ok: false as const, code: 'invalid_response' }

    return { ok: true as const, geo }
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError'
    return { ok: false as const, code: isTimeout ? 'timeout' : 'network_error' }
  } finally {
    clearTimeout(timer)
  }
}

async function readCache(ipHash: string) {
  await connectToDatabase()
  const cached = await AnalyticsGeoCache.findOne({ ipHash }).lean()
  if (!cached?.expiresAt) return null
  if (new Date(cached.expiresAt).getTime() <= Date.now()) return null
  return cached
}

/**
 * Resolves geolocation for a keyed IP hash. Never receives a raw address from the caller,
 * so a client can never choose which IP gets looked up.
 */
export async function lookupGeolocationForIp(ipHash: string, normalizedIp: string, scope: string): Promise<GeoLookupResult> {
  const config = getAnalyticsConfig()

  if (!config.enabled) return { status: 'skipped', code: 'disabled', fromCache: false }
  if (!ipHash || !normalizedIp) return { status: 'skipped', code: 'no_identifier', fromCache: false }
  if (!isEligibleForGeolocation(scope as never)) {
    return { status: 'skipped', code: 'non_public_address', fromCache: false }
  }
  if (!config.accessKey) {
    return { status: 'skipped', code: 'missing_access_key', fromCache: false }
  }

  const cached = await readCache(ipHash)
  if (cached) {
    usage().cacheHits += 1
    if (cached.status === 'ok' && cached.geo) {
      return { status: 'ok', geo: cached.geo as IAnalyticsGeoData, fromCache: true }
    }
    // A cached negative is reported as a failure so callers never see stale success data.
    return {
      status: cached.status === 'skipped' ? 'skipped' : 'failed',
      code: cached.errorCode ?? 'cached_failure',
      fromCache: true,
    }
  }

  usage().attempts += 1
  const result = await fetchFromProvider(normalizedIp, config.accessKey, config.baseUrl, config.timeoutMs)

  const now = new Date()
  if (result.ok) {
    usage().successes += 1
    usage().lastSuccessAt = now
    await writeCache(ipHash, 'ok', result.geo, now, now.getTime() + config.cacheTtlHours * 3600_000)
    return { status: 'ok', geo: result.geo, fromCache: false }
  }

  usage().failures += 1
  usage().lastErrorCode = result.code
  const backoffMs = config.failureBackoffMinutes * 60_000
  await writeCache(ipHash, 'negative', undefined, now, now.getTime() + backoffMs, result.code)
  return { status: 'failed', code: result.code, fromCache: false }
}

async function writeCache(
  ipHash: string,
  status: AnalyticsGeoStatus,
  geo: IAnalyticsGeoData | undefined,
  fetchedAt: Date,
  expiresAtMs: number,
  errorCode?: string,
) {
  await connectToDatabase()

  const fields: Record<string, unknown> = {
    ipHash,
    status,
    fetchedAt,
    expiresAt: new Date(expiresAtMs),
    errorCode,
  }
  if (geo) fields.geo = geo

  await AnalyticsGeoCache.updateOne({ ipHash }, { $set: fields }, { upsert: true }).catch(() => undefined)
}