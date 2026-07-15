import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'
import Course from '@/models/Course'
import Guild from '@/models/Guild'
import Category from '@/models/Category'

export async function GET() {
  await requireRole('admin')
  await connectToDatabase()

  const [users, courses, guilds, categoryCount] = await Promise.all([
    User.find().select('-password').sort({ createdAt: -1 }).limit(100).lean(),
    Course.find().select('-content').sort({ createdAt: -1 }).limit(100).lean(),
    Guild.find().populate('courseId', 'title').populate('instructorId', 'name').populate('studentIds', 'name').sort({ createdAt: -1 }).limit(100).lean(),
    Category.countDocuments(),
  ])

  return NextResponse.json({
    categoryCount,
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
        price: c.price,
        active: c.active,
        durationInMonths: c.durationInMonths,
        totalSessions: c.totalSessions,
        category: c.category,
        createdAt: c.createdAt,
      })),
      guilds: guilds.map((g) => ({
        id: (g._id as { toString(): string }).toString(),
        name: (g as { name: string }).name,
        courseId: ((g as { courseId: { _id?: { toString(): string }; toString(): string } | null }).courseId?._id?.toString() ?? (g as { courseId: { toString(): string } | null }).courseId?.toString()),
        course: (g as { courseId: unknown }).courseId,
        instructorId: ((g as { instructorId: { _id?: { toString(): string }; toString(): string } | null }).instructorId?._id?.toString() ?? (g as { instructorId: { toString(): string } | null }).instructorId?.toString()),
        instructor: (g as { instructorId: unknown }).instructorId,
        studentIds: ((g as { studentIds?: unknown[] }).studentIds ?? []).map((s) => ((s as { _id?: { toString(): string }; toString(): string })._id?.toString() ?? (s as { toString(): string }).toString())),
        students: (g as { studentIds?: unknown[] }).studentIds ?? [],
        currentSession: (g as { currentSession: number }).currentSession,
        skillsTotal: (g as { skillsTotal: number }).skillsTotal,
        skillsAchieved: (g as { skillsAchieved: number }).skillsAchieved,
      })),
    },
  )
}