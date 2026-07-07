import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type { ISessionLog } from '@/types'

export interface SessionLogDocument extends Omit<ISessionLog, '_id'>, Document {}

const AttendanceRecordSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['present', 'absent', 'late'], required: true },
})

const SessionLogSchema = new Schema<SessionLogDocument>(
  {
    guildId: { type: Schema.Types.ObjectId, ref: 'Guild', required: true },
    sessionNumber: { type: Number, required: true },
    date: { type: Date, required: true },
    records: [AttendanceRecordSchema],
  },
  { timestamps: true }
)

const SessionLog: Model<SessionLogDocument> = mongoose.models.SessionLog ?? mongoose.model<SessionLogDocument>('SessionLog', SessionLogSchema)

export default SessionLog
