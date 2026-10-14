import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseFilters, resolvePresetRange, zonedToUtc } from '@/lib/analytics/reports'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function source(relative: string) {
  return readFileSync(join(process.cwd(), relative), 'utf8')
}

function params(entries: Record<string, string>) {
  return new URLSearchParams(entries)
}

describe('aggregation pipelines', () => {
  const reports = source('lib/analytics/reports.ts')

  it('buckets sessions on startedAt, not on an event-only field', () => {
    assert.match(reports, /bucket\('\$occurredAt'\)[\s\S]{0,400}AnalyticsSession[\s\S]{0,200}bucket\('\$startedAt'\)/)
  })

  it('never shares one pipeline stage object across concurrent aggregations', () => {
    const sharedLiterals = reports.match(/const \w*[bB]ucket = \{ \$dateToString/g)
    assert.equal(sharedLiterals, null)
    assert.match(reports, /const bucket = \(\) =>/)
  })

  it('never uses object shorthand for a Mongo $limit stage', () => {
    assert.equal(/\{\s*\$limit\s*\}/.test(reports), false)
    assert.match(reports, /\$limit: limit/)
  })

  it('ignores sessions with a non-positive elapsed time in the duration average', () => {
    assert.match(reports, /\$expr: \{ \$gt: \[\{ \$subtract: \['\$lastSeenAt', '\$startedAt'\] \}, 0\] \}/)
  })

  it('defines engagement from page view count, not from wall-clock drift', () => {
    assert.match(reports, /\$gte: \['\$pageViewCount', 2\]/)
  })
})

describe('index bootstrap', () => {
  const indexes = source('lib/analytics/indexes.ts')
  const purge = source('scripts/purge-analytics.ts')

  it('never hard-codes a collection name', () => {
    for (const file of [indexes, purge]) {
      assert.equal(/collection\('analytics_[a-z]+'\)/.test(file), false)
      assert.equal(/db\.collection\('analytic/.test(file), false)
    }
  })

  it('resolves collection names from the compiled models', () => {
    assert.match(indexes, /model\.collection\.collectionName/)
    assert.match(indexes, /AnalyticsEvent\.collection/)
    assert.match(purge, /AnalyticsEvent\.collection/)
  })

  it('is additive and never drops schema indexes on each run', () => {
    assert.match(indexes, /model\.createIndexes\(\)/)
    assert.equal(/syncIndexes\(\)/.test(indexes), false)
  })

  it('drives the retention TTL from configuration', () => {
    assert.match(indexes, /config\.retentionDays \* 86_400/)
    assert.match(indexes, /expireAfterSeconds: ttlSeconds/)
  })
})

describe('geolocation cache', () => {
  const ipstack = source('lib/analytics/ipstack.ts')

  it('writes every cache field in a single $set', () => {
    assert.match(ipstack, /\$set: fields/)
    assert.equal(/\.\.\.\(geo/.test(ipstack), false)
  })

  it('treats a cached row with no expiry as a miss', () => {
    assert.match(ipstack, /if \(!cached\?\.expiresAt\) return null/)
  })

  it('reports a cached negative as a failure, never as stale success', () => {
    assert.match(ipstack, /cached\.status === 'skipped' \? 'skipped' : 'failed'/)
  })

  it('enriches only public addresses', () => {
    assert.match(ipstack, /isEligibleForGeolocation/)
  })

  it('bounds the provider call with a timeout', () => {
    assert.match(ipstack, /AbortController/)
    assert.match(ipstack, /controller\.abort\(\)/)
  })
})

describe('ingestion persistence', () => {
  const ingest = source('lib/analytics/ingest.ts')

  it('never writes a client-supplied timestamp', () => {
    assert.match(ingest, /occurredAt: now/)
  })

  it('stores a keyed IP hash rather than an address', () => {
    assert.match(ingest, /hashIp\(normalized, config\.hashSecret\)/)
    assert.match(ingest, /ipHash: ipHash \|\| undefined/)
  })
})

describe('zonedToUtc', () => {
  it('maps reporting-day boundaries into UTC for UTC reporting', () => {
    assert.equal(zonedToUtc(2026, 3, 14, 0, 0, 0, 'UTC').toISOString(), '2026-03-14T00:00:00.000Z')
    assert.equal(zonedToUtc(2026, 3, 14, 23, 59, 59, 'UTC').toISOString(), '2026-03-14T23:59:59.000Z')
  })

  it('accounts for a non-UTC reporting timezone', () => {
    assert.equal(zonedToUtc(2026, 3, 14, 0, 0, 0, 'Asia/Tokyo').toISOString(), '2026-03-13T15:00:00.000Z')
    assert.equal(zonedToUtc(2026, 3, 14, 23, 59, 59, 'Asia/Tokyo').toISOString(), '2026-03-14T14:59:59.000Z')
  })

  it('falls back to UTC for an unknown timezone instead of throwing', () => {
    assert.equal(zonedToUtc(2026, 3, 14, 0, 0, 0, 'Not/AZone').toISOString(), '2026-03-14T00:00:00.000Z')
  })
})

describe('resolvePresetRange', () => {
  it('returns contiguous, ordered boundaries for every preset', () => {
    for (const preset of ['today', 'yesterday', '7d', '30d', '90d']) {
      const range = resolvePresetRange(preset, 'UTC')
      assert.ok(range.to.getTime() > range.from.getTime(), preset)
      assert.equal(range.invalid, false, preset)
    }
  })

  it('produces the expected inclusive-day lengths', () => {
    const days = (preset: string) => {
      const { from, to } = resolvePresetRange(preset, 'UTC')
      return Math.round((to.getTime() - from.getTime()) / 86_400_000)
    }
    assert.equal(days('today'), 1)
    assert.equal(days('yesterday'), 1)
    assert.equal(days('7d'), 7)
    assert.equal(days('30d'), 30)
    assert.equal(days('90d'), 90)
  })

  it('marks a reversed custom range invalid instead of throwing', () => {
    const range = resolvePresetRange('custom', 'UTC', '2026-03-20', '2026-03-01')
    assert.equal(range.invalid, true)
  })

  it('falls back to a default window when custom bounds are unparseable', () => {
    const range = resolvePresetRange('custom', 'UTC', 'not-a-date', 'also-bad')
    assert.equal(range.invalid, false)
    assert.ok(range.to.getTime() > range.from.getTime())
  })
})

describe('parseFilters', () => {
  it('defaults to the previous 30 days', () => {
    const filter = parseFilters(params({}))
    assert.equal(filter.preset, '30d')
    const days = Math.round((filter.to.getTime() - filter.from.getTime()) / 86_400_000)
    assert.equal(days, 30)
    assert.equal(filter.timezone, 'UTC')
    assert.equal(filter.includeInternal, false)
    assert.equal(filter.includeBots, false)
  })

  it('mirrors the window backwards for the comparison period', () => {
    const filter = parseFilters(params({ range: '7d' }))
    const periodMs = filter.to.getTime() - filter.from.getTime()
    assert.equal(filter.previousTo.getTime(), filter.from.getTime())
    assert.equal(filter.previousFrom.getTime(), filter.from.getTime() - periodMs)
  })

  it('clamps a range longer than the configured maximum', () => {
    const filter = parseFilters(params({ range: 'custom', from: '2000-01-01', to: '2026-01-01' }))
    const days = Math.round((filter.to.getTime() - filter.from.getTime()) / 86_400_000)
    assert.ok(days <= 90, `expected at most 90 days, got ${days}`)
  })

  it('recovers from an inverted custom range', () => {
    const filter = parseFilters(params({ range: 'custom', from: '2026-03-20', to: '2026-03-01' }))
    assert.equal(filter.preset, 'invalid')
    assert.ok(filter.to.getTime() > filter.from.getTime())

    const days = Math.round((filter.to.getTime() - filter.from.getTime()) / 86_400_000)
    const previousDays = Math.round((filter.previousTo.getTime() - filter.previousFrom.getTime()) / 86_400_000)
    assert.equal(previousDays, days)
    assert.ok(filter.previousFrom.getTime() < filter.from.getTime())
  })

  it('keeps the comparison window the same length as the reporting window', () => {
    const QUERIES: Record<string, string>[] = [
      { range: '7d' },
      { range: 'today' },
      { range: 'custom', from: '2026-03-01', to: '2026-03-20' },
    ]
    for (const query of QUERIES) {
      const filter = parseFilters(params(query))
      const span = filter.to.getTime() - filter.from.getTime()
      const previousSpan = filter.previousTo.getTime() - filter.previousFrom.getTime()
      assert.equal(previousSpan, span, JSON.stringify(query))
      assert.equal(filter.previousTo.getTime(), filter.from.getTime(), JSON.stringify(query))
    }
  })

  it('switches to hourly buckets for short ranges only', () => {
    assert.equal(parseFilters(params({ range: 'today' })).granularity, 'hour')
    assert.equal(parseFilters(params({ range: '7d' })).granularity, 'day')
  })

  it('normalizes and uppercases filter values', () => {
    const filter = parseFilters(params({ country: 'ma', path: '/courses/6512ab90f1c2a3b4c5d6e7f8' }))
    assert.equal(filter.countryCode, 'MA')
    assert.equal(filter.path, '/courses/{courseId}')
  })

  it('drops a path that cannot be normalized rather than trusting it', () => {
    assert.equal(parseFilters(params({ path: '../../etc/passwd' })).path, undefined)
  })

  it('only enables internal and bot traffic on an explicit true', () => {
    assert.equal(parseFilters(params({ includeInternal: '1' })).includeInternal, false)
    assert.equal(parseFilters(params({ includeInternal: 'true' })).includeInternal, true)
    assert.equal(parseFilters(params({ includeBots: 'yes' })).includeBots, false)
  })

  it('accepts a client reporting timezone', () => {
    assert.equal(parseFilters(params({ tz: 'Asia/Tokyo' })).timezone, 'Asia/Tokyo')
  })

  it('ignores an unsupported timezone instead of throwing', () => {
    const filter = parseFilters(params({ tz: 'Not/AZone' }))
    assert.equal(filter.timezone, 'UTC')
    assert.ok(filter.to.getTime() > filter.from.getTime())
  })
})