import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import SessionLog from '@/models/SessionLog'
import Guild from '@/models/Guild'
import User from '@/models/User'

type LeanSession = {
  _id: unknown
  guildId: { toString(): string }
  sessionNumber: number
  date: Date
  title?: string
  link?: string
  records: { studentId: string; status: string }[]
}

type LeanGuild = {
  _id: unknown
  name: string
  courseId?: { _id?: { toString(): string }; title?: string; totalSessions?: number } | null
  instructorId?: { _id?: { toString(): string }; name?: string } | null
  studentIds?: unknown[]
  currentSession: number
}

function serializeSession(s: LeanSession, myStudentId?: string | null) {
  const records = (s.records ?? []).map((r) => ({
    studentId: String(r.studentId),
    status: r.status as 'present' | 'absent' | 'late',
  }))
  return {
    id: (s._id as { toString(): string }).toString(),
    guildId: String(s.guildId),
    sessionNumber: s.sessionNumber,
    title: s.title ?? `Session ${s.sessionNumber}`,
    date: s.date,
    link: s.link ?? '',
    records,
    hasAttendance: records.length > 0,
    myStatus: myStudentId
      ? records.find((r) => r.studentId === myStudentId)?.status ?? null
      : null,
  }
}

function serializeGuild(g: LeanGuild) {
  return {
    id: (g._id as { toString(): string }).toString(),
    name: g.name,
    courseId: (g.courseId as { _id?: { toString(): string } })?._id?.toString() ?? '',
    courseTitle: (g.courseId as { title?: string })?.title ?? 'Unknown',
    instructorName: (g.instructorId as { name?: string } | null)?.name ?? 'Unknown',
    totalSessions: (g.courseId as { totalSessions?: number })?.totalSessions ?? 0,
    currentSession: g.currentSession ?? 0,
    studentCount: (g.studentIds ?? []).length,
  }
}

const isObjectId = (v: string) => mongoose.Types.ObjectId.isValid(v)

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role
  const guildId = new URL(req.url).searchParams.get('guildId')

  if (guildId && !isObjectId(guildId)) {
    return NextResponse.json({ error: 'Invalid guildId' }, { status: 400 })
  }

  await connectToDatabase()

  // instructor: scoped to guilds they own
  if (role === 'instructor') {
    const guildQuery: { instructorId: string; _id?: string } = { instructorId: userId }
    if (guildId) guildQuery._id = guildId

    const guilds = (await Guild.find(guildQuery)
      .populate('courseId', 'title totalSessions')
      .populate('instructorId', 'name')
      .sort({ createdAt: -1 })
      .lean()) as unknown as LeanGuild[]

    const ids = guilds.map((g) => g._id as unknown as mongoose.Types.ObjectId)
    const logs = (await SessionLog.find({ guildId: { $in: ids } }).sort({ date: 1 }).lean()) as unknown as LeanSession[]

    let students: { id: string; name: string; avatar?: string }[] = []
    if (guildId && guilds.length === 1) {
      const rosterIds = (guilds[0]?.studentIds ?? []).map((s) => new mongoose.Types.ObjectId(String(s)))
      const roster = await User.find({ _id: { $in: rosterIds } })
        .select('name avatar')
        .lean()
      students = roster.map((s) => ({
        id: (s._id as { toString(): string }).toString(),
        name: (s as { name: string }).name,
        avatar: (s as { avatar?: string }).avatar,
      }))
    }

    return NextResponse.json({
      role,
      guilds: guilds.map(serializeGuild),
      sessions: logs.map((l) => serializeSession(l)),
      students,
    })
  }

  // student: scoped to guilds they belong to
  if (role === 'student') {
    const guilds = (await Guild.find({ studentIds: userId })
      .populate('courseId', 'title totalSessions')
      .populate('instructorId', 'name')
      .sort({ createdAt: -1 })
      .lean()) as unknown as LeanGuild[]

    const ids = guilds.map((g) => g._id as unknown as mongoose.Types.ObjectId)
    const logs = (await SessionLog.find({ guildId: { $in: ids } }).sort({ date: 1 }).lean()) as unknown as LeanSession[]

    return NextResponse.json({
      role,
      guilds: guilds.map(serializeGuild),
      sessions: logs.map((l) => serializeSession(l, userId)),
      students: [],
    })
  }

  // admin: everything
  const guilds = (await Guild.find(guildId ? { _id: guildId } : {})
    .populate('courseId', 'title totalSessions')
    .populate('instructorId', 'name')
    .sort({ createdAt: -1 })
    .lean()) as unknown as LeanGuild[]

  const ids = guilds.map((g) => g._id as unknown as mongoose.Types.ObjectId)
  const logs = (await SessionLog.find({ guildId: { $in: ids } }).sort({ date: 1 }).lean()) as unknown as LeanSession[]

  return NextResponse.json({
    role,
    guilds: guilds.map(serializeGuild),
    sessions: logs.map((l) => serializeSession(l)),
    students: [],
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role
  if (role !== 'instructor' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await req.json()) as {
    guildId?: string
    sessionNumber?: number
    title?: string
    date?: string
    link?: string
  }
  const guildId = body.guildId
  const sessionNumber = body.sessionNumber

  if (!guildId || !isObjectId(guildId)) {
    return NextResponse.json({ error: 'Valid guildId is required' }, { status: 400 })
  }
  if (typeof sessionNumber !== 'number' || !Number.isInteger(sessionNumber) || sessionNumber < 1) {
    return NextResponse.json({ error: 'Session number must be a positive integer' }, { status: 400 })
  }
  if (!body.date || Number.isNaN(new Date(body.date).getTime())) {
    return NextResponse.json({ error: 'Valid date is required' }, { status: 400 })
  }

  await connectToDatabase()

  const guild = (await Guild.findById(guildId).populate('courseId', 'title totalSessions').lean()) as unknown as LeanGuild | null
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })

  if (role === 'instructor' && String(guild.instructorId) !== session.user.id) {
    return NextResponse.json({ error: 'Not your guild' }, { status: 403 })
  }

  const totalSessions = (guild.courseId as { totalSessions?: number })?.totalSessions ?? 0
  if (totalSessions > 0 && sessionNumber > totalSessions) {
    return NextResponse.json({ error: `Session number cannot exceed ${totalSessions}` }, { status: 400 })
  }

  const existing = await SessionLog.findOne({ guildId, sessionNumber })
  if (existing) {
    return NextResponse.json({ error: `Session ${sessionNumber} already exists for this guild` }, { status: 409 })
  }

  const created = await SessionLog.create({
    guildId,
    sessionNumber,
    title: typeof body.title === 'string' && body.title.trim() ? body.title.trim() : undefined,
    link: typeof body.link === 'string' && body.link.trim() ? body.link.trim() : undefined,
    date: new Date(body.date),
  })

  return NextResponse.json({ session: serializeSession(created as unknown as LeanSession) }, { status: 201 })
}