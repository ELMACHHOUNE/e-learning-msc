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
    const [
      totalUsers, totalInstructors, totalStudents, totalCourses, totalGuilds,
      users, guilds,
      usersByRoleAgg, coursesByCategoryAgg, courseStatusAgg, guildsByCourseAgg,
    ] = await Promise.all([
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
      User.aggregate([
        { $group: { _id: '$role', value: { $sum: 1 } } },
        { $project: { name: '$_id', value: 1, _id: 0 } },
      ]),
      Course.aggregate([
        { $match: { category: { $exists: true, $nin: [null, ''] } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $project: { name: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
      Course.aggregate([
        {
          $group: {
            _id: null,
            active: { $sum: { $cond: [{ $or: [{ $eq: ['$active', true] }, { $eq: ['$active', undefined] }] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ['$active', false] }, 1, 0] } },
          },
        },
        { $project: { _id: 0 } },
      ]),
      Guild.aggregate([
        { $group: { _id: '$courseId', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'courses',
            localField: '_id',
            foreignField: '_id',
            as: 'course',
          },
        },
        { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            course: { $ifNull: ['$course.title', 'Unknown'] },
            count: 1,
            _id: 0,
          },
        },
        { $sort: { count: -1 } },
      ]),
    ])

    const courseStatus = courseStatusAgg[0] ?? { active: totalCourses, inactive: 0 }

    return NextResponse.json({
      role: 'admin',
      stats: { totalUsers, totalInstructors, totalStudents, totalCourses, totalGuilds },
      charts: {
        usersByRole: usersByRoleAgg.map((r: any) => ({ name: r.name.charAt(0).toUpperCase() + r.name.slice(1), value: r.value })),
        coursesByCategory: coursesByCategoryAgg,
        courseStatus: [
          { name: 'Active', value: courseStatus.active },
          { name: 'Inactive', value: courseStatus.inactive },
        ],
        guildsByCourse: guildsByCourseAgg.map((g: any) => ({ name: g.course, value: g.count })),
      },
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
      .populate('courseId', 'title totalSessions active category')
      .lean()
    const activeGuilds = guilds.filter((g: any) => (g.courseId as any)?.active !== false)
    const totalStudents = activeGuilds.reduce((sum: number, g: any) => sum + (g.studentIds ?? []).length, 0)
    const totalSessions = activeGuilds.reduce((sum: number, g: any) => sum + g.currentSession, 0)
    const courses = [...new Set(activeGuilds.map((g: any) => (g.courseId as any)?._id?.toString()).filter(Boolean))]

    return NextResponse.json({
      role: 'instructor',
      stats: { totalGuilds: activeGuilds.length, totalStudents, totalSessions, totalCourses: courses.length },
      guilds: activeGuilds.map((g: any) => ({
        id: g._id.toString(),
        name: g.name,
        courseTitle: (g.courseId as any)?.title ?? 'Unknown',
        currentSession: g.currentSession,
        totalSessions: (g.courseId as any)?.totalSessions ?? 0,
        courseCategory: (g.courseId as any)?.category ?? '',
        skillsTotal: g.skillsTotal,
        skillsAchieved: g.skillsAchieved,
        studentCount: (g.studentIds ?? []).length,
      })),
    })
  }

  // student
  const guilds = await Guild.find({ studentIds: userId })
    .populate('courseId', 'title totalSessions active category')
    .populate('instructorId', 'name')
    .lean()
  const activeGuilds = guilds.filter((g: any) => (g.courseId as any)?.active !== false)
  const courses = [...new Set(activeGuilds.map((g: any) => (g.courseId as any)?._id?.toString()).filter(Boolean))]

  return NextResponse.json({
    role: 'student',
    stats: { totalGuilds: activeGuilds.length, totalCourses: courses.length },
    guilds: activeGuilds.map((g: any) => ({
      id: g._id.toString(),
      name: g.name,
      courseTitle: (g.courseId as any)?.title ?? 'Unknown',
      instructorName: (g.instructorId as any)?.name ?? 'Unknown',
      currentSession: g.currentSession,
      totalSessions: (g.courseId as any)?.totalSessions ?? 0,
      courseCategory: (g.courseId as any)?.category ?? '',
      skillsTotal: g.skillsTotal,
      skillsAchieved: g.skillsAchieved,
    })),
  })
}