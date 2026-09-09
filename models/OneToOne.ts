import mongoose, { Schema, Document, Model } from 'mongoose'

export interface OneToOneDocument extends Document {
  instructorId: mongoose.Types.ObjectId
  studentId?: mongoose.Types.ObjectId
  guildId: mongoose.Types.ObjectId
  title?: string
  date: Date
  duration: number
  status: 'available' | 'booked' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

const OneToOneSchema = new Schema<OneToOneDocument>(
  {
    instructorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User' },
    guildId: { type: Schema.Types.ObjectId, ref: 'Guild', required: true },
    title: { type: String },
    date: { type: Date, required: true },
    duration: { type: Number, required: true, min: 15, max: 180 },
    status: { type: String, enum: ['available', 'booked', 'cancelled'], default: 'available' },
  },
  { timestamps: true }
)

OneToOneSchema.index({ instructorId: 1, date: 1 })
OneToOneSchema.index({ studentId: 1, date: 1 })
OneToOneSchema.index({ guildId: 1, date: 1 })
OneToOneSchema.index({ status: 1 })

const OneToOne: Model<OneToOneDocument> =
  mongoose.models.OneToOne ?? mongoose.model<OneToOneDocument>('OneToOne', OneToOneSchema)

export default OneToOne