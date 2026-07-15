import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'
import Guild from '@/models/Guild'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role

  if (role !== 'admin' && role !== 'instructor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectToDatabase()

  if (role === 'admin') {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean()

    const enriched = await Promise.all(
      students.map(async (s) => {
        const guilds = await Guild.find({ studentIds: (s._id as { toString(): string }).toString() })
          .populate('courseId', 'title')
          .populate('instructorId', 'name')
          .lean()

        return {
          id: (s._id as { toString(): string }).toString(),
          name: (s as { name: string }).name,
          email: (s as { email: string }).email,
          phone: (s as { phone?: string }).phone,
          avatar: (s as { avatar?: string }).avatar,
          role: (s as { role: string }).role,
          createdAt: (s as { createdAt: Date }).createdAt,
          guilds: guilds.map((g) => ({
            id: (g._id as { toString(): string }).toString(),
            name: (g as { name: string }).name,
            courseTitle: (g.courseId as { title?: string })?.title ?? 'Unknown',
            instructorName: (g.instructorId as { name?: string })?.name ?? 'Unknown',
          })),
        }
      })
    )

    return NextResponse.json({ students: enriched })
  }

  // instructor
  const guilds = await Guild.find({ instructorId: userId })
    .populate('courseId', 'title')
    .lean()

  const studentIds = [...new Set(guilds.flatMap((g) => ((g as { studentIds?: unknown[] }).studentIds ?? []).map((id) => (id as { toString(): string }).toString())))]

  const students = await User.find({ _id: { $in: studentIds }, role: 'student' })
    .select('-password')
    .sort({ createdAt: -1 })
    .lean()

  const studentMap = new Map(students.map((s) => [(s._id as { toString(): string }).toString(), s]))

  const enriched = studentIds.map((id) => {
    const s = studentMap.get(id)
    if (!s) return null
    const studentGuilds = guilds.filter((g) =>
      ((g as { studentIds?: unknown[] }).studentIds ?? []).some((sid) => (sid as { toString(): string }).toString() === id)
    )
    return {
      id: (s._id as { toString(): string }).toString(),
      name: (s as { name: string }).name,
      email: (s as { email: string }).email,
      phone: (s as { phone?: string }).phone,
      avatar: (s as { avatar?: string }).avatar,
      role: (s as { role: string }).role,
      createdAt: (s as { createdAt: Date }).createdAt,
      guilds: studentGuilds.map((g) => ({
        id: (g._id as { toString(): string }).toString(),
        name: (g as { name: string }).name,
        courseTitle: (g.courseId as { title?: string })?.title ?? 'Unknown',
      })),
    }
  }).filter(Boolean)

  return NextResponse.json({ students: enriched })
}
