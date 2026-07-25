import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Course from '@/models/Course'
import CourseContent from '@/models/CourseContent'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin')
  const { id } = await params
  await connectToDatabase()
  const [course, courseContent] = await Promise.all([
    Course.findById(id).select('title description coverImage price active durationInMonths totalSessions category moduleCount createdAt').lean(),
    CourseContent.findOne({ courseId: id }).lean(),
  ])
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const content = courseContent?.content ?? null
  return NextResponse.json({
    id: course._id.toString(),
    title: course.title,
    description: course.description,
    coverImage: course.coverImage,
    price: course.price,
    active: course.active,
    durationInMonths: course.durationInMonths,
    totalSessions: course.totalSessions,
    category: course.category,
    content,
    moduleCount: course.moduleCount,
    createdAt: course.createdAt,
  })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin')
  const { id } = await params
  const body = await req.json()
  await connectToDatabase()

  const course = await Course.findById(id)
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  if (body.title !== undefined) course.title = body.title
  if (body.description !== undefined) course.description = body.description
  if (body.coverImage !== undefined) course.coverImage = body.coverImage
  if (body.price !== undefined) course.price = body.price
  if (body.active !== undefined) course.active = body.active
  if (body.durationInMonths !== undefined) course.durationInMonths = body.durationInMonths
  if (body.totalSessions !== undefined) course.totalSessions = body.totalSessions
  if (body.category !== undefined) course.category = body.category

  if (body.content !== undefined) {
    const content = body.content as Record<string, unknown>[]
    course.moduleCount = content.length
    await CourseContent.findOneAndUpdate(
      { courseId: id },
      { courseId: id, content },
      { upsert: true }
    )
  }

  const saved = await course.save()

  let savedContent = null
  const courseContent = await CourseContent.findOne({ courseId: id }).lean()
  if (courseContent) savedContent = courseContent.content

  return NextResponse.json({
    id: saved._id.toString(),
    title: saved.title,
    description: saved.description,
    coverImage: saved.coverImage,
    price: saved.price,
    active: saved.active,
    durationInMonths: saved.durationInMonths,
    totalSessions: saved.totalSessions,
    category: saved.category,
    content: savedContent,
    moduleCount: saved.moduleCount,
    createdAt: saved.createdAt,
  })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin')
  const { id } = await params
  await connectToDatabase()
  const course = await Course.findByIdAndDelete(id)
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  await CourseContent.deleteOne({ courseId: id })
  return NextResponse.json({ success: true })
}
