import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type { IMessage } from '@/types'

export interface MessageDocument extends Omit<IMessage, '_id'>, Document {}

const MessageSchema = new Schema<MessageDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    userId: { type: String },
    message: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
)

MessageSchema.index({ createdAt: -1 })
MessageSchema.index({ email: 1, createdAt: -1 })

const Message: Model<MessageDocument> = mongoose.models.Message ?? mongoose.model<MessageDocument>('Message', MessageSchema)

export default Message
