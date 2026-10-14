import { ensureAnalyticsIndexes } from '@/lib/analytics/indexes'

ensureAnalyticsIndexes()
  .then((result) => {
    console.info(
      `[analytics] index bootstrap complete | ttl=${result.ttlSeconds}s | created=${result.created.length} | unchanged=${result.unchanged.length}`,
    )
    process.exit(0)
  })
  .catch((error) => {
    console.error('[analytics] index bootstrap failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  })