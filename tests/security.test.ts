import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(process.cwd())

function read(relative: string) {
  return readFileSync(join(root, relative), 'utf8')
}

describe('secret handling', () => {
  it('never reads the IPstack key from a NEXT_PUBLIC_ variable', () => {
    for (const file of [
      'lib/analytics/config.ts',
      'lib/analytics/ipstack.ts',
      'app/api/analytics/collect/route.ts',
      'app/api/admin/analytics/route.ts',
    ]) {
      assert.equal(read(file).includes('NEXT_PUBLIC_IPSTACK'), false, file)
    }
  })

  it('is never referenced from a client component', () => {
    for (const file of [
      'components/analytics/analytics-tracker.tsx',
      'components/analytics/analytics-filters.tsx',
      'components/analytics/analytics-charts.tsx',
      'components/analytics/analytics-primitives.tsx',
      'components/analytics/analytics-table.tsx',
      'app/(main)/admin/analytics/page.tsx',
    ]) {
      const source = read(file)
      assert.equal(source.includes('IPSTACK'), false, file)
      assert.equal(source.includes('process.env'), false, file)
    }
  })

  it('keeps the key out of the analytics tracker payload', () => {
    const source = read('components/analytics/analytics-tracker.tsx')
    assert.equal(source.includes('access_key'), false)
    assert.equal(source.includes('ip'), false)
  })

  it('keeps .env out of version control', () => {
    assert.match(read('.gitignore'), /^\.env$/m)
  })
})

describe('authorization guards', () => {
  it('guards every admin analytics endpoint server-side', () => {
    const source = read('app/api/admin/analytics/route.ts')
    assert.match(source, /requireRole\('admin'\)/)
    assert.ok(source.indexOf('requireRole') < source.indexOf('connectToDatabase'))
  })

  it('rejects anonymous and non-admin callers before touching the database', () => {
    const source = read('app/api/admin/analytics/route.ts')
    assert.match(source, /status: 401/)
    assert.match(source, /status: 403/)
  })

  it('never exposes a public arbitrary-IP lookup route', () => {
    const source = read('app/api/analytics/collect/route.ts')
    assert.equal(source.includes('access_key'), false)
    assert.equal(source.includes('searchParams.get(\'ip\')'), false)
    assert.equal(source.includes('GET'), false)
  })

  it('keeps the admin analytics page behind the existing /admin matcher', () => {
    assert.match(read('proxy.ts'), /'\/admin\/:path\*'/)
  })
})

