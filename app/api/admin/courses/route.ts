import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Course from '@/models/Course'
import CourseContent from '@/models/CourseContent'

export async function GET() {
  await requireRole('admin')
  await connectToDatabase()
  const courses = await Course.find()
    .select('title description coverImage price active durationInMonths totalSessions category moduleCount createdAt')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()
  return NextResponse.json(courses.map((c) => ({ id: c._id.toString(), title: c.title, description: c.description, coverImage: c.coverImage, price: c.price, active: c.active, durationInMonths: c.durationInMonths, totalSessions: c.totalSessions, category: c.category, moduleCount: c.moduleCount, createdAt: c.createdAt })))
}

export async function POST(req: Request) {
  await requireRole('admin')
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { title, description, coverImage, price, active, durationInMonths, totalSessions, category, content } = body as { title?: string; description?: string; coverImage?: string; price?: number; active?: boolean; durationInMonths?: number; totalSessions?: number; category?: string; content?: unknown }
  if (!title || !description || durationInMonths == null || totalSessions == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  await connectToDatabase()
  const contentArr = (content ?? []) as Record<string, unknown>[]
  const course = await Course.create({
    title, description, coverImage, price, active,
    durationInMonths, totalSessions, category: category || undefined,
    moduleCount: contentArr.length,
  })
  if (contentArr.length > 0) {
    await CourseContent.create({ courseId: course._id, content: contentArr })
  }
  return NextResponse.json({ id: course._id.toString(), title: course.title })
}
