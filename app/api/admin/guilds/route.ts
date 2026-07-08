import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Guild from '@/models/Guild'

export async function GET() {
  await requireRole('admin')
  await connectToDatabase()
  const guilds = await Guild.find().populate('courseId instructorId studentIds').sort({ createdAt: -1 })
  return NextResponse.json(guilds.map((g) => ({
    id: g._id.toString(),
    name: g.name,
    courseId: g.courseId?._id?.toString() ?? g.courseId?.toString(),
    course: g.courseId,
    instructorId: g.instructorId?._id?.toString() ?? g.instructorId?.toString(),
    instructor: g.instructorId,
    studentIds: (g.studentIds ?? []).map((s: any) => s._id?.toString() ?? s.toString()),
    students: g.studentIds ?? [],
    currentSession: g.currentSession,
    skillsTotal: g.skillsTotal,
    skillsAchieved: g.skillsAchieved,
  })))
}

export async function POST(req: Request) {
  await requireRole('admin')
  const body = await req.json()
  const { name, courseId, instructorId, studentIds } = body
  if (!name || !courseId || !instructorId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  await connectToDatabase()
  const guild = await Guild.create({ name, courseId, instructorId, studentIds: studentIds ?? [] })
  return NextResponse.json({ id: guild._id.toString(), name: guild.name })
}
