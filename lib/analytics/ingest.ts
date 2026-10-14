import { z } from 'zod'
import { ANALYTICS_EVENT_TYPES, ANALYTICS_METADATA_KEYS } from '@/types/analytics'
import { getAnalyticsConfig } from '@/lib/analytics/config'
import { consumeRateLimit } from '@/lib/analytics/rate-limit'
import {
  classifyReferrer,
  isExcludedPath,
  normalizePath,
  sanitizeReferrerHost,
  sanitizeTitle,
} from '@/lib/analytics/paths'
import { detectBot, parseBrowserFamily, parseDeviceType, parseOsFamily } from '@/lib/analytics/device'
import { extractClientIp, hashIdentifier, hashIp } from '@/lib/analytics/ip'
import { lookupGeolocationForIp } from '@/lib/analytics/ipstack'
import { connectToDatabase } from '@/lib/db'
import AnalyticsEvent from '@/models/AnalyticsEvent'
import AnalyticsSession from '@/models/AnalyticsSession'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const metadataShape = ANALYTICS_METADATA_KEYS.reduce<Record<string, z.ZodType<string | number>>>((acc, key) => {
  acc[key] = z.union([z.string().max(120), z.number().int().max(100000)])
  return acc
}, {})

export const collectEventSchema = z
  .object({
    eventId: z.string().regex(UUID_PATTERN, 'eventId must be a UUID'),
    eventType: z.enum(ANALYTICS_EVENT_TYPES),
    path: z.string().min(1).max(2048),
    pageTitle: z.string().max(400).optional(),
    referrer: z.string().max(500).optional(),
    sessionId: z.string().regex(UUID_PATTERN, 'sessionId must be a UUID'),
    visitorId: z.string().regex(UUID_PATTERN, 'visitorId must be a UUID'),
    metadata: z.object(metadataShape).partial().strict().optional(),
  })
  .strict()

export const collectBatchSchema = z.object({
  events: z.array(z.unknown()).min(1).max(getAnalyticsConfig().maxEventsPerRequest),
})

export interface CollectContext {
  userId?: string
  userRole?: string
}

export interface CollectOutcome {
  status: 'accepted' | 'rejected' | 'disabled'
  accepted: number
  duplicates?: number
  excluded?: number
  error?: string
  retryAfter?: number
}

const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST?.trim().toLowerCase() || 'e-teaching.tech'

export function sanitizeMetadata(raw: unknown): Record<string, string | number> | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const source = raw as Record<string, unknown>
  const out: Record<string, string | number> = {}
  for (const key of ANALYTICS_METADATA_KEYS) {
    const value = source[key]
    if (typeof value === 'string') out[key] = value.replace(/\s+/g, ' ').trim().slice(0, 120)
    else if (typeof value === 'number' && Number.isFinite(value)) out[key] = Math.trunc(value)
  }
  return Object.keys(out).length > 0 ? out : undefined
}

/**
 * Promotes a plain page_view onto the controlled vocabulary for the two browsing
 * surfaces that carry genuine engagement signal. Nothing else is auto-instrumented.
 */
export function classifyEventType(eventType: string, path: string) {
  if (eventType !== 'page_view') return eventType
  if (/^\/programs\/[^/]+/.test(path)) return 'course_view'
  if (/^\/courses\/[^/]+/.test(path)) return 'lesson_view'
  return 'page_view'
}

/**
 * Server-authoritative ingestion. The client never supplies a timestamp, an IP address,
 * or a geolocation value; all three are derived from the trusted request context.
 */
