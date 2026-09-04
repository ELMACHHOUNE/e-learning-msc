import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type { ISiteContent } from '@/types'

export interface SiteContentDocument extends Omit<ISiteContent, '_id' | 'updatedBy'>, Document {
  updatedBy: mongoose.Types.ObjectId
}

const SiteContentSchema = new Schema<SiteContentDocument>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    content: { type: Schema.Types.Mixed, default: {} },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

SiteContentSchema.index({ key: 1 }, { unique: true })

const SiteContent: Model<SiteContentDocument> =
  mongoose.models.SiteContent ?? mongoose.model<SiteContentDocument>('SiteContent', SiteContentSchema)

export default SiteContent