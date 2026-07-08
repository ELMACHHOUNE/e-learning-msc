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
    const totalUsers = await User.countDocuments()
    const totalInstructors = await User.countDocuments({ role: 'instructor' })
    const totalStudents = await User.countDocuments({ role: 'student' })
    const totalCourses = await Course.countDocuments()
    const totalGuilds = await Guild.countDocuments()
    const users = await User.find().select('-password').sort({ createdAt: -1 }).limit(5)
    const guilds = await Guild.find().populate('courseId instructorId').sort({ createdAt: -1 }).limit(5)

    return NextResponse.json({
      role: 'admin',
      stats: { totalUsers, totalInstructors, totalStudents, totalCourses, totalGuilds },
      recentUsers: users.map((u) => ({ id: u._id.toString(), name: u.name, email: u.email, role: u.role, avatar: u.avatar })),
      recentGuilds: guilds.map((g) => ({
        id: g._id.toString(),
        name: g.name,
        courseTitle: (g.courseId as any)?.title ?? 'Unknown',
        instructorName: (g.instructorId as any)?.name ?? 'Unknown',
        studentCount: (g.studentIds ?? []).length,
      })),
    })
  }

  if (role === 'instructor') {
    const guilds = await Guild.find({ instructorId: userId }).populate('courseId studentIds')
    const totalStudents = guilds.reduce((sum, g) => sum + (g.studentIds ?? []).length, 0)
    const totalSessions = guilds.reduce((sum, g) => sum + g.currentSession, 0)
    const courses = await Course.find({ _id: { $in: guilds.map((g) => g.courseId) } })

    return NextResponse.json({
      role: 'instructor',
      stats: { totalGuilds: guilds.length, totalStudents, totalSessions, totalCourses: courses.length },
      guilds: guilds.map((g) => ({
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
  const guilds = await Guild.find({ studentIds: userId }).populate('courseId instructorId')
  const courses = [...new Set(guilds.map((g) => (g.courseId as any)?._id?.toString()).filter(Boolean))]

  return NextResponse.json({
    role: 'student',
    stats: { totalGuilds: guilds.length, totalCourses: courses.length },
    guilds: guilds.map((g) => ({
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