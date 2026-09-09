import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import SessionLog from '@/models/SessionLog'
import Guild from '@/models/Guild'

const VALID_STATUSES = ['present', 'absent', 'late']

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'instructor' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid session id' }, { status: 400 })
  }

  const body = (await req.json()) as {
    title?: string
    link?: string
    date?: string
    sessionNumber?: number
    records?: { studentId: string; status: string }[]
  }

  await connectToDatabase()

  const log = await SessionLog.findById(id)
  if (!log) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const guild = await Guild.findById(log.guildId)
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })

  if (session.user.role === 'instructor' && String(guild.instructorId) !== session.user.id) {
    return NextResponse.json({ error: 'Not your guild' }, { status: 403 })
  }

  if (body.title !== undefined) {
    if (typeof body.title !== 'string') return NextResponse.json({ error: 'Invalid title' }, { status: 400 })
    log.title = body.title.trim() || undefined
  }

  if (body.link !== undefined) {
    if (typeof body.link !== 'string') return NextResponse.json({ error: 'Invalid link' }, { status: 400 })
    log.link = body.link.trim() || undefined
  }

  if (body.date !== undefined) {
    if (!body.date || Number.isNaN(new Date(body.date).getTime())) {
      return NextResponse.json({ error: 'Valid date is required' }, { status: 400 })
    }
    log.date = new Date(body.date)
  }

  if (body.sessionNumber !== undefined) {
    const n = body.sessionNumber
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 1) {
      return NextResponse.json({ error: 'Session number must be a positive integer' }, { status: 400 })
    }

    const populated = await Guild.findById(guild._id).populate('courseId', 'totalSessions').lean() as {
      courseId?: { totalSessions?: number }
    } | null
    const totalSessions = populated?.courseId?.totalSessions ?? 0
    if (totalSessions > 0 && n > totalSessions) {
      return NextResponse.json({ error: `Session number cannot exceed ${totalSessions}` }, { status: 400 })
    }

    const clash = await SessionLog.findOne({ guildId: guild._id, sessionNumber: n, _id: { $ne: log._id } })
    if (clash) {
      return NextResponse.json({ error: `Session ${n} already exists for this guild` }, { status: 409 })
    }
    log.sessionNumber = n
  }

  if (body.records !== undefined) {
    if (!Array.isArray(body.records)) {
      return NextResponse.json({ error: 'records must be an array' }, { status: 400 })
    }
    const allowedIds = new Set((guild.studentIds ?? []).map((s) => String(s)))
    const seen = new Set<string>()
    const records: { studentId: mongoose.Types.ObjectId; status: 'present' | 'absent' | 'late' }[] = []
    for (const r of body.records) {
      if (!r || !mongoose.Types.ObjectId.isValid(r.studentId) || !VALID_STATUSES.includes(r.status)) {
        return NextResponse.json({ error: 'Invalid attendance record' }, { status: 400 })
      }
      if (seen.has(r.studentId)) continue
      if (!allowedIds.has(r.studentId)) {
        return NextResponse.json({ error: 'Record references a student not in this guild' }, { status: 400 })
      }
      seen.add(r.studentId)
      records.push({
        studentId: new mongoose.Types.ObjectId(r.studentId),
        status: r.status as 'present' | 'absent' | 'late',
      })
    }
    log.records = records as never
  }

  await log.save()

  // Attendance recorded -> advance the guild's session progress
  if (body.records !== undefined && log.records.length > 0) {
    if (guild.currentSession < log.sessionNumber) {
      guild.currentSession = log.sessionNumber
      await guild.save()
    }
  }

  return NextResponse.json({
    success: true,
    session: {
      id: String(log._id),
      guildId: String(log.guildId),
      sessionNumber: log.sessionNumber,
      title: log.title ?? `Session ${log.sessionNumber}`,
      date: log.date,
      link: log.link ?? '',
      records: (log.records ?? []).map((r) => ({
        studentId: String(r.studentId),
        status: r.status,
      })),
      hasAttendance: (log.records ?? []).length > 0,
    },
  })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'instructor' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid session id' }, { status: 400 })
  }

  await connectToDatabase()

  const log = await SessionLog.findById(id)
  if (!log) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const guild = await Guild.findById(log.guildId)
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })

  if (session.user.role === 'instructor' && String(guild.instructorId) !== session.user.id) {
    return NextResponse.json({ error: 'Not your guild' }, { status: 403 })
  }

  await log.deleteOne()

  return NextResponse.json({ success: true })
}

export const runtime = 'nodejs'