import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Category from '@/models/Category'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireRole('admin')
  const { id } = await params
  const body = await req.json()
  const { name } = body

  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
  }

  await connectToDatabase()

  const existing = await Category.findOne({ name: name.trim(), _id: { $ne: id } })
  if (existing) {
    return NextResponse.json({ error: 'Category already exists' }, { status: 409 })
  }

  const category = await Category.findByIdAndUpdate(
    id,
    { name: name.trim() },
    { new: true }
  )
  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: category._id.toString(),
    name: category.name,
    createdAt: category.createdAt,
  })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireRole('admin')
  const { id } = await params

  await connectToDatabase()

  const category = await Category.findByIdAndDelete(id)
  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
