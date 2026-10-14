function readNumber(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(parsed)))
}

function readBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined || value === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

const utcFallback = 'UTC'

/**
 * Small-ICU Node builds (some Alpine images, some Windows installs) only know a handful of
 * zones. Rather than silently bucketing every report in UTC, an unusable zone is rejected.
 */
function resolveReportingTimezone(value: string | undefined) {
  const candidate = value?.trim()
  if (!candidate) return utcFallback
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(new Date())
    return candidate
  } catch {
    console.warn(`[analytics] ANALYTICS_REPORTING_TZ="${candidate}" is not supported by this runtime; using ${utcFallback}.`)
    return utcFallback
  }
}

export function isSupportedTimezone(value: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date())
    return true
  } catch {
    return false
  }
}

export interface AnalyticsConfig {
  enabled: boolean
  accessKey: string | null
  baseUrl: string
  timeoutMs: number
  cacheTtlHours: number
  failureBackoffMinutes: number
  retentionDays: number
  sessionWindowMinutes: number
  hashSecret: string
  trustedProxy: boolean
  reportingTimezone: string
  excludeAdmins: boolean
  rateLimitPerMinute: number
  maxEventsPerRequest: number
  maxBodyBytes: number
  maxReportingRangeDays: number
}

export function getAnalyticsConfig(): AnalyticsConfig {
  const accessKey = process.env.IPSTACK_ACCESS_KEY?.trim() || null

  return {
    enabled: readBoolean(process.env.ANALYTICS_ENABLED, true),
    accessKey,
    baseUrl: (process.env.IPSTACK_BASE_URL?.trim() || 'https://api.ipstack.com').replace(/\/+$/, ''),
    timeoutMs: readNumber(process.env.IPSTACK_TIMEOUT_MS, 3000, 250, 15000),
    cacheTtlHours: readNumber(process.env.IPSTACK_CACHE_TTL_HOURS, 168, 1, 2160),
    failureBackoffMinutes: readNumber(process.env.IPSTACK_FAILURE_BACKOFF_MINUTES, 60, 5, 10080),
    retentionDays: readNumber(process.env.ANALYTICS_RETENTION_DAYS, 90, 7, 3650),
    sessionWindowMinutes: readNumber(process.env.ANALYTICS_SESSION_WINDOW_MINUTES, 30, 5, 240),
    hashSecret:
      process.env.ANALYTICS_HASH_SECRET?.trim() ||
      process.env.AUTH_SECRET?.trim() ||
      '',
    trustedProxy: readBoolean(process.env.ANALYTICS_TRUST_PROXY, true),
    reportingTimezone: resolveReportingTimezone(process.env.ANALYTICS_REPORTING_TZ),
    excludeAdmins: readBoolean(process.env.ANALYTICS_EXCLUDE_ADMINS, true),
    rateLimitPerMinute: readNumber(process.env.ANALYTICS_RATE_LIMIT_PER_MINUTE, 120, 10, 5000),
    maxEventsPerRequest: readNumber(process.env.ANALYTICS_MAX_EVENTS_PER_REQUEST, 10, 1, 50),
    maxBodyBytes: readNumber(process.env.ANALYTICS_MAX_BODY_BYTES, 16 * 1024, 1024, 128 * 1024),
    maxReportingRangeDays: readNumber(process.env.ANALYTICS_MAX_RANGE_DAYS, 90, 1, 730),
  }
}

export function getGeolocationWarning(config: AnalyticsConfig) {
  if (!config.enabled) return 'Analytics collection is disabled (ANALYTICS_ENABLED=false).'
  if (!config.accessKey) {
    return 'IPSTACK_ACCESS_KEY is not set. Visitor geolocation is disabled; all other analytics still work.'
  }
  if (!config.hashSecret) {
    return 'Neither ANALYTICS_HASH_SECRET nor AUTH_SECRET is set. Pseudonymous hashing is unavailable, so events are stored unhashed.'
  }
  return null
}

let validated = false

export function validateAnalyticsConfig() {
  if (validated) return
  validated = true

  const config = getAnalyticsConfig()
  const warning = getGeolocationWarning(config)
  if (warning) {
    console.warn(`[analytics] ${warning}`)
    return
  }

  console.info(
    `[analytics] enabled | tz=${config.reportingTimezone} | sessionWindow=${config.sessionWindowMinutes}m | retention=${config.retentionDays}d | geoCache=${config.cacheTtlHours}h`
  )
}