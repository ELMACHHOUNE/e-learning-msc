import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type { ICourse } from '@/types'

export interface CourseDocument extends Omit<ICourse, '_id'>, Document {}

const CourseSchema = new Schema<CourseDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    coverImage: { type: String },
    price: { type: Number },
    active: { type: Boolean, default: true },
    durationInMonths: { type: Number, required: true },
    totalSessions: { type: Number, required: true },
    category: { type: String },
    moduleCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

CourseSchema.index({ createdAt: -1 })
CourseSchema.index({ category: 1 })
CourseSchema.index({ active: 1, createdAt: -1 })

const Course: Model<CourseDocument> = mongoose.models.Course ?? mongoose.model<CourseDocument>('Course', CourseSchema)

export default Course
