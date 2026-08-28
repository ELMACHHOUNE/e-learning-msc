import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { auth } from '@/lib/auth'
import Course from '@/models/Course'
import Guild from '@/models/Guild'

export async function GET() {
  await connectToDatabase()

  const session = await auth()
  const user = session?.user

  if (!user) {
    return NextResponse.json([])
  }

  let courseIds: string[] = []

  if (user.role === 'admin') {
    const courses = await Course.find({ active: { $ne: false } })
      .select('_id')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
    courseIds = courses.map((c) => c._id.toString())
  } else if (user.role === 'instructor') {
    const guilds = await Guild.find({ instructorId: user.id })
      .select('courseId')
      .lean()
    courseIds = [...new Set(guilds.map((g) => g.courseId.toString()))]
  } else if (user.role === 'student') {
    const guilds = await Guild.find({ studentIds: user.id })
      .select('courseId')
      .lean()
    courseIds = [...new Set(guilds.map((g) => g.courseId.toString()))]
  }

  if (courseIds.length === 0) {
    return NextResponse.json([])
  }

  const courses = await Course.find({ _id: { $in: courseIds }, active: { $ne: false } })
    .select('title description durationInMonths totalSessions')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()

  return NextResponse.json(
    courses.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      description: c.description,
      durationInMonths: c.durationInMonths,
      totalSessions: c.totalSessions,
    }))
  )
}
