import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth, requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'

export async function GET() {
  await requireRole('admin')
  await connectToDatabase()
  const users = await User.find().select('-password').sort({ createdAt: -1 })
  return NextResponse.json(users.map((u) => ({ id: u._id.toString(), name: u.name, email: u.email, avatar: u.avatar, role: u.role, createdAt: u.createdAt })))
}

export async function POST(req: Request) {
  await requireRole('admin')
  const body = await req.json()
  const { name, email, password, role } = body
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  await connectToDatabase()
  const hashed = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email, password: hashed, role })
  return NextResponse.json({ id: user._id.toString(), name: user.name, email: user.email, role: user.role })
}
