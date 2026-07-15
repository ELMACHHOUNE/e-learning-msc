import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type { ILabPhase } from '@/types'

export interface LabPhaseDocument extends Omit<ILabPhase, '_id' | 'createdBy'>, Document {
  createdBy: mongoose.Types.ObjectId
}

const LabPhaseSchema = new Schema<LabPhaseDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    instructions: { type: String, required: true },
    duration: { type: String, required: true },
    image: { type: String },
    category: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rejectionReason: { type: String },
  },
  { timestamps: true }
)

LabPhaseSchema.index({ createdAt: -1 })
LabPhaseSchema.index({ status: 1, createdAt: -1 })
LabPhaseSchema.index({ createdBy: 1, createdAt: -1 })

const LabPhase: Model<LabPhaseDocument> = mongoose.models.LabPhase ?? mongoose.model<LabPhaseDocument>('LabPhase', LabPhaseSchema)

export default LabPhase
