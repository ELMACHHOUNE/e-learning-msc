import mongoose, { Schema, type Document, type Model } from 'mongoose'

export interface AIConversationDocument extends Document {
  userId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  contentId?: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    confidence?: string
    createdAt: Date
  }>
  createdAt: Date
  updatedAt: Date
}

const AIMessageSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    confidence: { type: String },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } },
)

const AIConversationSchema = new Schema<AIConversationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    contentId: { type: String },
    messages: [AIMessageSchema],
  },
  { timestamps: true },
)

AIConversationSchema.index({ userId: 1, courseId: 1, createdAt: -1 })
AIConversationSchema.index({ userId: 1, updatedAt: -1 })

const AIConversation: Model<AIConversationDocument> =
  mongoose.models.AIConversation ??
  mongoose.model<AIConversationDocument>('AIConversation', AIConversationSchema)

export default AIConversation
