import { createHmac, timingSafeEqual } from 'node:crypto'

const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/

export type IpScope = 'public' | 'loopback' | 'private' | 'link-local' | 'reserved' | 'invalid'

export interface ExtractedIp {
  raw: string | null
  normalized: string | null
  scope: IpScope
}

function parseIpv4(value: string): number[] | null {
  const match = IPV4_PATTERN.exec(value)
  if (!match) return null
  const parts = match.slice(1).map((part) => Number(part))
  if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null
  return parts
}

function classifyIpv4(parts: number[]): IpScope {
  const [a, b] = parts
  if (a === 0) return 'reserved'
  if (a === 10) return 'private'
  if (a === 127) return 'loopback'
  if (a === 169 && b === 254) return 'link-local'
  if (a === 172 && b >= 16 && b <= 31) return 'private'
  if (a === 192 && b === 168) return 'private'
  if (a === 192 && b === 0) return 'reserved'
  if (a === 192 && b === 88) return 'reserved'
  if (a === 198 && (b === 18 || b === 19)) return 'reserved'
  if (a === 198 && b === 51) return 'reserved'
  if (a === 203 && b === 0) return 'reserved'
  if (a >= 224 && a <= 239) return 'reserved'
  if (a >= 240) return 'reserved'
  if (a === 100 && b >= 64 && b <= 127) return 'reserved'
  return 'public'
}

function expandIpv6(value: string): number[] | null {
  const zoneIndex = value.indexOf('%')
  if (zoneIndex !== -1) value = value.slice(0, zoneIndex)

  const doubleColon = value.indexOf('::')
  let head: string[]
  let tail: string[]

  if (doubleColon === -1) {
    head = value.split(':')
    tail = []
    if (head.length !== 8) return null
  } else {
    if (value.indexOf('::', doubleColon + 1) !== -1) return null
    const headRaw = value.slice(0, doubleColon)
    const tailRaw = value.slice(doubleColon + 2)
    head = headRaw ? headRaw.split(':') : []
    tail = tailRaw ? tailRaw.split(':') : []
    if (head.length + tail.length > 7) return null
  }

  const groups: (number | null)[] = []
  const pushGroups = (parts: string[], allowIpv4: boolean): number[] | null => {
    const out: number[] = []
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i]
      if (part.includes('.')) {
        if (!allowIpv4 || i !== parts.length - 1) return null
        const v4 = parseIpv4(part)
        if (!v4) return null
        out.push((v4[0] << 8) | v4[1], (v4[2] << 8) | v4[3])
        continue
      }
      if (!/^[0-9a-fA-F]{1,4}$/.test(part)) return null
      out.push(parseInt(part, 16))
    }
    return out
  }

  const headGroups = pushGroups(head, doubleColon !== -1 && head.length > 0 && head[head.length - 1].includes('.'))
  const tailGroups = pushGroups(tail, doubleColon !== -1 && tail.length > 0 && tail[tail.length - 1].includes('.'))
  if (headGroups === null || tailGroups === null) return null

  for (const g of headGroups) groups.push(g)
  const fill = 8 - (headGroups.length + tailGroups.length)
  if (doubleColon === -1) {
    if (fill !== 0) return null
  } else {
    for (let i = 0; i < fill; i += 1) groups.push(0)
  }
  for (const g of tailGroups) groups.push(g)

  if (groups.length !== 8) return null
  return groups.map((g) => g ?? 0)
}

function classifyIpv6(groups: number[]): IpScope {
  if (groups.every((g) => g === 0)) return 'reserved'
  const isZeroPrefix = groups.slice(0, 5).every((g) => g === 0)
  if (isZeroPrefix && groups[5] === 0) {
    if (groups[6] === 0 && groups[7] === 1) return 'loopback'
    return 'reserved'
  }
  if (isZeroPrefix && groups[5] === 0xffff) {
    const embedded = [(groups[6] >> 8) & 0xff, groups[6] & 0xff, (groups[7] >> 8) & 0xff, groups[7] & 0xff]
    return classifyIpv4(embedded)
  }
  if (groups[0] >= 0xfe80 && groups[0] <= 0xfebf) return 'link-local'
  if (groups[0] >= 0xfc00 && groups[0] <= 0xfdff) return 'private'
  if ((groups[0] & 0xffc0) === 0xfec0) return 'reserved'
  if (groups[0] === 0x2001 && groups[1] === 0x0db8) return 'reserved'
  if (groups[0] === 0x2001 && groups[1] === 0x0000) return 'reserved'
  if (groups[0] === 0x0100 && groups[1] === 0x0000 && groups[2] === 0x0000) return 'reserved'
  return 'public'
}

