import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Category from '@/models/Category'

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
