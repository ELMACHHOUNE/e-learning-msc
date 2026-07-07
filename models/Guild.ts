import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type { IGuild } from '@/types'

export interface GuildDocument extends Omit<IGuild, '_id'>, Document {}

const GuildSchema = new Schema<GuildDocument>(
  {
    name: { type: String, required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    instructorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    currentSession: { type: Number, default: 0 },
    skillsTotal: { type: Number, default: 0 },
    skillsAchieved: { type: Number, default: 0 },
  },
  { timestamps: true }
)

const Guild: Model<GuildDocument> = mongoose.models.Guild ?? mongoose.model<GuildDocument>('Guild', GuildSchema)

export default Guild
