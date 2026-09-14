import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Message, { type MessageDocument } from '@/models/Message'
import User from '@/models/User'

interface SerializedMessage {
  id: string
  name: string
  email: string
  authorEmail?: string
  userId?: string
  message: string
  isAdmin: boolean
  read: boolean
  createdAt: Date | string
}

interface Conversation {
  name: string
  email: string
  unread: number
  messages: SerializedMessage[]
}

function isStaffName(name?: string) {
  return typeof name === 'string' && (name.startsWith('Admin (') || name.startsWith('Instructor ('))
}

function serialize(m: MessageDocument): SerializedMessage {
  return {
    id: String(m._id),
    name: m.name,
    email: m.email,
    authorEmail: m.authorEmail,
    userId: m.userId,
    message: m.message,
    isAdmin: Boolean(m.isAdmin),
    read: Boolean(m.read),
    createdAt: m.createdAt,
  }
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user
  const { searchParams } = new URL(req.url)
  const filterEmail = searchParams.get('email')

  if (filterEmail && (filterEmail.startsWith('$') || filterEmail.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(filterEmail))) {
    return NextResponse.json({ error: 'Invalid email parameter' }, { status: 400 })
  }

  await connectToDatabase()

  const isStaff = user.role === 'admin' || user.role === 'instructor'

  if (isStaff) {
    const query = filterEmail ? { email: filterEmail } : {}
    const messages = await Message.find(query).sort({ createdAt: 1 }).lean()
    const serialized = messages.map(serialize)

    const emails = [...new Set(serialized.map((m) => m.email))]
    const users = await User.find({ email: { $in: emails } })
      .select('name email')
      .lean()
    const nameByEmail: Record<string, string> = {}
    for (const u of users) {
      nameByEmail[String(u.email).toLowerCase()] = String(u.name)
    }

    const grouped: Record<string, Conversation> = {}
    for (const m of serialized) {
      const key = m.email
      if (!grouped[key]) {
        grouped[key] = { name: 'Unknown', email: key, unread: 0, messages: [] }
      }
      if (m.name && !isStaffName(m.name)) {
        grouped[key].name = m.name
      }
      if (!m.isAdmin && !m.read && !isStaffName(m.name)) {
        grouped[key].unread++
      }
      grouped[key].messages.push(m)
    }

    const conversations = Object.values(grouped).sort(
      (a, b) =>
        new Date(b.messages[b.messages.length - 1].createdAt).getTime() -
        new Date(a.messages[a.messages.length - 1].createdAt).getTime()
    )

    for (const conv of conversations) {
      const registered = nameByEmail[conv.email.toLowerCase()]
      if (registered && !isStaffName(registered)) {
        conv.name = registered
      }
      if (conv.name === 'Unknown' || conv.name === 'Anonymous') {
        conv.name = conv.email.split('@')[0] || conv.email
      }
    }

    const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)

    const ownThread = serialized.filter((m) => m.email.toLowerCase() === (user.email ?? '').toLowerCase())
    const ownUnread = ownThread.filter((m) => m.isAdmin && !m.read).length

    if (filterEmail) {
      return NextResponse.json({ conversation: conversations[0] ?? null, conversations, totalUnread })
    }

    return NextResponse.json({ conversations, totalUnread, messages: ownThread, unreadCount: ownUnread })
  }

  const messages = await Message.find({ email: user.email }).sort({ createdAt: 1 }).lean()
  const serialized = messages.map(serialize)
  const unreadCount = serialized.filter((m) => m.isAdmin && !m.read).length

  return NextResponse.json({
    messages: serialized,
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
  if (message.trim().length > 5000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }

  const user = session.user
  const isStaff = user.role === 'admin' || user.role === 'instructor'
  const email = isStaff ? (targetEmail || user.email) : (user.email || 'unknown')
  const isAdmin = isStaff

  await connectToDatabase()

  const name = isAdmin
    ? user.role === 'admin'
      ? `Admin (${user.name ?? 'Support'})`
      : `Instructor (${user.name ?? 'Support'})`
    : (user.name ?? 'Anonymous')

  const msg = await Message.create({
    name,
    email,
    authorEmail: user.email ?? user.id,
    userId: isAdmin ? undefined : user.id,
    message: message.trim(),
    isAdmin,
    read: false,
  })

  const created = msg.toObject()
  return NextResponse.json({
    id: String(created._id),
    name: created.name,
    email: created.email,
    authorEmail: created.authorEmail,
    userId: created.userId,
    message: created.message,
    isAdmin: created.isAdmin,
    read: created.read,
    createdAt: created.createdAt,
  })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user
  await connectToDatabase()

  const body = await req.json().catch(() => ({}))
  const { email } = body

  if (user.role === 'admin' || user.role === 'instructor') {
    if (email && typeof email === 'string') {
      await Message.updateMany({ email, isAdmin: false, read: false }, { $set: { read: true } })
    } else {
      await Message.updateMany({ email: user.email, isAdmin: true, read: false }, { $set: { read: true } })
    }
  } else {
    await Message.updateMany({ email: user.email, isAdmin: true, read: false }, { $set: { read: true } })
  }

  return NextResponse.json({ success: true })
}