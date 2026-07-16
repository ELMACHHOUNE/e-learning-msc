import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'
import Course from '@/models/Course'
import Guild from '@/models/Guild'
import Category from '@/models/Category'
import LabPhase from '@/models/LabPhase'

type Tab = 'users' | 'courses' | 'guilds' | 'categories' | 'messages'

export async function GET(req: Request) {
  await requireRole('admin')
  await connectToDatabase()

  const { searchParams } = new URL(req.url)
  const tab = searchParams.get('tab') as Tab | null
  const data: Record<string, unknown> = {}

  if (!tab || tab === 'users') {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
    data.users = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone,
      avatar: u.avatar,
      role: u.role,
      createdAt: u.createdAt,
    }))
  }

  if (!tab || tab === 'courses') {
    const courses = await Course.find()
      .select('-content')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
    data.courses = courses.map((c) => ({
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
    }))
  }

  if (!tab || tab === 'guilds') {
    const guilds = await Guild.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'instructorId',
          foreignField: '_id',
          as: 'instructor',
        },
      },
      { $unwind: { path: '$instructor', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'studentIds',
          foreignField: '_id',
          as: 'students',
        },
      },
    ])
    data.guilds = guilds.map((g: Record<string, unknown>) => ({
      id: (g._id as { toString(): string }).toString(),
      name: g.name as string,
      courseId: ((g.course as Record<string, unknown>)?._id as { toString(): string })?.toString() ?? null,
      course: g.course,
      instructorId: ((g.instructor as Record<string, unknown>)?._id as { toString(): string })?.toString() ?? null,
      instructor: g.instructor,
      studentIds: ((g.students as Record<string, unknown>[]) ?? []).map((s) => (s._id as { toString(): string }).toString()),
      students: g.students as Record<string, unknown>[],
      currentSession: g.currentSession as number,
      skillsTotal: g.skillsTotal as number,
      skillsAchieved: g.skillsAchieved as number,
    }))
  }

  if (!tab || tab === 'categories') {
    const [categories, courseCounts, labPhaseCounts] = await Promise.all([
      Category.find().sort({ name: 1 }).lean(),
      Course.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      LabPhase.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    ])
    const countMap: Record<string, { courses: number; labPhases: number }> = {}
    for (const c of courseCounts) {
      if (c._id) countMap[c._id as string] = { ...countMap[c._id as string], courses: c.count as number }
    }
    for (const l of labPhaseCounts) {
      if (l._id) countMap[l._id as string] = { ...countMap[l._id as string], labPhases: l.count as number }
    }
    data.categories = categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      courses: countMap[c.name]?.courses ?? 0,
      labPhases: countMap[c.name]?.labPhases ?? 0,
      createdAt: c.createdAt,
    }))
  }

  return NextResponse.json(data)
}