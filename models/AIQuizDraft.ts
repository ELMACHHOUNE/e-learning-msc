import mongoose, { Schema, type Document, type Model } from 'mongoose'

export interface AIQuizDraftDocument extends Document {
  createdBy: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  contentId?: string
  title: string
  description: string
  questions: Array<{
    question: string
    options: string[]
    correctAnswer: string
    explanation: string
  }>
  difficulty: string
  status: 'draft' | 'approved' | 'rejected'
  aiModel: string
  aiGenerationTime: number
  createdAt: Date
  updatedAt: Date
}

const AIQuizQuestionSchema = new Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false },
)

const AIQuizDraftSchema = new Schema<AIQuizDraftDocument>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    contentId: { type: String },
    title: { type: String, required: true },
    description: { type: String, required: true },
    questions: { type: [AIQuizQuestionSchema], required: true, min: 1 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    status: { type: String, enum: ['draft', 'approved', 'rejected'], default: 'draft' },
    aiModel: { type: String, required: true },
    aiGenerationTime: { type: Number, default: 0 },
  },
  { timestamps: true },
)

AIQuizDraftSchema.index({ createdBy: 1, createdAt: -1 })
AIQuizDraftSchema.index({ courseId: 1, status: 1 })
AIQuizDraftSchema.index({ status: 1, createdAt: -1 })

const AIQuizDraft: Model<AIQuizDraftDocument> =
  mongoose.models.AIQuizDraft ??
  mongoose.model<AIQuizDraftDocument>('AIQuizDraft', AIQuizDraftSchema)

export default AIQuizDraft
