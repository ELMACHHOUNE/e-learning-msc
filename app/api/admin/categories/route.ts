import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Category from '@/models/Category'
import Course from '@/models/Course'
import LabPhase from '@/models/LabPhase'

export async function GET() {
  await requireRole('admin')
  await connectToDatabase()

  const categories = await Category.find().sort({ name: 1 }).lean()

  const courseCounts = await Course.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ])
  const labPhaseCounts = await LabPhase.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ])

  const countMap: Record<string, { courses: number; labPhases: number }> = {}
  for (const c of courseCounts) {
    if (c._id) countMap[c._id] = { ...countMap[c._id], courses: c.count }
  }
  for (const l of labPhaseCounts) {
    if (l._id) countMap[l._id] = { ...countMap[l._id], labPhases: l.count }
  }

  return NextResponse.json({
    categories: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      courses: countMap[c.name]?.courses ?? 0,
      labPhases: countMap[c.name]?.labPhases ?? 0,
      createdAt: c.createdAt,
    })),
  })
}

export async function POST(req: Request) {
  await requireRole('admin')
  const body = await req.json()
  const { name } = body

  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
  }

  await connectToDatabase()

  const existing = await Category.findOne({ name: name.trim() })
  if (existing) {
    return NextResponse.json({ error: 'Category already exists' }, { status: 409 })
  }

  const category = await Category.create({ name: name.trim() })

  return NextResponse.json({
    id: category._id.toString(),
    name: category.name,
    createdAt: category.createdAt,
  })
}
