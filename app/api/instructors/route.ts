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
    instructors.map(async (inst) => {
      const guilds = await Guild.find({ instructorId: (inst._id as { toString(): string }).toString() })
        .populate('courseId', 'title')
        .lean()

      const totalStudents = new Set(
        guilds.flatMap((g) => ((g as { studentIds?: unknown[] }).studentIds ?? []).map((id) => (id as { toString(): string }).toString()))
      ).size

      return {
        id: (inst._id as { toString(): string }).toString(),
        name: (inst as { name: string }).name,
        email: (inst as { email: string }).email,
        phone: (inst as { phone?: string }).phone,
        avatar: (inst as { avatar?: string }).avatar,
        role: (inst as { role: string }).role,
        createdAt: (inst as { createdAt: Date }).createdAt,
        guilds: guilds.map((g) => ({
          id: (g._id as { toString(): string }).toString(),
          name: (g as { name: string }).name,
          courseTitle: (g.courseId as { title?: string })?.title ?? 'Unknown',
          studentCount: ((g as { studentIds?: unknown[] }).studentIds ?? []).length,
        })),
        totalStudents,
        totalGuilds: guilds.length,
      }
    })
  )

  return NextResponse.json({ instructors: enriched })
}
