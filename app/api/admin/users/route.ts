import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { authenticate } from '@/lib/api-auth'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'

const ROLES = ['admin', 'instructor', 'student'] as const
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

function isDuplicateKeyError(error: unknown) {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000
}

export async function GET(req: Request) {
  const guard = await authenticate('admin')
  if (!guard.ok) return guard.response
  await connectToDatabase()
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const filter: Record<string, unknown> = {}
  if (role) {
    if (!ROLES.includes(role as (typeof ROLES)[number])) {
      return NextResponse.json({ error: 'Invalid role filter' }, { status: 400 })
    }
    filter.role = role
  }
  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean()
  return NextResponse.json(users.map((u) => ({ id: u._id.toString(), name: u.name, email: u.email, phone: u.phone, avatar: u.avatar, role: u.role, createdAt: u.createdAt })))
}

export async function POST(req: Request) {
  const guard = await authenticate('admin')
  if (!guard.ok) return guard.response
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { name, email, phone, password, role } = body
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    )
  }

  await connectToDatabase()

  try {
    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email: email.trim().toLowerCase(), phone, password: hashed, role })
    return NextResponse.json({ id: user._id.toString(), name: user.name, email: user.email, phone: user.phone, role: user.role })
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 })
    }
    throw error
  }
}
