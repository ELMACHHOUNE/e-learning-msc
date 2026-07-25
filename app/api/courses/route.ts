import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Course from '@/models/Course'

export async function GET() {
  await connectToDatabase()
  const courses = await Course.find({ active: { $ne: false } })
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
