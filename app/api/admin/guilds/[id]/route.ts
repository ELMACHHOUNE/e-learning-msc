import { NextResponse } from 'next/server'
import { authenticate } from '@/lib/api-auth'
import { connectToDatabase } from '@/lib/db'
import { isObjectId } from '@/lib/utils'
import Guild from '@/models/Guild'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await authenticate('admin')
  if (!guard.ok) return guard.response
  const { id } = await params
  if (!isObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  await connectToDatabase()

  const update: Record<string, unknown> = {}
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    }
    update.name = body.name.trim()
  }
  if (body.courseId !== undefined) {
    if (!isObjectId(body.courseId)) {
      return NextResponse.json({ error: 'Invalid course id' }, { status: 400 })
    }
    update.courseId = body.courseId
  }
  if (body.instructorId !== undefined) {
    if (!isObjectId(body.instructorId)) {
      return NextResponse.json({ error: 'Invalid instructor id' }, { status: 400 })
    }
    update.instructorId = body.instructorId
  }
  if (body.studentIds !== undefined) {
    if (!Array.isArray(body.studentIds) || !body.studentIds.every((sid: unknown) => isObjectId(sid))) {
      return NextResponse.json({ error: 'Invalid student id' }, { status: 400 })
    }
    update.studentIds = body.studentIds
  }
  if (body.currentSession !== undefined) {
    if (!Number.isInteger(body.currentSession) || body.currentSession < 0) {
      return NextResponse.json({ error: 'Invalid session number' }, { status: 400 })
    }
    update.currentSession = body.currentSession
  }
  if (body.skillsTotal !== undefined) {
    if (!Number.isInteger(body.skillsTotal) || body.skillsTotal < 0) {
      return NextResponse.json({ error: 'Invalid skills total' }, { status: 400 })
    }
    update.skillsTotal = body.skillsTotal
  }
  if (body.skillsAchieved !== undefined) {
    if (!Number.isInteger(body.skillsAchieved) || body.skillsAchieved < 0) {
      return NextResponse.json({ error: 'Invalid skills achieved' }, { status: 400 })
    }
    update.skillsAchieved = body.skillsAchieved
  }

  const guild = await Guild.findByIdAndUpdate(id, update, { new: true, runValidators: true })
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })
  return NextResponse.json({ id: guild._id.toString(), name: guild.name })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await authenticate('admin')
  if (!guard.ok) return guard.response
  const { id } = await params
  if (!isObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  await connectToDatabase()
  const guild = await Guild.findByIdAndDelete(id)
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
