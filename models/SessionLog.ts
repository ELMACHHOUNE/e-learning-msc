import mongoose, { Schema, Document, Model } from 'mongoose'

interface IAttendanceRecord {
  studentId: mongoose.Types.ObjectId
  status: 'present' | 'absent' | 'late'
}

export interface SessionLogDocument extends Document {
  guildId: mongoose.Types.ObjectId
  sessionNumber: number
  date: Date
  records: IAttendanceRecord[]
  createdAt: Date
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>({
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
