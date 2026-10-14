import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type { IAnalyticsGeoCache } from '@/types/analytics'
import { ANALYTICS_GEO_STATUSES } from '@/types/analytics'

export interface AnalyticsGeoCacheDocument extends Omit<IAnalyticsGeoCache, '_id'>, Document {}

const GeoDataSchema = new Schema(
  {
    countryCode: { type: String },
    countryName: { type: String },
    continentCode: { type: String },
    continentName: { type: String },
    regionCode: { type: String },
    regionName: { type: String },
    city: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    timezone: { type: String },
    isp: { type: String },
    asn: { type: Number },
    connectionType: { type: String },
  },
  { _id: false }
)

const AnalyticsGeoCacheSchema = new Schema<AnalyticsGeoCacheDocument>(
  {
    ipHash: { type: String, required: true },
    status: { type: String, enum: ANALYTICS_GEO_STATUSES, required: true },
    geo: { type: GeoDataSchema },
    errorCode: { type: String },
    fetchedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    hitCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

AnalyticsGeoCacheSchema.index({ ipHash: 1 }, { unique: true })
AnalyticsGeoCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const AnalyticsGeoCache: Model<AnalyticsGeoCacheDocument> =
  mongoose.models.AnalyticsGeoCache ??
  mongoose.model<AnalyticsGeoCacheDocument>('AnalyticsGeoCache', AnalyticsGeoCacheSchema)

export default AnalyticsGeoCache