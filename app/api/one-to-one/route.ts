import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import OneToOne from '@/models/OneToOne'
import Guild from '@/models/Guild'

type LeanSlot = {
  _id: unknown
  instructorId: { toString(): string }
  studentId?: { _id?: { toString(): string }; name?: string } | null
  guildId: { toString(): string }
  title?: string
  date: Date
  duration: number
  status: 'available' | 'booked' | 'cancelled'
}

type LeanGuild = {
  _id: unknown
  name: string
  courseId?: { _id?: { toString(): string }; title?: string } | null
  instructorId?: { _id?: { toString(): string }; name?: string } | null
  studentIds?: unknown[]
}

function serializeSlot(s: LeanSlot) {
  return {
    id: (s._id as { toString(): string }).toString(),
    guildId: String(s.guildId),
    instructorId: String(s.instructorId),
    studentId: s.studentId?._id ? String(s.studentId._id) : null,
    studentName: s.studentId?.name ?? null,
    title: s.title ?? '',
    date: s.date,
    duration: s.duration,
    status: s.status,
  }
}

const isObjectId = (v: string) => mongoose.Types.ObjectId.isValid(v)

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role

  await connectToDatabase()

  // instructor: own slots + own guilds for the create form
  if (role === 'instructor') {
    const guilds = (await Guild.find({ instructorId: userId })
      .populate('courseId', 'title')
      .sort({ createdAt: -1 })
      .lean()) as unknown as LeanGuild[]

    const rawSlots = await OneToOne.find({ instructorId: userId })
      .populate('studentId', 'name')
      .sort({ date: 1 })
      .lean()
    const slots = rawSlots.map((s) => serializeSlot(s as unknown as LeanSlot))

    return NextResponse.json({
      role,
      guilds: guilds.map((g) => ({
        id: (g._id as { toString(): string }).toString(),
        name: g.name,
        courseTitle: (g.courseId as { title?: string })?.title ?? 'Unknown',
        studentCount: (g.studentIds ?? []).length,
      })),
      slots,
    })
  }

  // student: slots of their guilds' instructors, plus their own bookings
  if (role === 'student') {
    const guilds = (await Guild.find({ studentIds: userId })
      .populate('courseId', 'title')
      .populate('instructorId', 'name')
      .sort({ createdAt: -1 })
      .lean()) as unknown as LeanGuild[]

    const guildIds = guilds.map((g) => g._id as unknown as mongoose.Types.ObjectId)

    const rawSlots = await OneToOne.find({
      $or: [{ guildId: { $in: guildIds } }, { studentId: userId }],
    })
      .populate('studentId', 'name')
      .sort({ date: 1 })
      .lean()

    const slots = rawSlots.map((s) => serializeSlot(s as unknown as LeanSlot))

    return NextResponse.json({
      role,
      guilds: guilds.map((g) => ({
        id: (g._id as { toString(): string }).toString(),
        name: g.name,
        courseTitle: (g.courseId as { title?: string })?.title ?? 'Unknown',
        instructorId: ((g.instructorId as { _id?: { toString(): string } } | null)?._id ?? '').toString(),
        instructorName: (g.instructorId as { name?: string } | null)?.name ?? 'Unknown',
      })),
      slots,
    })
  }

  // admin: everything
  const rawSlots = await OneToOne.find().populate('studentId', 'name').sort({ date: 1 }).lean()
  const slots = rawSlots.map((s) => serializeSlot(s as unknown as LeanSlot))

  return NextResponse.json({ role, guilds: [], slots })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role

  const body = (await req.json()) as {
    guildId?: string
    date?: string
    duration?: number
    title?: string
    slotId?: string
  }

  await connectToDatabase()

  // ---- student books an available slot ----
  if (role === 'student') {
    const slotId = body.slotId
    if (!slotId || !isObjectId(slotId)) {
      return NextResponse.json({ error: 'Valid slotId is required' }, { status: 400 })
    }

    const slot = await OneToOne.findById(slotId)
    if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
    if (slot.status !== 'available') {
      return NextResponse.json({ error: 'This slot is no longer available' }, { status: 409 })
    }
    if (new Date(slot.date).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'This slot is in the past' }, { status: 400 })
    }

    const guild = await Guild.findOne({ _id: slot.guildId, studentIds: userId })
    if (guild) {
      // student belongs to that guild — allowed
    } else {
      return NextResponse.json({ error: 'You cannot book a slot for this group' }, { status: 403 })
    }

    const start = new Date(slot.date).getTime()
    const end = start + slot.duration * 60_000
    const clash = await OneToOne.findOne({
      studentId: userId,
      status: 'booked',
      date: { $lt: new Date(end) },
      $expr: {
        $lt: [new Date(start), { $add: ['$date', { $multiply: ['$duration', 60_000] }] }],
      },
    })
    if (clash) {
      return NextResponse.json({ error: 'You already have a one-to-one that overlaps this slot' }, { status: 409 })
    }

    const claimed = await OneToOne.findOneAndUpdate(
      { _id: slotId, status: 'available' },
      { $set: { status: 'booked', studentId: userId } },
      { new: true }
    )
    if (!claimed) {
      return NextResponse.json({ error: 'This slot was just booked by someone else' }, { status: 409 })
    }

    return NextResponse.json({ success: true, id: String(claimed._id) }, { status: 201 })
  }

  // ---- instructor / admin create availability slot ----
  if (role !== 'instructor' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { guildId, date, duration, title } = body
  if (!guildId || !isObjectId(guildId)) {
    return NextResponse.json({ error: 'Valid guildId is required' }, { status: 400 })
  }
  if (!date || Number.isNaN(new Date(date).getTime())) {
    return NextResponse.json({ error: 'Valid date is required' }, { status: 400 })
  }
  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration < 15 || duration > 180) {
    return NextResponse.json({ error: 'Duration must be between 15 and 180 minutes' }, { status: 400 })
  }
  const start = new Date(date).getTime()
  if (start <= Date.now()) {
    return NextResponse.json({ error: 'Slot must be in the future' }, { status: 400 })
  }

  const guild = await Guild.findById(guildId)
  if (!guild) return NextResponse.json({ error: 'Guild not found' }, { status: 404 })
  if (role === 'instructor' && String(guild.instructorId) !== userId) {
    return NextResponse.json({ error: 'Not your guild' }, { status: 403 })
  }

  const endMs = start + duration * 60_000
  const overlap = await OneToOne.findOne({
    instructorId: userId,
    date: { $lt: new Date(endMs) },
    $expr: {
      $lt: [new Date(start), { $add: ['$date', { $multiply: ['$duration', 60_000] }] }],
    },
  })

  if (overlap) {
    return NextResponse.json({ error: 'This slot overlaps an existing one-to-one' }, { status: 409 })
  }

  const created = await OneToOne.create({
    instructorId: userId,
    guildId,
    title: typeof title === 'string' && title.trim() ? title.trim() : undefined,
    date: new Date(date),
    duration,
    status: 'available',
  })

  return NextResponse.json(
    {
      success: true,
      id: String((created as { _id: unknown })._id),
      slot: serializeSlot(created as unknown as LeanSlot),
    },
    { status: 201 }
  )
}

export const runtime = 'nodejs'