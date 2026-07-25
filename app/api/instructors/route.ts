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
    .limit(100)
    .lean()

  const instructorIds = instructors.map((inst) => inst._id.toString())
  const guilds = await Guild.find({ instructorId: { $in: instructorIds } })
    .populate('courseId', 'title')
    .lean()

  const guildMap: Record<string, typeof guilds> = {}
  for (const g of guilds) {
    const iid = (g.instructorId as { toString(): string }).toString()
    if (!guildMap[iid]) guildMap[iid] = []
    guildMap[iid].push(g)
  }

  const enriched = instructors.map((inst) => {
    const id = inst._id.toString()
    const instGuilds = guildMap[id] ?? []
    const totalStudents = new Set(
      instGuilds.flatMap((g) => ((g as { studentIds?: unknown[] }).studentIds ?? []).map((sid) => (sid as { toString(): string }).toString()))
    ).size

    return {
      id,
      name: (inst as { name: string }).name,
      email: (inst as { email: string }).email,
      phone: (inst as { phone?: string }).phone,
      avatar: (inst as { avatar?: string }).avatar,
      role: (inst as { role: string }).role,
      createdAt: (inst as { createdAt: Date }).createdAt,
      guilds: instGuilds.map((g) => ({
        id: (g._id as { toString(): string }).toString(),
        name: (g as { name: string }).name,
        courseTitle: (g.courseId as { title?: string })?.title ?? 'Unknown',
        studentCount: ((g as { studentIds?: unknown[] }).studentIds ?? []).length,
      })),
      totalStudents,
      totalGuilds: instGuilds.length,
    }
  })

  return NextResponse.json({ instructors: enriched })
}
