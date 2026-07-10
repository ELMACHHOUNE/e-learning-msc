import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'
import Course from '@/models/Course'
import Guild from '@/models/Guild'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const role = (session.user as any).role

  await connectToDatabase()

  if (role === 'admin') {
    const [totalUsers, totalInstructors, totalStudents, totalCourses, totalGuilds, users, guilds] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'instructor' }),
      User.countDocuments({ role: 'student' }),
      Course.countDocuments(),
      Guild.countDocuments(),
      User.find().select('name email role').sort({ createdAt: -1 }).limit(5).lean(),
      Guild.find()
        .populate('courseId', 'title')
        .populate('instructorId', 'name')
        .sort({ createdAt: -1 }).limit(5).lean(),
    ])

    return NextResponse.json({
      role: 'admin',
      stats: { totalUsers, totalInstructors, totalStudents, totalCourses, totalGuilds },
      recentUsers: users.map((u: any) => ({ id: u._id.toString(), name: u.name, email: u.email, role: u.role })),
      recentGuilds: guilds.map((g: any) => ({
        id: g._id.toString(),
        name: g.name,
        courseTitle: (g.courseId as any)?.title ?? 'Unknown',
        instructorName: (g.instructorId as any)?.name ?? 'Unknown',
        studentCount: (g.studentIds ?? []).length,
      })),
    })
  }

  if (role === 'instructor') {
    const guilds = await Guild.find({ instructorId: userId })
      .populate('courseId', 'title totalSessions')
      .lean()
    const totalStudents = guilds.reduce((sum: number, g: any) => sum + (g.studentIds ?? []).length, 0)
    const totalSessions = guilds.reduce((sum: number, g: any) => sum + g.currentSession, 0)
    const courses = [...new Set(guilds.map((g: any) => (g.courseId as any)?._id?.toString()).filter(Boolean))]

    return NextResponse.json({
      role: 'instructor',
      stats: { totalGuilds: guilds.length, totalStudents, totalSessions, totalCourses: courses.length },
      guilds: guilds.map((g: any) => ({
        id: g._id.toString(),
        name: g.name,
        courseTitle: (g.courseId as any)?.title ?? 'Unknown',
        currentSession: g.currentSession,
        totalSessions: (g.courseId as any)?.totalSessions ?? 0,
        skillsTotal: g.skillsTotal,
        skillsAchieved: g.skillsAchieved,
        studentCount: (g.studentIds ?? []).length,
      })),
    })
  }

  // student
  const guilds = await Guild.find({ studentIds: userId })
    .populate('courseId', 'title totalSessions')
    .populate('instructorId', 'name')
    .lean()
  const courses = [...new Set(guilds.map((g: any) => (g.courseId as any)?._id?.toString()).filter(Boolean))]

  return NextResponse.json({
    role: 'student',
    stats: { totalGuilds: guilds.length, totalCourses: courses.length },
    guilds: guilds.map((g: any) => ({
      id: g._id.toString(),
      name: g.name,
      courseTitle: (g.courseId as any)?.title ?? 'Unknown',
      instructorName: (g.instructorId as any)?.name ?? 'Unknown',
      currentSession: g.currentSession,
      totalSessions: (g.courseId as any)?.totalSessions ?? 0,
      skillsTotal: g.skillsTotal,
      skillsAchieved: g.skillsAchieved,
    })),
  })
}