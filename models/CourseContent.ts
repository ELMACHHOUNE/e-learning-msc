import mongoose, { Schema, Document, Model } from 'mongoose'

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

export interface CourseContentDocument extends Document {
  courseId: mongoose.Types.ObjectId
  content: Array<{
    title: string
    chapters: Array<{
      title: string
      lessons: Array<{
        title: string
        content: string
        type: 'lesson' | 'checkpoint' | 'workshop'
      }>
    }>
  }>
  createdAt: Date
}

const CourseContentSchema = new Schema<CourseContentDocument>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, unique: true },
    content: [ModuleSchema],
  },
  { timestamps: true }
)

const CourseContent: Model<CourseContentDocument> =
  mongoose.models.CourseContent ?? mongoose.model<CourseContentDocument>('CourseContent', CourseContentSchema)

export default CourseContent
