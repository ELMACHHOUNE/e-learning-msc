import mongoose, { Schema, Document, Model } from 'mongoose'

export interface GuildDocument extends Document {
  name: string
  courseId: mongoose.Types.ObjectId
  instructorId: mongoose.Types.ObjectId
  studentIds: mongoose.Types.ObjectId[]
  currentSession: number
  skillsTotal: number
  skillsAchieved: number
  createdAt: Date
}

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

GuildSchema.index({ createdAt: -1 })
GuildSchema.index({ instructorId: 1, createdAt: -1 })
GuildSchema.index({ studentIds: 1 })

const Guild: Model<GuildDocument> = mongoose.models.Guild ?? mongoose.model<GuildDocument>('Guild', GuildSchema)

export default Guild
