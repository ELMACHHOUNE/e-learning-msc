import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type { IAnalyticsEvent } from '@/types/analytics'
import { ANALYTICS_DEVICE_TYPES, ANALYTICS_EVENT_TYPES, ANALYTICS_GEO_STATUSES } from '@/types/analytics'

export interface AnalyticsEventDocument extends Omit<IAnalyticsEvent, '_id'>, Document {}

const AnalyticsEventSchema = new Schema<AnalyticsEventDocument>(
  {
    eventId: { type: String, required: true },
    eventType: { type: String, required: true, enum: ANALYTICS_EVENT_TYPES },
    occurredAt: { type: Date, required: true },
    sessionId: { type: String, required: true },
    visitorIdHash: { type: String, required: true },
    ipHash: { type: String },
    path: { type: String, required: true },
    pageTitle: { type: String },
    referrerHost: { type: String },
    referrerType: {
      type: String,
      enum: ['external', 'internal', 'direct_or_unknown'],
      default: 'direct_or_unknown',
    },
    countryCode: { type: String },
    countryName: { type: String },
    continentCode: { type: String },
    continentName: { type: String },
    regionName: { type: String },
    city: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    timezone: { type: String },
    isp: { type: String },
    asn: { type: Number },
    connectionType: { type: String },
    geoStatus: { type: String, enum: ANALYTICS_GEO_STATUSES, default: 'skipped' },
    deviceType: { type: String, enum: ANALYTICS_DEVICE_TYPES, default: 'unknown' },
    browserFamily: { type: String },
    osFamily: { type: String },
    isAuthenticated: { type: Boolean, default: false },
    userRole: { type: String },
    isInternal: { type: Boolean, default: false },
    isBot: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: 'receivedAt', updatedAt: false } }
)

AnalyticsEventSchema.index({ eventId: 1 }, { unique: true })
AnalyticsEventSchema.index({ occurredAt: -1 })
AnalyticsEventSchema.index({ occurredAt: -1, isBot: 1, isInternal: 1 })
AnalyticsEventSchema.index({ occurredAt: -1, countryCode: 1 })
AnalyticsEventSchema.index({ occurredAt: -1, path: 1 })
AnalyticsEventSchema.index({ sessionId: 1 })
AnalyticsEventSchema.index({ visitorIdHash: 1, occurredAt: -1 })
AnalyticsEventSchema.index({ eventType: 1, occurredAt: -1 })
// The retention TTL index is created by scripts/ensure-analytics-indexes.ts so that
// `expireAfterSeconds` always matches ANALYTICS_RETENTION_DAYS.

const AnalyticsEvent: Model<AnalyticsEventDocument> =
  mongoose.models.AnalyticsEvent ??
  mongoose.model<AnalyticsEventDocument>('AnalyticsEvent', AnalyticsEventSchema)

export default AnalyticsEvent