function canonicalIpv6(groups: number[]): string {
  const parts = groups.map((g) => g.toString(16))
  let bestStart = -1
  let bestLength = 0
  let currentStart = -1
  let currentLength = 0
  for (let i = 0; i < parts.length; i += 1) {
    if (parts[i] === '0') {
      if (currentStart === -1) currentStart = i
      currentLength += 1
      if (currentLength > bestLength) {
        bestLength = currentLength
        bestStart = currentStart
      }
    } else {
      currentStart = -1
      currentLength = 0
    }
  }
  if (bestLength < 2) return parts.join(':')
  const head = parts.slice(0, bestStart).join(':')
  const tail = parts.slice(bestStart + bestLength).join(':')
  return `${head}::${tail}`
}

export function normalizeIp(raw: string | null | undefined): { normalized: string | null; scope: IpScope } {
  if (!raw) return { normalized: null, scope: 'invalid' }
  let value = raw.trim().toLowerCase()
  if (!value) return { normalized: null, scope: 'invalid' }

  if (value.startsWith('[') && value.endsWith(']')) value = value.slice(1, -1)

  const v4 = parseIpv4(value)
  if (v4) return { normalized: v4.join('.'), scope: classifyIpv4(v4) }

  if (!value.includes(':')) return { normalized: null, scope: 'invalid' }

  const groups = expandIpv6(value)
  if (!groups) return { normalized: null, scope: 'invalid' }
  return { normalized: canonicalIpv6(groups), scope: classifyIpv6(groups) }
}

export function isEligibleForGeolocation(scope: IpScope) {
  return scope === 'public'
}

function resolveCandidate(value: string | null | undefined): ExtractedIp {
  if (!value) return { raw: null, normalized: null, scope: 'invalid' }
  const { normalized, scope } = normalizeIp(value)
  if (!normalized) return { raw: null, normalized: null, scope: 'invalid' }
  return { raw: null, normalized, scope }
}

/**
 * Resolves the visitor address from the trusted server request context.
 *
 * Exactly one value is honoured, never a scan across the chain:
 *   1. `X-Real-IP` — our nginx overwrites this with `$remote_addr` on every request.
 *   2. The **rightmost** entry of `X-Forwarded-For` — nginx appends the peer it saw, so
 *      the rightmost entry is trustworthy while any earlier entry is client-supplied and
 *      is therefore never read.
 *
 * Both are only consulted when ANALYTICS_TRUST_PROXY is on. When the app is reached
 * directly, nothing is parsed and geolocation is skipped entirely.
 */
export function extractClientIp(headers: Headers, trustProxy: boolean): ExtractedIp {
  if (!trustProxy) {
    return { raw: null, normalized: null, scope: 'invalid' }
  }

  const realIp = resolveCandidate(headers.get('x-real-ip'))
  if (realIp.normalized) return realIp

  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    const chain = forwardedFor.split(',').map((part) => part.trim()).filter(Boolean)
    const rightmost = resolveCandidate(chain[chain.length - 1])
    if (rightmost.normalized) return rightmost
  }

  return { raw: null, normalized: null, scope: 'invalid' }
}

export function hashIdentifier(identifier: string, secret: string): string {
  if (!secret) return ''
  return createHmac('sha256', secret).update(identifier).digest('hex').slice(0, 32)
}

export function hashIp(normalizedIp: string, secret: string): string {
  if (!normalizedIp || !secret) return ''
  return createHmac('sha256', secret).update(`ip:${normalizedIp}`).digest('hex').slice(0, 32)
}

export function hashesMatch(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}