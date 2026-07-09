import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type { ICourse } from '@/types'

export interface CourseDocument extends Omit<ICourse, '_id'>, Document {}

const LessonSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['lesson', 'checkpoint', 'workshop'], default: 'lesson' },
})

const ChapterSchema = new Schema({
  title: { type: String, required: true },
  lessons: [LessonSchema],
})

const ModuleSchema = new Schema({
  title: { type: String, required: true },
  chapters: [ChapterSchema],
})

const CourseSchema = new Schema<CourseDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    coverImage: { type: String },
    durationInMonths: { type: Number, required: true },
    totalSessions: { type: Number, required: true },
    content: [ModuleSchema],
  },
  { timestamps: true }
)

const Course: Model<CourseDocument> = mongoose.models.Course ?? mongoose.model<CourseDocument>('Course', CourseSchema)

export default Course
