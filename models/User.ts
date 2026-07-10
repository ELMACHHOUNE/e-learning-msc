import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type { IUser } from '@/types'

export interface UserDocument extends Omit<IUser, '_id'>, Document {}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    password: { type: String, required: false, select: false },
    avatar: { type: String },
    role: { type: String, enum: ['admin', 'instructor', 'student'], required: true },
  },
  { timestamps: true }
)

const User: Model<UserDocument> = mongoose.models.User ?? mongoose.model<UserDocument>('User', UserSchema)

export default User
