import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'
import Course from '@/models/Course'
import Guild from '@/models/Guild'

export async function GET() {
  await requireRole('admin')
  await connectToDatabase()

  const [users, courses, guilds] = await Promise.all([
    User.find().select('-password').sort({ createdAt: -1 }).lean(),
    Course.find().sort({ createdAt: -1 }).lean(),
    Guild.find().populate('courseId', 'title').populate('instructorId', 'name').populate('studentIds', 'name').sort({ createdAt: -1 }).lean(),
  ])

  return NextResponse.json(
    {
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone,
        avatar: u.avatar,
        role: u.role,
        createdAt: u.createdAt,
      })),
      courses: courses.map((c) => ({
        id: c._id.toString(),
        title: c.title,
        description: c.description,
        coverImage: c.coverImage,
        durationInMonths: c.durationInMonths,
        totalSessions: c.totalSessions,
        content: c.content,
        createdAt: c.createdAt,
      })),
      guilds: guilds.map((g: any) => ({
        id: g._id.toString(),
        name: g.name,
        courseId: g.courseId?._id?.toString() ?? g.courseId?.toString(),
        course: g.courseId,
        instructorId: g.instructorId?._id?.toString() ?? g.instructorId?.toString(),
        instructor: g.instructorId,
        studentIds: (g.studentIds ?? []).map((s: any) => s._id?.toString() ?? s.toString()),
        students: g.studentIds ?? [],
        currentSession: g.currentSession,
        skillsTotal: g.skillsTotal,
        skillsAchieved: g.skillsAchieved,
      })),
    },
  )
}