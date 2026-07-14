import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'
import Guild from '@/models/Guild'

export async function GET() {
  await requireRole('admin')
  await connectToDatabase()

  const instructors = await User.find({ role: 'instructor' })
    .select('-password')
    .sort({ createdAt: -1 })
    .lean()

  const enriched = await Promise.all(
    instructors.map(async (inst: any) => {
      const guilds = await Guild.find({ instructorId: inst._id })
        .populate('courseId', 'title')
        .lean()

      const totalStudents = new Set(
        guilds.flatMap((g: any) => (g.studentIds ?? []).map((id: any) => id.toString()))
      ).size

      return {
        id: inst._id.toString(),
        name: inst.name,
        email: inst.email,
        phone: inst.phone,
        avatar: inst.avatar,
        role: inst.role,
        createdAt: inst.createdAt,
        guilds: guilds.map((g: any) => ({
          id: g._id.toString(),
          name: g.name,
          courseTitle: (g.courseId as any)?.title ?? 'Unknown',
          studentCount: (g.studentIds ?? []).length,
        })),
        totalStudents,
        totalGuilds: guilds.length,
      }
    })
  )

  return NextResponse.json({ instructors: enriched })
}
