import { NextResponse } from 'next/server'
import { authenticate } from '@/lib/api-auth'
import { connectToDatabase } from '@/lib/db'
import Guild from '@/models/Guild'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await authenticate('admin')
  if (!guard.ok) return guard.response
  const { id } = await params
  const body = await req.json()
  await connectToDatabase()

  const update: Record<string, unknown> = {}
  if (body.name !== undefined) update.name = body.name
  if (body.courseId !== undefined) update.courseId = body.courseId
  if (body.instructorId !== undefined) update.instructorId = body.instructorId
  if (body.studentIds !== undefined) update.studentIds = body.studentIds
  if (body.currentSession !== undefined) update.currentSession = body.currentSession
  if (body.skillsTotal !== undefined) update.skillsTotal = body.skillsTotal
  if (body.skillsAchieved !== undefined) update.skillsAchieved = body.skillsAchieved

  const guild = await Guild.findByIdAndUpdate(id, update, { new: true })
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })
  return NextResponse.json({ id: guild._id.toString(), name: guild.name })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await authenticate('admin')
  if (!guard.ok) return guard.response
  const { id } = await params
  await connectToDatabase()
  const guild = await Guild.findByIdAndDelete(id)
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
