import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type { IProjectApplication } from '@/types'

const StepValidationSchema = new Schema(
  {
    url: { type: String, default: '' },
    score: { type: Number },
    validated: { type: Boolean, default: false },
  },
  { _id: false }
)

export interface ProjectApplicationDocument extends Omit<IProjectApplication, '_id' | 'studentId' | 'labPhaseId' | 'guildId'>, Document {
  studentId: mongoose.Types.ObjectId
  labPhaseId: mongoose.Types.ObjectId
  guildId?: mongoose.Types.ObjectId
}

const ProjectApplicationSchema = new Schema<ProjectApplicationDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    labPhaseId: { type: Schema.Types.ObjectId, ref: 'LabPhase', required: true },
    guildId: { type: Schema.Types.ObjectId, ref: 'Guild' },
    status: { type: String, enum: ['pending', 'approved', 'in_progress', 'completed', 'rejected'], default: 'pending' },
    presentation: { type: StepValidationSchema, default: () => ({ url: '', validated: false }) },
    gitRepo: { type: StepValidationSchema, default: () => ({ url: '', validated: false }) },
    deployment: { type: StepValidationSchema, default: () => ({ url: '', validated: false }) },
    finalGrade: { type: Number },
  },
  { timestamps: true }
)

ProjectApplicationSchema.index({ studentId: 1, createdAt: -1 })
ProjectApplicationSchema.index({ labPhaseId: 1 })

const ProjectApplication: Model<ProjectApplicationDocument> =
  mongoose.models.ProjectApplication ?? mongoose.model<ProjectApplicationDocument>('ProjectApplication', ProjectApplicationSchema)

export default ProjectApplication
