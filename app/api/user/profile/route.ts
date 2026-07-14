import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectToDatabase()
  const user = await User.findById(session.user.id).select('-password')
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
  })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, phone, avatar, currentPassword, newPassword } = body

  await connectToDatabase()
  const user = await User.findById(session.user.id).select('+password')
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (name) user.name = name
  if (phone !== undefined) user.phone = phone
  if (avatar !== undefined) user.avatar = avatar

  if (currentPassword && newPassword) {
    const isValid = await bcrypt.compare(currentPassword, user.password!)
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }
    user.password = await bcrypt.hash(newPassword, 12)
  }

  await user.save()

  return NextResponse.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
  })
}
