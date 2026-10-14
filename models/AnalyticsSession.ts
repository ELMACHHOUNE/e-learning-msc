import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type { IAnalyticsSession } from '@/types/analytics'
import { ANALYTICS_DEVICE_TYPES } from '@/types/analytics'

export interface AnalyticsSessionDocument extends Omit<IAnalyticsSession, '_id'>, Document {}

const AnalyticsSessionSchema = new Schema<AnalyticsSessionDocument>(
  {
    sessionId: { type: String, required: true },
    visitorIdHash: { type: String, required: true },
    startedAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true },
    endedAt: { type: Date },
    pageViewCount: { type: Number, default: 0 },
    landingPath: { type: String, required: true },
    exitPath: { type: String, required: true },
    countryCode: { type: String },
    countryName: { type: String },
    regionName: { type: String },
    city: { type: String },
    deviceType: { type: String, enum: ANALYTICS_DEVICE_TYPES, default: 'unknown' },
    browserFamily: { type: String },
    osFamily: { type: String },
    isAuthenticated: { type: Boolean, default: false },
    userRole: { type: String },
    isInternal: { type: Boolean, default: false },
    isBot: { type: Boolean, default: false },
    referrerHost: { type: String },
  },
  { timestamps: true }
)

AnalyticsSessionSchema.index({ sessionId: 1 }, { unique: true })
AnalyticsSessionSchema.index({ startedAt: -1 })
AnalyticsSessionSchema.index({ visitorIdHash: 1, startedAt: -1 })
AnalyticsSessionSchema.index({ startedAt: -1, countryCode: 1 })
AnalyticsSessionSchema.index({ isBot: 1, isInternal: 1, startedAt: -1 })
// Sessions are sessionized in place, so they never expire on their own; stale rows are
// pruned together with their events by scripts/purge-analytics.ts.

const AnalyticsSession: Model<AnalyticsSessionDocument> =
  mongoose.models.AnalyticsSession ??
  mongoose.model<AnalyticsSessionDocument>('AnalyticsSession', AnalyticsSessionSchema)

export default AnalyticsSession