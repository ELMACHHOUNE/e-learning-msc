import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'
import Certificate from '@/models/Certificate'
import ProjectApplication from '@/models/ProjectApplication'
import Guild from '@/models/Guild'
import SessionLog from '@/models/SessionLog'
import AIConversation from '@/models/AIConversation'
import AIQuizDraft from '@/models/AIQuizDraft'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin')
  const { id } = await params
  const body = await req.json()
  await connectToDatabase()

  const update: Record<string, unknown> = {}
  if ('name' in body) update.name = body.name
  if ('email' in body) update.email = body.email
  if ('phone' in body) update.phone = body.phone
  if ('role' in body) update.role = body.role
  if ('password' in body && body.password) update.password = await bcrypt.hash(body.password, 10)

  const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).select('-password')
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json({ id: user._id.toString(), name: user.name, email: user.email, phone: user.phone, role: user.role })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin')
  const { id } = await params
  await connectToDatabase()

  const user = await User.findById(id).select('role').lean()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await Certificate.deleteMany({ studentId: id })
  await ProjectApplication.deleteMany({ studentId: id })
  await AIConversation.deleteMany({ userId: id })
  await AIQuizDraft.deleteMany({ createdBy: id })
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
