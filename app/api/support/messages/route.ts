import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Message from '@/models/Message'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { name?: string; email?: string; id?: string; role?: string }
  const { searchParams } = new URL(req.url)
  const filterEmail = searchParams.get('email')

  await connectToDatabase()

  if (user.role === 'admin' || user.role === 'instructor') {
    const query = filterEmail ? { email: filterEmail } : {}
    const messages = await Message.find(query).sort({ createdAt: 1 }).lean()

    const grouped: Record<string, { name: string; email: string; unread: number; messages: any[] }> = {}
    for (const m of messages) {
      const key = m.email
      if (!grouped[key]) {
        grouped[key] = { name: m.isAdmin ? 'Unknown' : m.name, email: key, unread: 0, messages: [] }
      }
      if (!m.isAdmin) {
        grouped[key].name = m.name
      }
      if (!m.isAdmin && !m.read) {
        grouped[key].unread++
      }
      grouped[key].messages.push({
        id: m._id.toString(),
        name: m.name,
        email: m.email,
        message: m.message,
        isAdmin: m.isAdmin,
        read: m.read,
        createdAt: m.createdAt,
      })
    }

    const totalUnread = Object.values(grouped).reduce((sum, c) => sum + c.unread, 0)

    const conversations = Object.values(grouped).sort(
      (a, b) => new Date(b.messages[b.messages.length - 1].createdAt).getTime() - new Date(a.messages[a.messages.length - 1].createdAt).getTime()
    )

    if (filterEmail) {
      return NextResponse.json({ conversation: conversations[0] ?? null })
    }

    return NextResponse.json({ conversations, totalUnread })
  }

  const messages = await Message.find({ email: user.email }).sort({ createdAt: 1 }).lean()
  const unreadCount = messages.filter((m) => m.isAdmin && !m.read).length
  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m._id.toString(),
      name: m.name,
      email: m.email,
      message: m.message,
      isAdmin: m.isAdmin,
      read: m.read,
      createdAt: m.createdAt,
    })),
    unreadCount,
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { message, targetEmail } = body
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const user = session.user as { name?: string; email?: string; id?: string; role?: string }

  const canTarget = user.role === 'admin' || user.role === 'instructor'
  const isAdmin = user.role === 'admin'
  const email = canTarget ? (targetEmail || user.email) : (user.email || 'unknown')

  await connectToDatabase()
  const msg = await Message.create({
    name: isAdmin ? `Admin (${user.name ?? 'Support'})` : canTarget ? `Instructor (${user.name ?? 'Support'})` : (user.name ?? 'Anonymous'),
    email,
    userId: canTarget ? undefined : user.id,
    message: message.trim(),
    isAdmin: true,
    read: true,
  })

  return NextResponse.json({
    id: msg._id.toString(),
    name: msg.name,
    email: msg.email,
    message: msg.message,
    isAdmin: msg.isAdmin,
    read: msg.read,
    createdAt: msg.createdAt,
  })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { name?: string; email?: string; id?: string; role?: string }
  await connectToDatabase()

  if (user.role === 'admin') {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    await Message.updateMany({ email, isAdmin: false, read: false }, { $set: { read: true } })
  } else {
    await Message.updateMany({ email: user.email, isAdmin: true, read: false }, { $set: { read: true } })
  }

  return NextResponse.json({ success: true })
}
