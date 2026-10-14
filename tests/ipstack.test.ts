import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { describeIpstackError, getGeoUsage, normalizeIpstackResponse, resetGeoUsage } from '@/lib/analytics/ipstack'
import { getAnalyticsConfig, getGeolocationWarning } from '@/lib/analytics/config'

const FULL_RESPONSE = {
  ip: '8.8.8.8',
  type: 'ipv4',
  continent_code: 'NA',
  continent_name: 'North America',
  country_code: 'US',
  country_name: 'United States',
  region_code: 'CA',
  region_name: 'California',
  city: 'Mountain View',
  zip: '94035',
  latitude: 37.386,
  longitude: -122.0838,
  time_zone: { id: 'America/Los_Angeles', current_time: '2026-01-01T00:00:00+00:00' },
  currency: { code: 'USD' },
  connection: { asn: 15169, org: 'GOOGLE', isp: 'Google LLC', domain: 'google.com' },
}

function withGlobals<T>(overrides: Record<string, string | undefined>, run: () => T): T {
  const saved: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(overrides)) {
    saved[key] = process.env[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  try {
    return run()
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

describe('normalizeIpstackResponse', () => {
  it('normalizes a paid-plan response', () => {
    const geo = normalizeIpstackResponse(FULL_RESPONSE as unknown as Record<string, unknown>)
    assert.deepEqual(geo, {
      countryCode: 'US',
      countryName: 'United States',
      continentCode: 'NA',
      continentName: 'North America',
      regionCode: 'CA',
      regionName: 'California',
      city: 'Mountain View',
      latitude: 37.386,
      longitude: -122.0838,
      timezone: 'America/Los_Angeles',
      isp: 'Google LLC',
      asn: 15169,
      connectionType: undefined,
    })
  })

  it('tolerates a free-plan response with missing optional fields', () => {
    const geo = normalizeIpstackResponse({
      ip: '1.1.1.1',
      country_code: 'FR',
      country_name: 'France',
      city: null,
      region_name: null,
      latitude: null,
      longitude: null,
      time_zone: null,
    } as unknown as Record<string, unknown>)

    assert.equal(geo?.countryCode, 'FR')
    assert.equal(geo?.city, undefined)
    assert.equal(geo?.latitude, undefined)
    assert.equal(geo?.isp, undefined)
    assert.equal(geo?.asn, undefined)
  })

  it('reads connection.type when the plan includes it', () => {
    const geo = normalizeIpstackResponse({
      country_code: 'DE',
      country_name: 'Germany',
      connection: { isp: 'Telekom', asn: 3320, type: 'business' },
    } as unknown as Record<string, unknown>)
    assert.equal(geo?.connectionType, 'business')
  })

  it('never invents a location for an unsuccessful payload', () => {
    assert.equal(
      normalizeIpstackResponse({ success: false, error: { code: 101 } } as unknown as Record<string, unknown>),
      null,
    )
    assert.equal(normalizeIpstackResponse({} as Record<string, unknown>), null)
  })

  it('bounds field lengths', () => {
    const geo = normalizeIpstackResponse({
      country_code: 'US',
      country_name: 'x'.repeat(400),
    } as unknown as Record<string, unknown>)
    assert.equal(geo?.countryName?.length, 120)
  })
})

describe('describeIpstackError', () => {
  it('maps documented API error codes to safe internal statuses', () => {
    assert.equal(describeIpstackError(200, { error: { code: 101, type: 'missing_access_key' } }), 'missing_access_key')
    assert.equal(describeIpstackError(200, { error: { code: 102, type: 'invalid_access_key' } }), 'invalid_access_key')
    assert.equal(describeIpstackError(200, { error: { code: 104, type: 'inactive_user' } }), 'inactive_account')
    assert.equal(describeIpstackError(200, { error: { code: 301, type: 'usage_limit_reached' } }), 'quota_exceeded')
    assert.equal(describeIpstackError(200, { error: { code: 302, type: 'feature_not_enabled' } }), 'feature_disabled')
  })

  it('maps transport level failures', () => {
    assert.equal(describeIpstackError(429, null), 'rate_limited')
    assert.equal(describeIpstackError(500, null), 'provider_error')
  })

  it('never echoes provider messages back to a client', () => {
    const result = describeIpstackError(200, { error: { code: 102, type: 'invalid_access_key', info: 'key abc123' } })
    assert.equal(result.includes('abc123'), false)
  })
})

describe('configuration fallbacks', () => {
  afterEach(() => resetGeoUsage())

  it('disables enrichment gracefully when no key is configured', () => {
    withGlobals({ IPSTACK_ACCESS_KEY: undefined, ANALYTICS_ENABLED: 'true' }, () => {
      const config = getAnalyticsConfig()
      assert.equal(config.accessKey, null)
      const warning = getGeolocationWarning(config)
      assert.ok(warning)
      assert.match(warning, /IPSTACK_ACCESS_KEY/)
    })
  })

  it('reads sane defaults and clamps hostile values', () => {
    withGlobals(
      {
        IPSTACK_TIMEOUT_MS: '5',
        IPSTACK_CACHE_TTL_HOURS: '999999',
        ANALYTICS_RETENTION_DAYS: 'not-a-number',
        ANALYTICS_RATE_LIMIT_PER_MINUTE: '1e9',
      },
      () => {
        const config = getAnalyticsConfig()
        assert.equal(config.timeoutMs, 250)
        assert.equal(config.cacheTtlHours, 2160)
        assert.equal(config.retentionDays, 90)
        assert.equal(config.rateLimitPerMinute, 5000)
      },
    )
  })

  it('never exposes the secret through the config object', () => {
    withGlobals({ IPSTACK_ACCESS_KEY: 'super-secret-key' }, () => {
      const config = getAnalyticsConfig()
      assert.equal(config.accessKey, 'super-secret-key')
      assert.equal(JSON.stringify({ ...config, accessKey: undefined }).includes('super-secret-key'), false)
    })
  })

  it('rejects a reporting timezone the runtime cannot resolve', () => {
    withGlobals({ ANALYTICS_REPORTING_TZ: 'Not/AZone' }, () => {
      assert.equal(getAnalyticsConfig().reportingTimezone, 'UTC')
    })
  })
})

describe('usage counters', () => {
  afterEach(() => resetGeoUsage())

  it('starts at zero and exposes no fabricated quota figure', () => {
    const usage = getGeoUsage()
    assert.equal(usage.attempts, 0)
    assert.equal(usage.successes, 0)
    assert.equal(usage.lastSuccessAt, null)
    assert.equal('remainingQuota' in usage, false)
  })
})