import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { authenticate } from '@/lib/api-auth'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'
import Certificate from '@/models/Certificate'
import ProjectApplication from '@/models/ProjectApplication'
import Guild from '@/models/Guild'
import SessionLog from '@/models/SessionLog'

const ROLES = ['admin', 'instructor', 'student'] as const
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8
const OBJECT_ID = /^[a-f\d]{24}$/i

function isDuplicateKeyError(error: unknown) {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await authenticate('admin')
  if (!guard.ok) return guard.response
  const { id } = await params
  if (!OBJECT_ID.test(id)) return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if ('role' in body && !ROLES.includes(body.role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  if ('email' in body && (typeof body.email !== 'string' || !EMAIL_PATTERN.test(body.email))) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }
  if ('password' in body && body.password) {
    if (typeof body.password !== 'string' || body.password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      )
    }
  }

  await connectToDatabase()

  const update: Record<string, unknown> = {}
  if ('name' in body) update.name = body.name
  if ('email' in body) update.email = String(body.email).trim().toLowerCase()
  if ('phone' in body) update.phone = body.phone
  if ('role' in body) update.role = body.role
  if ('password' in body && body.password) update.password = await bcrypt.hash(body.password, 10)

  try {
    const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).select('-password')
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json({ id: user._id.toString(), name: user.name, email: user.email, phone: user.phone, role: user.role })
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 })
    }
    throw error
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await authenticate('admin')
  if (!guard.ok) return guard.response
  const { id } = await params
  if (!OBJECT_ID.test(id)) return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
  if (id === guard.user.id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
  }

  await connectToDatabase()

  const user = await User.findById(id).select('role').lean()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (user.role === 'admin') {
    const remainingAdmins = await User.countDocuments({ role: 'admin', _id: { $ne: id } })
    if (remainingAdmins === 0) {
      return NextResponse.json({ error: 'Cannot delete the last admin account' }, { status: 400 })
    }
  }

  await Certificate.deleteMany({ studentId: id })
  await ProjectApplication.deleteMany({ studentId: id })
  await Guild.updateMany({ studentIds: id }, { $pull: { studentIds: id } })
  await SessionLog.updateMany(
    { 'records.studentId': id },
    { $pull: { records: { studentId: id } } }
  )

  if (user.role === 'instructor' || user.role === 'admin') {
    const instructorGuilds = (await Guild.find({ instructorId: id }).select('_id').lean()).map(
      (g) => g._id
    )
    if (instructorGuilds.length > 0) {
      await SessionLog.deleteMany({ guildId: { $in: instructorGuilds } })
    }
    await Guild.deleteMany({ instructorId: id })
  }

  const removed = await User.findByIdAndDelete(id)
  if (!removed) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
