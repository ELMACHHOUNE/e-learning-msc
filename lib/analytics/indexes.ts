import { connectToDatabase } from '@/lib/db'
import { getAnalyticsConfig } from '@/lib/analytics/config'
import AnalyticsEvent from '@/models/AnalyticsEvent'
import AnalyticsSession from '@/models/AnalyticsSession'
import AnalyticsGeoCache from '@/models/AnalyticsGeoCache'

const TTL_INDEX_NAME = 'receivedAt_1_ttl'

export interface EnsureIndexesResult {
  created: string[]
  unchanged: string[]
  collections: string[]
  ttlSeconds: number
}

interface IndexInfo {
  name: string
  expireAfterSeconds?: number
}

/**
 * Idempotent, additive index bootstrap.
 *
 * Mongoose already creates the schema-declared indexes on first connection, so this mainly
 * adds the retention TTL index whose lifetime follows ANALYTICS_RETENTION_DAYS and cannot be
 * expressed declaratively. Uses `createIndexes` rather than `syncIndexes` because the latter
 * drops anything not declared in the schema — which would delete the TTL index on every call.
 * Nothing is ever removed, so this is safe to run repeatedly.
 *
 * Collection names are always read from the compiled models — never hard-coded — because
 * Mongoose derives them from the model name (`AnalyticsEvent` -> `analyticsevents`).
 */
export async function ensureAnalyticsIndexes(): Promise<EnsureIndexesResult> {
  await connectToDatabase()

  const models = [AnalyticsEvent, AnalyticsSession, AnalyticsGeoCache] as const
  const collections = models.map((model) => model.collection.collectionName)
  const config = getAnalyticsConfig()
  const ttlSeconds = config.retentionDays * 86_400
  const created: string[] = []
  const unchanged: string[] = []

  for (const model of models) {
    try {
      await model.createIndexes()
      unchanged.push(`${model.collection.collectionName} (schema indexes)`)
    } catch (error) {
      console.error(
        `[analytics] index creation failed for ${model.collection.collectionName}:`,
        error instanceof Error ? error.message : 'unknown',
      )
      created.push(`${model.collection.collectionName} (schema index creation FAILED)`)
    }
  }

  const events = AnalyticsEvent.collection
  const existing = (await events.indexes().catch(() => [] as IndexInfo[])) as IndexInfo[]
  const ttl = existing.find((index) => index.name === TTL_INDEX_NAME)

  if (!ttl) {
    await events.createIndex({ receivedAt: 1 }, { name: TTL_INDEX_NAME, expireAfterSeconds: ttlSeconds })
    created.push(`${events.collectionName}.${TTL_INDEX_NAME}`)
  } else if (ttl.expireAfterSeconds !== ttlSeconds) {
    // Recreating beats `collMod`: MongoDB rejects an in-place expireAfterSeconds change, and
    // a drop/recreate of a TTL index deletes nothing — it only re-arms the reaper.
    await events.dropIndex(TTL_INDEX_NAME)
    await events.createIndex({ receivedAt: 1 }, { name: TTL_INDEX_NAME, expireAfterSeconds: ttlSeconds })
    created.push(`${events.collectionName}.${TTL_INDEX_NAME} (${ttl.expireAfterSeconds}s -> ${ttlSeconds}s)`)
  } else {
    unchanged.push(`${events.collectionName}.${TTL_INDEX_NAME}`)
  }

  return { created, unchanged, collections, ttlSeconds }
}