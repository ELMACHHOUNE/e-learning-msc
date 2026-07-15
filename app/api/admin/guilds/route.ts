import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Guild from '@/models/Guild'

export async function GET() {
  await requireRole('admin')
  await connectToDatabase()
  const guilds = await Guild.find().populate('courseId instructorId studentIds').sort({ createdAt: -1 })
  return NextResponse.json(guilds.map((g) => ({
    id: (g._id as { toString(): string }).toString(),
    name: (g as { name: string }).name,
    courseId: ((g as unknown as { courseId: { _id?: { toString(): string }; toString(): string } }).courseId?._id?.toString() ?? (g as unknown as { courseId: { toString(): string } }).courseId?.toString()),
    course: (g as unknown as { courseId: unknown }).courseId,
    instructorId: ((g as unknown as { instructorId: { _id?: { toString(): string }; toString(): string } }).instructorId?._id?.toString() ?? (g as unknown as { instructorId: { toString(): string } }).instructorId?.toString()),
    instructor: (g as unknown as { instructorId: unknown }).instructorId,
    studentIds: ((g as unknown as { studentIds?: unknown[] }).studentIds ?? []).map((s) => ((s as { _id?: { toString(): string }; toString(): string })._id?.toString() ?? (s as { toString(): string }).toString())),
    students: (g as unknown as { studentIds?: unknown[] }).studentIds ?? [],
    currentSession: (g as unknown as { currentSession: number }).currentSession,
    skillsTotal: (g as unknown as { skillsTotal: number }).skillsTotal,
    skillsAchieved: (g as unknown as { skillsAchieved: number }).skillsAchieved,
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