describe('ingestion hardening', () => {
  it('bounds the request body', () => {
    assert.match(read('app/api/analytics/collect/route.ts'), /maxBodyBytes/)
    assert.match(read('app/api/analytics/collect/route.ts'), /status: 413/)
  })

  it('validates the batch and caps the number of events', () => {
    const source = read('lib/analytics/ingest.ts')
    assert.match(source, /collectBatchSchema\.safeParse/)
    assert.match(source, /collectEventSchema\.safeParse/)
    assert.match(source, /maxEventsPerRequest/)
  })

  it('derives the timestamp and the IP server-side, never from the client', () => {
    const source = read('lib/analytics/ingest.ts')
    assert.equal(/occurredAt:\s*event\./.test(source), false)
    assert.match(source, /const now = new Date\(\)/)
    assert.match(source, /extractClientIp\(req\.headers/)
  })

  it('deduplicates by client event id before writing', () => {
    const source = read('lib/analytics/ingest.ts')
    assert.match(source, /existingSet/)
    assert.match(source, /duplicates/)
  })

  it('rate limits ingestion', () => {
    assert.match(read('lib/analytics/ingest.ts'), /consumeRateLimit/)
  })
})

describe('data minimisation', () => {
  const model = read('models/AnalyticsEvent.ts')

  it('stores no raw IP field', () => {
    assert.equal(/\bip\b\s*:/.test(model), false)
    assert.match(model, /ipHash/)
  })

  it('stores no credential, cookie or message fields', () => {
    for (const forbidden of ['password', 'token', 'cookie', 'authorization', 'message', 'grade', 'answer']) {
      assert.equal(new RegExp(`\\b${forbidden}\\s*:`, 'i').test(model), false, forbidden)
    }
  })

  it('keeps geolocation cache keyed by hash only', () => {
    const cache = read('models/AnalyticsGeoCache.ts')
    assert.match(cache, /ipHash/)
    assert.equal(/\bip\s*:\s*\{/.test(cache), false)
  })
})

describe('reporting safety', () => {
  const route = read('app/api/admin/analytics/route.ts')

  it('validates the report name against an allowlist', () => {
    assert.match(route, /isReportName/)
    assert.match(route, /status: 400/)
  })

  it('rejects unknown sort and page parameters by clamping', () => {
    assert.match(route, /clampInt/)
    assert.match(route, /Math\.trunc/)
  })

  it('caps CSV export size and marks administrative responses private', () => {
    assert.match(route, /Cache-Control.*private, no-store/)
    assert.match(route, /getEventExportRows\(filter, 5000\)/)
    assert.match(route, /getPages\(filter, 1000\)/)
  })

  it('returns a generic error instead of the caught exception', () => {
    assert.match(route, /error\.message : 'unknown'/)
    assert.equal(/error:\s*error\.(message|stack)/.test(route), false)
  })
})

describe('theme tokens', () => {
  it('never uses sized max-w-* utilities, which this theme rescales', () => {
    // app/globals.css redefines --spacing-md / -lg / -xl, so Tailwind's max-w-md etc.
    // resolve to the project spacing scale (16px) instead of a real max-width.
    const theme = read('app/globals.css')
    assert.match(theme, /--spacing-md:/)

    const files = [
      'components/analytics/analytics-primitives.tsx',
      'components/analytics/analytics-table.tsx',
      'components/analytics/analytics-charts.tsx',
      'components/analytics/analytics-filters.tsx',
      'app/(main)/admin/analytics/page.tsx',
    ]
    for (const file of files) {
      assert.equal(/\bmax-w-(sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)\b/.test(read(file)), false, file)
    }
  })
})

describe('report contract', () => {
  const page = read('app/(main)/admin/analytics/page.tsx')
  const route = read('app/api/admin/analytics/route.ts')

  it('only requests report names the API actually serves', () => {
    const allowlist =
      route.match(/const REPORTS = \[([\s\S]*?)\] as const/)?.[1].match(/'([a-z-]+)'/g)?.map((name) => name.replace(/'/g, '')) ?? []

    const mapping = page.match(/const TAB_REPORTS[^=]*=\s*\{([\s\S]*?)\}/)?.[1] ?? ''
    const requested = mapping.match(/:\s*'([a-z-]+)'/g)?.map((name) => name.split("'")[1]) ?? []

    assert.ok(allowlist.length >= 9, `expected the report allowlist, got ${JSON.stringify(allowlist)}`)
    assert.equal(requested.length, 6, `expected 6 tab mappings, got ${JSON.stringify(requested)}`)
    for (const name of requested) {
      assert.ok(allowlist.includes(name), `tab requests unknown report "${name}"`)
    }
  })

  it('adapts API distributions to the { name, value } chart shape', () => {
    assert.match(page, /function toRank\(rows: DistributionRow\[\]\): RankRow\[\]/)
    assert.match(page, /DistributionPieChart data=\{toRank\(/)
  })
})

describe('chart resilience', () => {
  const charts = read('components/analytics/analytics-charts.tsx')

  it('normalises rows before every rank-based chart renders', () => {
    assert.match(charts, /function normalizeRank/)
    const rankCharts = charts.slice(charts.indexOf('export function RankBarChart'))
    const normalizations = rankCharts.match(/const rows = normalizeRank\(data\)/g) ?? []
    assert.equal(normalizations.length, 3, 'RankBarChart, DistributionPieChart and LegendList must all normalise')
    assert.equal(/data\.length === 0/.test(rankCharts), false)
  })

  it('filters non-numeric values before any arithmetic or formatting', () => {
    assert.match(charts, /typeof row\.value === 'number' && Number\.isFinite\(row\.value\)/)
  })
})

describe('exclusions and retention', () => {
  it('excludes infrastructure and self-referential paths', () => {
    const source = read('lib/analytics/paths.ts')
    assert.match(source, /'\/api\/'/)
    assert.match(source, /'\/_next\/'/)
    assert.match(source, /'\/admin\/analytics'/)
  })

  it('excludes internal and bot traffic unless explicitly requested', () => {
    const source = read('lib/analytics/reports.ts')
    assert.match(source, /if \(!filter\.includeInternal\) match\.isInternal = false/)
    assert.match(source, /if \(!filter\.includeBots\) match\.isBot = false/)
  })

  it('drives the retention TTL from configuration', () => {
    assert.match(read('lib/analytics/config.ts'), /ANALYTICS_RETENTION_DAYS/)
    assert.match(read('lib/analytics/indexes.ts'), /expireAfterSeconds/)
  })
})

describe('session claim integrity', () => {
  it('never lets a client rewrite its own email or role claim', () => {
    const auth = read('lib/auth.ts')
    assert.equal(/typedToken\.email\s*=\s*session\.email/.test(auth), false)
    assert.match(auth, /if \(typeof session\.name === 'string'/)
    assert.match(auth, /typedToken\.picture = session\.image/)
  })

  it('only whitelists display fields on the update trigger', () => {
    const updateBlock = read('lib/auth.ts').match(
      /if \(trigger === 'update' && session\) \{([\s\S]*?)\n\s*\}/,
    )?.[1]
    assert.ok(updateBlock, 'expected the update-trigger block')
    assert.match(updateBlock, /typedToken\.name = session\.name/)
    assert.match(updateBlock, /typedToken\.picture = session\.image/)
    assert.equal(/typedToken\.email/.test(updateBlock), false)
    assert.equal(/typedToken\.role/.test(updateBlock), false)
  })
})

describe('upload path safety', () => {
  const route = read('app/uploads/[...path]/route.ts')

  it('validates every path segment before building the object key', () => {
    assert.match(route, /SAFE_SEGMENT/)
    assert.match(route, /isValidUploadPath\(path\)/)
    const validationIndex = route.indexOf('isValidUploadPath(path)')
    const keyIndex = route.indexOf('const key =')
    assert.ok(validationIndex !== -1 && keyIndex > validationIndex, 'validation must precede key construction')
  })

  it('only accepts segment-safe keys', () => {
    assert.match(route, /const SAFE_SEGMENT = \/\^\[A-Za-z0-9\]/)
    assert.match(route, /path\.every\(/)
  })

  it('answers 404 for missing objects and 502 for storage failures', () => {
    assert.match(route, /status: 404/)
    assert.match(route, /status: 502/)
    assert.match(route, /NoSuchKey/)
  })
})

describe('admin write validation', () => {
  it('restricts account creation to the known roles', () => {
    const route = read('app/api/admin/users/route.ts')
    assert.match(route, /const ROLES = \['admin', 'instructor', 'student'\] as const/)
    assert.match(route, /ROLES\.includes\(role\)/)
    assert.match(route, /EMAIL_PATTERN\.test\(email\)/)
    assert.match(route, /status: 409/)
  })

  it('blocks self-deletion and removal of the last admin', () => {
    const route = read('app/api/admin/users/[id]/route.ts')
    assert.match(route, /id === guard\.user\.id/)
    assert.match(route, /last admin/)
  })

  it('never wipes a lab phase category that the request omitted', () => {
    const route = read('app/api/admin/labphases/[id]/route.ts')
    assert.match(route, /if \(category !== undefined\)/)
  })
})

describe('project review integrity', () => {
  it('re-opens validation when a validated deliverable is replaced', () => {
    const route = read('app/api/projects/[id]/route.ts')
    assert.match(route, /replacingValidatedStep/)
    assert.match(route, /stepRecord\.validated = false/)
    assert.match(route, /project\.finalGrade = undefined/)
  })
})

describe('one-to-one privacy', () => {
  it('hides peer identities from students', () => {
    const route = read('app/api/one-to-one/route.ts')
    assert.match(route, /function serializeSlot\(s: LeanSlot, exposeStudent: boolean\)/)
    assert.match(route, /studentName: exposeStudent \?/)
  })
})

describe('unauthenticated API responses', () => {
  it('answers 401 rather than an empty course list', () => {
    const route = read('app/api/courses/route.ts')
    assert.match(route, /error: 'Unauthorized' \}, \{ status: 401 \}/)
  })

  it('answers 400 for malformed JSON bodies', () => {
    const route = read('app/api/admin/users/route.ts')
    assert.match(route, /req\.json\(\)\.catch\(\(\) => null\)/)
  })
})