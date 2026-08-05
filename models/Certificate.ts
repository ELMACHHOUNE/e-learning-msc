import mongoose, { Schema, type Document, type Model } from 'mongoose'

export interface CertificateDocument extends Document {
  studentId: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  studentName: string
  studentEmail: string
  courseTitle: string
  instructorId?: mongoose.Types.ObjectId
  instructorName: string
  academyName: string
  durationF: string
  formationDate: string
  certificateId: string
  graduatedAt: Date
  createdAt: Date
}

const CertificateSchema = new Schema<CertificateDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'ProjectApplication', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    courseTitle: { type: String, required: true },
    instructorId: { type: Schema.Types.ObjectId, ref: 'User' },
    instructorName: { type: String, required: true },
    academyName: { type: String, required: true },
    durationF: { type: String, default: '' },
    formationDate: { type: String, required: true },
    certificateId: { type: String, required: true, unique: true },
    graduatedAt: { type: Date, required: true },
  },
  { timestamps: true }
)

CertificateSchema.index({ graduatedAt: -1 })
CertificateSchema.index({ studentId: 1, projectId: 1 }, { unique: true })

const Certificate: Model<CertificateDocument> =
  mongoose.models.Certificate ?? mongoose.model<CertificateDocument>('Certificate', CertificateSchema)

export default Certificate
