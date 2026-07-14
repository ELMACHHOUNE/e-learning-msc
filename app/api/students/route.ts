import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'
import Guild from '@/models/Guild'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const role = (session.user as any).role

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
      students.map(async (s: any) => {
        const guilds = await Guild.find({ studentIds: s._id })
          .populate('courseId', 'title')
          .populate('instructorId', 'name')
          .lean()

        return {
          id: s._id.toString(),
          name: s.name,
          email: s.email,
          phone: s.phone,
          avatar: s.avatar,
          role: s.role,
          createdAt: s.createdAt,
          guilds: guilds.map((g: any) => ({
            id: g._id.toString(),
            name: g.name,
            courseTitle: (g.courseId as any)?.title ?? 'Unknown',
            instructorName: (g.instructorId as any)?.name ?? 'Unknown',
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

  const studentIds = [...new Set(guilds.flatMap((g: any) => (g.studentIds ?? []).map((id: any) => id.toString())))]

  const students = await User.find({ _id: { $in: studentIds }, role: 'student' })
    .select('-password')
    .sort({ createdAt: -1 })
    .lean()

  const studentMap = new Map(students.map((s: any) => [s._id.toString(), s]))

  const enriched = studentIds.map((id) => {
    const s: any = studentMap.get(id)
    if (!s) return null
    const studentGuilds = guilds.filter((g: any) =>
      (g.studentIds ?? []).some((sid: any) => sid.toString() === id)
    )
    return {
      id: s._id.toString(),
      name: s.name,
      email: s.email,
      phone: s.phone,
      avatar: s.avatar,
      role: s.role,
      createdAt: s.createdAt,
      guilds: studentGuilds.map((g: any) => ({
        id: g._id.toString(),
        name: g.name,
        courseTitle: (g.courseId as any)?.title ?? 'Unknown',
      })),
    }
  }).filter(Boolean)

  return NextResponse.json({ students: enriched })
}
