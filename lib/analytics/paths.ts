const SENSITIVE_QUERY_KEYS = new Set([
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'code',
  'password',
  'passwd',
  'secret',
  'key',
  'apikey',
  'api_key',
  'email',
  'e',
  'user',
  'username',
  'login',
  'q',
  'query',
  'search',
  'term',
  'auth',
  'authorization',
  'session',
  'sid',
  'state',
  'otp',
  'otp_code',
  'reset',
])

const IGNORED_PREFIXES = [
  '/api/',
  '/_next/',
  '/uploads/',
  '/images/',
  '/icons/',
  '/fonts/',
  '/certificates/',
  '/admin/analytics',
]

export const MAX_PATH_LENGTH = 300
export const MAX_TITLE_LENGTH = 180

/**
 * Placeholder applied to the segment that FOLLOWS one of these prefixes. Program slugs are
 * intentionally left intact because they are bounded by the published course count.
 */
const DYNAMIC_CHILDREN: Record<string, string> = {
  courses: '{courseId}',
  students: '{studentId}',
  sessions: '{sessionId}',
  labphase: '{labPhaseId}',
  teach: '{section}',
  'one-to-one': '{section}',
  profile: '{section}',
}

export function stripSensitiveQuery(input: string) {
  const hashIndex = input.indexOf('#')
  const withoutFragment = hashIndex === -1 ? input : input.slice(0, hashIndex)
  const queryIndex = withoutFragment.indexOf('?')
  if (queryIndex === -1) return withoutFragment

  const params = new URLSearchParams(withoutFragment.slice(queryIndex + 1))
  const kept = new URLSearchParams()
  params.forEach((value, key) => {
    if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) return
    kept.append(key, truncateValue(value, 40))
  })

  const serialized = kept.toString()
  return `${withoutFragment.slice(0, queryIndex)}${serialized ? `?${serialized}` : ''}`
}

function truncateValue(value: string, length: number) {
  return value.length <= length ? value : `${value.slice(0, length)}…`
}

/**
 * Normalizes a client-reported pathname: fragments removed, sensitive query parameters
 * dropped, and dynamic route segments collapsed so resource ids never create unbounded
 * cardinality in reports.
 */
export function normalizePath(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null
  let value = input.trim()
  if (!value || value.length > 2048) return null
  if (!value.startsWith('/')) return null
  if (value.includes('..')) return null

  value = stripSensitiveQuery(value)
  if (!value.startsWith('/')) return null

  const [pathname] = value.split('?')
  const collapsed = collapseDynamicSegments(pathname || '/')
  return collapsed.slice(0, MAX_PATH_LENGTH)
}

function collapseDynamicSegments(pathname: string) {
  const trailingSlash = pathname.length > 1 && pathname.endsWith('/')
  const segments = pathname.split('/').filter(Boolean)
  const collapsed = segments.map((segment, index) => {
    const parent = index > 0 ? DYNAMIC_CHILDREN[segments[index - 1]] : undefined
    if (parent) return parent
    if (/^[0-9a-f]{24}$/i.test(segment)) return '{id}'
    if (/^\d+$/.test(segment)) return '{id}'
    return segment
  })
  const result = `/${collapsed.join('/')}`
  return trailingSlash && result !== '/' ? `${result}/` : result
}

export function isExcludedPath(pathname: string) {
  return IGNORED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function sanitizeTitle(input: string | null | undefined) {
  if (!input || typeof input !== 'string') return undefined
  const cleaned = input.replace(/\s+/g, ' ').trim()
  if (!cleaned) return undefined
  return cleaned.slice(0, MAX_TITLE_LENGTH)
}

export function sanitizeReferrerHost(input: string | null | undefined) {
  if (!input || typeof input !== 'string') return undefined
  let candidate = input.trim()
  if (!candidate) return undefined
  try {
    if (!candidate.startsWith('http://') && !candidate.startsWith('https://')) {
      candidate = `https://${candidate}`
    }
    const url = new URL(candidate)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    if (!host || !host.includes('.')) return undefined
    return host.slice(0, 120)
  } catch {
    return undefined
  }
}

export function classifyReferrer(referrerHost: string | undefined, siteHost: string) {
  if (!referrerHost) return 'direct_or_unknown' as const
  const normalized = referrerHost.replace(/^www\./, '')
  const site = (siteHost || '').toLowerCase().replace(/^www\./, '')
  if (!site) return 'external' as const
  return normalized === site ? ('internal' as const) : ('external' as const)
}

export function sanitizePathPrefix(input: string | null | undefined) {
  if (!input) return undefined
  const normalized = normalizePath(input)
  return normalized ?? undefined
}