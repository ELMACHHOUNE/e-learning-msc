import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'

export async function GET(req: Request) {
  await requireRole('admin')
  await connectToDatabase()
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const filter: Record<string, unknown> = {}
  if (role) filter.role = role
  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean()
  return NextResponse.json(users.map((u) => ({ id: u._id.toString(), name: u.name, email: u.email, phone: u.phone, avatar: u.avatar, role: u.role, createdAt: u.createdAt })))
}

export async function POST(req: Request) {
  await requireRole('admin')
  const body = await req.json()
  const { name, email, phone, password, role } = body
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  await connectToDatabase()
  const hashed = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email, phone, password: hashed, role })
  return NextResponse.json({ id: user._id.toString(), name: user.name, email: user.email, phone: user.phone, role: user.role })
}
