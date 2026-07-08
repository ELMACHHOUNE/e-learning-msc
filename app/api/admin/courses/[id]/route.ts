import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Course from '@/models/Course'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin')
  const { id } = await params
  const body = await req.json()
  await connectToDatabase()

  const update: Record<string, unknown> = {}
  if (body.title !== undefined) update.title = body.title
  if (body.description !== undefined) update.description = body.description
  if (body.durationInMonths !== undefined) update.durationInMonths = body.durationInMonths
  if (body.totalSessions !== undefined) update.totalSessions = body.totalSessions
  if (body.content !== undefined) update.content = body.content

  const course = await Course.findByIdAndUpdate(id, update, { new: true })
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  return NextResponse.json({ id: course._id.toString(), title: course.title })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin')
  const { id } = await params
  await connectToDatabase()
  const course = await Course.findByIdAndDelete(id)
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
