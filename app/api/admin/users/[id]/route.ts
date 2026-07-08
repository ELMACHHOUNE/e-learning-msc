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
  if (body.name) update.name = body.name
  if (body.email) update.email = body.email
  if (body.role) update.role = body.role
  if (body.password) update.password = await bcrypt.hash(body.password, 12)

  const user = await User.findByIdAndUpdate(id, update, { new: true }).select('-password')
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json({ id: user._id.toString(), name: user.name, email: user.email, role: user.role })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin')
  const { id } = await params
  await connectToDatabase()
  const user = await User.findByIdAndDelete(id)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
