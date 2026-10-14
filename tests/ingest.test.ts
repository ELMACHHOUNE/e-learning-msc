import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { consumeRateLimit, resetRateLimits } from '@/lib/analytics/rate-limit'
import { detectBot, parseBrowserFamily, parseDeviceType, parseOsFamily } from '@/lib/analytics/device'
import { classifyEventType, collectBatchSchema, collectEventSchema, sanitizeMetadata } from '@/lib/analytics/ingest'

const UUID_A = '11111111-1111-4111-8111-111111111111'
const UUID_B = '22222222-2222-4222-8222-222222222222'

describe('consumeRateLimit', () => {
  beforeEach(() => resetRateLimits())

  it('allows up to the limit then blocks', () => {
    for (let i = 0; i < 5; i += 1) {
      assert.equal(consumeRateLimit('k1', 5).allowed, true, `request ${i}`)
    }
    const blocked = consumeRateLimit('k1', 5)
    assert.equal(blocked.allowed, false)
    assert.ok(blocked.retryAfterSeconds > 0)
  })

  it('isolates buckets per key', () => {
    for (let i = 0; i < 5; i += 1) consumeRateLimit('a', 5)
    assert.equal(consumeRateLimit('a', 5).allowed, false)
    assert.equal(consumeRateLimit('b', 5).allowed, true)
  })

  it('reports remaining capacity', () => {
    assert.equal(consumeRateLimit('c', 3).remaining, 2)
    assert.equal(consumeRateLimit('c', 3).remaining, 1)
    assert.equal(consumeRateLimit('c', 3).remaining, 0)
  })
})

describe('user agent parsing', () => {
  it('classifies device categories', () => {
    assert.equal(parseDeviceType('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'), 'desktop')
    assert.equal(parseDeviceType('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile Safari'), 'mobile')
    assert.equal(parseDeviceType('Mozilla/5.0 (iPad; CPU OS 17_0)'), 'tablet')
    assert.equal(parseDeviceType('Googlebot/2.1'), 'bot')
    assert.equal(parseDeviceType(''), 'unknown')
  })

  it('does not treat unusual browsers as bots', () => {
    const exotic = 'Mozilla/5.0 (Windows NT 10.0) Firefox/121.0 Edg/121.0'
    assert.equal(detectBot(exotic), false)
    assert.equal(detectBot(''), true)
  })

  it('detects obvious crawlers and HTTP clients', () => {
    assert.equal(detectBot('Googlebot/2.1 (+http://www.google.com/bot.html)'), true)
    assert.equal(detectBot('curl/8.4.0'), true)
    assert.equal(detectBot('Mozilla/5.0 (compatible; bingbot/2.0)'), true)
  })

  it('identifies browser and OS families with Chromium precedence', () => {
    assert.equal(parseBrowserFamily('Mozilla/5.0 Chrome/120 Safari/537.36'), 'Chrome')
    assert.equal(parseBrowserFamily('Mozilla/5.0 Chrome/120 Safari/537.36 Edg/120'), 'Edge')
    assert.equal(parseBrowserFamily('Mozilla/5.0 Firefox/121.0'), 'Firefox')
    assert.equal(parseOsFamily('Mozilla/5.0 (Windows NT 10.0)'), 'Windows')
    assert.equal(parseOsFamily('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)'), 'iOS')
    assert.equal(parseOsFamily(undefined), undefined)
  })
})

describe('event schema', () => {
  const valid = {
    eventId: UUID_A,
    eventType: 'page_view',
    path: '/programs/intro',
    pageTitle: 'Programs',
    referrer: 'google.com',
    sessionId: UUID_B,
    visitorId: UUID_A,
  }

  it('accepts a well-formed event', () => {
    assert.equal(collectEventSchema.safeParse(valid).success, true)
  })

  it('rejects malformed identifiers', () => {
    assert.equal(collectEventSchema.safeParse({ ...valid, eventId: 'nope' }).success, false)
    assert.equal(collectEventSchema.safeParse({ ...valid, sessionId: '12345' }).success, false)
    assert.equal(collectEventSchema.safeParse({ ...valid, visitorId: '' }).success, false)
  })

  it('rejects unknown event types and missing paths', () => {
    assert.equal(collectEventSchema.safeParse({ ...valid, eventType: 'keylog' }).success, false)
    assert.equal(collectEventSchema.safeParse({ ...valid, path: '' }).success, false)
    assert.equal(collectEventSchema.safeParse({ ...valid, path: undefined }).success, false)
  })

  it('rejects unknown top-level keys so nothing smuggled reaches storage', () => {
    assert.equal(collectEventSchema.safeParse({ ...valid, ip: '8.8.8.8', geo: { countryCode: 'US' } }).success, false)
  })

  it('requires a non-empty batch and enforces the per-request cap', () => {
    assert.equal(collectBatchSchema.safeParse({ events: [] }).success, false)
    const oversized = { events: Array.from({ length: 500 }, () => valid) }
    assert.equal(collectBatchSchema.safeParse(oversized).success, false)
  })
})

describe('classifyEventType', () => {
  it('promotes program and course browsing only', () => {
    assert.equal(classifyEventType('page_view', '/programs/nodejs-mastery'), 'course_view')
    assert.equal(classifyEventType('page_view', '/courses/{courseId}'), 'lesson_view')
    assert.equal(classifyEventType('page_view', '/dashboard'), 'page_view')
  })

  it('never rewrites an explicitly reported event', () => {
    assert.equal(classifyEventType('download_started', '/programs/x'), 'download_started')
  })
})

describe('sanitizeMetadata', () => {
  it('keeps only allowlisted keys and truncates values', () => {
    const result = sanitizeMetadata({ linkLabel: '  Courses  ', resultCount: 12, password: 'x', note: 'y' })
    assert.deepEqual(result, { linkLabel: 'Courses', resultCount: 12 })
  })

  it('drops mongo operators and non-serializable values', () => {
    const result = sanitizeMetadata({ $where: 'this.a === 1', resultCount: { $gt: 0 } as never })
    assert.deepEqual(result, undefined)
  })

  it('returns undefined when nothing survives', () => {
    assert.equal(sanitizeMetadata(undefined), undefined)
    assert.equal(sanitizeMetadata({}), undefined)
  })
})