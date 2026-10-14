import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { extractClientIp, hashIdentifier, hashIp, isEligibleForGeolocation, normalizeIp } from '@/lib/analytics/ip'

function headers(entries: Record<string, string>) {
  return new Headers(entries)
}

describe('normalizeIp', () => {
  it('normalizes public IPv4 addresses', () => {
    assert.deepEqual(normalizeIp('8.8.8.8'), { normalized: '8.8.8.8', scope: 'public' })
  })

  it('rejects loopback, private, link-local and reserved ranges', () => {
    assert.equal(normalizeIp('127.0.0.1').scope, 'loopback')
    assert.equal(normalizeIp('10.1.2.3').scope, 'private')
    assert.equal(normalizeIp('192.168.1.10').scope, 'private')
    assert.equal(normalizeIp('172.16.5.5').scope, 'private')
    assert.equal(normalizeIp('169.254.10.1').scope, 'link-local')
    assert.equal(normalizeIp('0.0.0.0').scope, 'reserved')
    assert.equal(normalizeIp('100.64.0.1').scope, 'reserved')
  })

  it('rejects malformed input', () => {
    assert.equal(normalizeIp('999.1.1.1').scope, 'invalid')
    assert.equal(normalizeIp('not-an-ip').scope, 'invalid')
    assert.equal(normalizeIp('').scope, 'invalid')
    assert.equal(normalizeIp(null).scope, 'invalid')
  })

  it('normalizes IPv6 and classifies embedded IPv4', () => {
    assert.equal(normalizeIp('2606:4700:4700::1111').normalized, '2606:4700:4700::1111')
    assert.equal(normalizeIp('2606:4700:4700::1111').scope, 'public')
    assert.equal(normalizeIp('::1').scope, 'loopback')
    assert.equal(normalizeIp('fe80::1').scope, 'link-local')
    assert.equal(normalizeIp('::ffff:192.168.0.1').scope, 'private')
    assert.equal(normalizeIp('::ffff:8.8.4.4').scope, 'public')
  })

  it('only treats public scopes as eligible for enrichment', () => {
    assert.equal(isEligibleForGeolocation('public'), true)
    assert.equal(isEligibleForGeolocation('private'), false)
    assert.equal(isEligibleForGeolocation('loopback'), false)
    assert.equal(isEligibleForGeolocation('invalid'), false)
  })
})

describe('extractClientIp', () => {
  it('ignores forwarding headers when the proxy is not trusted', () => {
    const result = extractClientIp(headers({ 'x-real-ip': '8.8.8.8' }), false)
    assert.equal(result.normalized, null)
  })

  it('prefers nginx X-Real-IP over the X-Forwarded-For chain', () => {
    const result = extractClientIp(
      headers({ 'x-real-ip': '203.0.113.10', 'x-forwarded-for': '198.51.100.7, 172.18.0.4' }),
      true,
    )
    assert.equal(result.normalized, '203.0.113.10')
  })

  it('falls back to the last entry of X-Forwarded-For', () => {
    const result = extractClientIp(headers({ 'x-forwarded-for': '198.51.100.7, 172.18.0.4' }), true)
    assert.equal(result.normalized, '172.18.0.4')
    assert.equal(result.scope, 'private')
  })

  it('never reads a client-supplied leftmost X-Forwarded-For value', () => {
    const result = extractClientIp(headers({ 'x-forwarded-for': '8.8.8.8' }), true)
    assert.equal(result.normalized, '8.8.8.8')

    const forged = extractClientIp(headers({ 'x-forwarded-for': '8.8.8.8, 127.0.0.1' }), true)
    assert.equal(forged.normalized, '127.0.0.1')
    assert.equal(forged.scope, 'loopback')
    assert.equal(isEligibleForGeolocation(forged.scope), false)
  })

  it('returns invalid when nothing usable is present', () => {
    assert.equal(extractClientIp(headers({}), true).normalized, null)
    assert.equal(extractClientIp(headers({ 'x-real-ip': 'garbage' }), true).normalized, null)
  })
})

describe('pseudonymous hashing', () => {
  it('produces stable, non-reversible identifiers', () => {
    const a = hashIdentifier('visitor-uuid', 'secret')
    const b = hashIdentifier('visitor-uuid', 'secret')
    const c = hashIdentifier('visitor-uuid', 'other-secret')
    assert.equal(a, b)
    assert.notEqual(a, c)
    assert.equal(a.includes('visitor-uuid'), false)
    assert.equal(a.length, 32)
  })

  it('separates the IP hash namespace from the visitor namespace', () => {
    assert.notEqual(hashIp('8.8.8.8', 'secret'), hashIdentifier('8.8.8.8', 'secret'))
  })

  it('returns empty when no secret is configured', () => {
    assert.equal(hashIdentifier('x', ''), '')
    assert.equal(hashIp('8.8.8.8', ''), '')
  })
})