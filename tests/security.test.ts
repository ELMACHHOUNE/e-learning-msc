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