export async function collectEvents(
  req: Request,
  rawBody: unknown,
  context: CollectContext = {},
): Promise<CollectOutcome> {
  const config = getAnalyticsConfig()

  if (!config.enabled) return { status: 'disabled', accepted: 0 }

  const batch = collectBatchSchema.safeParse(rawBody)
  if (!batch.success) return { status: 'rejected', error: 'Invalid payload', accepted: 0 }

  const parsed = batch.data.events
    .map((raw) => collectEventSchema.safeParse(raw))
    .filter((result): result is { success: true; data: z.infer<typeof collectEventSchema> } => result.success)
    .map((result) => result.data)

  if (parsed.length === 0) return { status: 'rejected', error: 'No valid events', accepted: 0 }

  const { normalized, scope } = extractClientIp(req.headers, config.trustedProxy)
  const ipHash = normalized ? hashIp(normalized, config.hashSecret) : ''

  const rateKey = ipHash || 'anonymous'
  const limit = consumeRateLimit(rateKey, config.rateLimitPerMinute)
  if (!limit.allowed) {
    return {
      status: 'rejected',
      error: 'Rate limit exceeded',
      accepted: 0,
      retryAfter: limit.retryAfterSeconds,
    }
  }

  await connectToDatabase()

  const now = new Date()
  const userAgent = req.headers.get('user-agent')
  const siteHost = req.headers.get('host') || SITE_HOST
  const isBot = detectBot(userAgent)

  let excluded = 0
  const eligible = parsed.filter((event) => {
    const path = normalizePath(event.path)
    if (!path || isExcludedPath(path)) {
      excluded += 1
      return false
    }
    return true
  })

  if (eligible.length === 0) return { status: 'accepted', accepted: 0, excluded }

  const existingIds = await AnalyticsEvent.find({ eventId: { $in: eligible.map((e) => e.eventId) } })
    .select('eventId')
    .lean()
  const existingSet = new Set(existingIds.map((doc) => doc.eventId))
  const fresh = eligible.filter((event) => !existingSet.has(event.eventId))
  const duplicates = eligible.length - fresh.length

  if (fresh.length === 0) return { status: 'accepted', accepted: 0, duplicates, excluded }

  const visitorIdHash = hashIdentifier(fresh[0].visitorId, config.hashSecret)
  const sessionWindowMs = config.sessionWindowMinutes * 60_000
  const activeSessions = await AnalyticsSession.find({
    visitorIdHash,
    lastSeenAt: { $gte: new Date(now.getTime() - sessionWindowMs) },
  })
    .sort({ lastSeenAt: -1 })
    .limit(1)
    .lean()

  let geo: Awaited<ReturnType<typeof lookupGeolocationForIp>> = { status: 'skipped', code: 'no_identifier', fromCache: false }
  if (ipHash && normalized && scope === 'public') {
    geo = await lookupGeolocationForIp(ipHash, normalized, scope)
  }

  const device = {
    deviceType: parseDeviceType(userAgent),
    browserFamily: parseBrowserFamily(userAgent),
    osFamily: parseOsFamily(userAgent),
  }
  const isInternal = config.excludeAdmins && context.userRole === 'admin'

  const geoFields =
    geo.status === 'ok'
      ? {
          countryCode: geo.geo.countryCode,
          countryName: geo.geo.countryName,
          continentCode: geo.geo.continentCode,
          continentName: geo.geo.continentName,
          regionName: geo.geo.regionName,
          city: geo.geo.city,
          latitude: geo.geo.latitude,
          longitude: geo.geo.longitude,
          timezone: geo.geo.timezone,
          isp: geo.geo.isp,
          asn: geo.geo.asn,
          connectionType: geo.geo.connectionType,
        }
      : {}

  const documents = fresh.map((event) => {
    const path = normalizePath(event.path) ?? '/'
    const referrerHost = sanitizeReferrerHost(event.referrer)
    return {
      eventId: event.eventId,
      eventType: classifyEventType(event.eventType, path),
      occurredAt: now,
      sessionId: '',
      visitorIdHash,
      ipHash: ipHash || undefined,
      path,
      pageTitle: sanitizeTitle(event.pageTitle),
      referrerHost,
      referrerType: classifyReferrer(referrerHost, siteHost),
      ...geoFields,
      geoStatus: geo.status,
      deviceType: device.deviceType,
      browserFamily: device.browserFamily,
      osFamily: device.osFamily,
      isAuthenticated: Boolean(context.userId),
      userRole: context.userRole,
      isInternal,
      isBot,
      metadata: sanitizeMetadata(event.metadata),
    }
  })

  const active = activeSessions[0]
  let sessionId = active?.sessionId ?? ''
  let sessionCreated = false

  if (!active) {
    const candidateId = fresh[0].sessionId
    const taken = await AnalyticsSession.exists({ sessionId: candidateId })
    if (taken) {
      sessionId = crypto.randomUUID()
    } else {
      sessionId = candidateId
      sessionCreated = true
    }
  }

  for (const doc of documents) doc.sessionId = sessionId

  const firstDocument = documents[0]
  const pageViews = documents.filter((doc) => doc.eventType !== 'session_start').length

  const insertResult = await AnalyticsEvent.insertMany(documents, { ordered: false })
    .then((inserted) => ({ inserted: inserted.length }))
    .catch((error: unknown) => {
      const writeErrors =
        error && typeof error === 'object' && 'writeErrors' in error
          ? ((error as { writeErrors?: unknown[] }).writeErrors?.length ?? 0)
          : 0
      return { inserted: Math.max(0, documents.length - writeErrors) }
    })

  if (sessionCreated) {
    await AnalyticsSession.create({
      sessionId,
      visitorIdHash,
      startedAt: now,
      lastSeenAt: now,
      pageViewCount: pageViews,
      landingPath: firstDocument.path,
      exitPath: firstDocument.path,
      countryCode: geoFields.countryCode,
      countryName: geoFields.countryName,
      regionName: geoFields.regionName,
      city: geoFields.city,
      deviceType: device.deviceType,
      browserFamily: device.browserFamily,
      osFamily: device.osFamily,
      isAuthenticated: Boolean(context.userId),
      userRole: context.userRole,
      isInternal,
      isBot,
      referrerHost: firstDocument.referrerHost,
    })
  } else if (active) {
    await AnalyticsSession.updateOne(
      { sessionId },
      {
        $set: {
          lastSeenAt: now,
          pageViewCount: (active.pageViewCount ?? 0) + pageViews,
          exitPath: firstDocument.path,
          isAuthenticated: Boolean(context.userId) || active.isAuthenticated,
          userRole: context.userRole ?? active.userRole,
        },
      },
    )
  }

  return { status: 'accepted', accepted: insertResult.inserted, duplicates, excluded }
}