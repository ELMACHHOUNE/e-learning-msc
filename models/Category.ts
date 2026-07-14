import mongoose, { Schema, type Document, type Model } from 'mongoose'
import type { ICategory } from '@/types'

export interface CategoryDocument extends Omit<ICategory, '_id'>, Document {}

const CategorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
)

const Category: Model<CategoryDocument> =
  mongoose.models.Category ?? mongoose.model<CategoryDocument>('Category', CategorySchema)

export default Category
