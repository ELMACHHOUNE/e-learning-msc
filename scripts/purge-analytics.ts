/**
 * Deletes analytics rows older than ANALYTICS_RETENTION_DAYS.
 *
 * The TTL index reaps events on its own; this exists so sessions and the geolocation cache
 * are pruned in step. Collection names come from the compiled models, never hard-coded.
 */
import mongoose from 'mongoose'
import AnalyticsEvent from '@/models/AnalyticsEvent'
import AnalyticsSession from '@/models/AnalyticsSession'
import AnalyticsGeoCache from '@/models/AnalyticsGeoCache'

async function purgeAnalytics() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('Please define the MONGODB_URI environment variable')

  const retentionDays = Number(process.env.ANALYTICS_RETENTION_DAYS ?? 90)
  const cutoff = new Date(Date.now() - Math.min(Math.max(retentionDays, 1), 3650) * 86_400_000)

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 })

  const events = await AnalyticsEvent.collection.deleteMany({ occurredAt: { $lt: cutoff } })
  const sessions = await AnalyticsSession.collection.deleteMany({ startedAt: { $lt: cutoff } })
  const caches = await AnalyticsGeoCache.collection.deleteMany({ fetchedAt: { $lt: cutoff } })

  console.info(
    `[analytics] purged ${events.deletedCount} events, ${sessions.deletedCount} sessions and ${caches.deletedCount} geocache rows older than ${cutoff.toISOString()}`,
  )

  await mongoose.disconnect()
}

purgeAnalytics()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[analytics] purge failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  })