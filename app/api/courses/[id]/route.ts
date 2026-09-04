import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { auth } from '@/lib/auth'
import Course from '@/models/Course'
import CourseContent from '@/models/CourseContent'
import Guild from '@/models/Guild'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase()

  const session = await auth()
  const user = session?.user

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Check if user has access to this course
  let hasAccess = false
  if (user.role === 'admin') {
    hasAccess = true
  } else if (user.role === 'instructor') {
    const guild = await Guild.findOne({ courseId: id, instructorId: user.id }).lean()
    hasAccess = !!guild
  } else if (user.role === 'student') {
    const guild = await Guild.findOne({ courseId: id, studentIds: user.id }).lean()
    hasAccess = !!guild
  }

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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