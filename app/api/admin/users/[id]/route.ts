import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'

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
  const user = await User.findByIdAndDelete(id)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
