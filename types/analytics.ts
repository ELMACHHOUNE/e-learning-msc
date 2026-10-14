export const ANALYTICS_EVENT_TYPES = [
  'page_view',
  'session_start',
  'session_end',
  'course_view',
  'lesson_view',
  'navigation_click',
  'search_submitted',
  'download_started',
  'login_success',
] as const

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number]

export const ANALYTICS_DEVICE_TYPES = ['desktop', 'mobile', 'tablet', 'bot', 'unknown'] as const
export type AnalyticsDeviceType = (typeof ANALYTICS_DEVICE_TYPES)[number]

export const ANALYTICS_GEO_STATUSES = ['ok', 'failed', 'skipped', 'negative'] as const
export type AnalyticsGeoStatus = (typeof ANALYTICS_GEO_STATUSES)[number]

export const ANALYTICS_METADATA_KEYS = [
  'linkLabel',
  'linkHref',
  'resultCount',
  'contentId',
  'contentType',
  'method',
] as const

export type AnalyticsMetadataKey = (typeof ANALYTICS_METADATA_KEYS)[number]

export interface IAnalyticsEvent {
  _id: string
  eventId: string
  eventType: AnalyticsEventType
  occurredAt: Date
  receivedAt: Date
  sessionId: string
  visitorIdHash: string
  ipHash?: string
  path: string
  pageTitle?: string
  referrerHost?: string
  referrerType: 'external' | 'internal' | 'direct_or_unknown'
  countryCode?: string
  countryName?: string
  continentCode?: string
  continentName?: string
  regionName?: string
  city?: string
  latitude?: number
  longitude?: number
  timezone?: string
  isp?: string
  asn?: number
  connectionType?: string
  geoStatus: AnalyticsGeoStatus
  deviceType: AnalyticsDeviceType
  browserFamily?: string
  osFamily?: string
  isAuthenticated: boolean
  userRole?: string
  isInternal: boolean
  isBot: boolean
  metadata?: Partial<Record<AnalyticsMetadataKey, string | number>>
}

export interface IAnalyticsSession {
  _id: string
  sessionId: string
  visitorIdHash: string
  startedAt: Date
  lastSeenAt: Date
  endedAt?: Date
  pageViewCount: number
  landingPath: string
  exitPath: string
  countryCode?: string
  countryName?: string
  regionName?: string
  city?: string
  deviceType: AnalyticsDeviceType
  browserFamily?: string
  osFamily?: string
  isAuthenticated: boolean
  userRole?: string
  isInternal: boolean
  isBot: boolean
  referrerHost?: string
}

export interface IAnalyticsGeoCache {
  _id: string
  ipHash: string
  status: AnalyticsGeoStatus
  geo?: IAnalyticsGeoData
  errorCode?: string
  fetchedAt: Date
  expiresAt: Date
  hitCount: number
}

export interface IAnalyticsGeoData {
  countryCode?: string
  countryName?: string
  continentCode?: string
  continentName?: string
  regionCode?: string
  regionName?: string
  city?: string
  latitude?: number
  longitude?: number
  timezone?: string
  isp?: string
  asn?: number
  connectionType?: string
}

export interface AnalyticsFilterQuery {
  from: Date
  to: Date
  previousFrom: Date
  previousTo: Date
  countryCode?: string
  regionName?: string
  city?: string
  deviceType?: string
  browserFamily?: string
  osFamily?: string
  path?: string
  includeInternal: boolean
  includeBots: boolean
  timezone: string
}

export interface AnalyticsKpi {
  value: number
  previous: number | null
  deltaPercent: number | null
}

export interface AnalyticsProviderStatus {
  enabled: boolean
  geolocationConfigured: boolean
  warning: string | null
  cacheTtlHours: number
  retentionDays: number
  sessionWindowMinutes: number
  usage: {
    attempts: number
    successes: number
    failures: number
    cacheHits: number
    quotaErrors: number
    lastSuccessAt: Date | null
    lastErrorCode: string | null
  }
}

export interface AnalyticsTimeseriesPoint {
  bucket: string
  pageViews: number
  sessions: number
  visitors: number
}