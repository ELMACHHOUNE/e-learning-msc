import { NextResponse } from 'next/server'
import { auth, requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import LabPhase from '@/models/LabPhase'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role

  if (role !== 'admin' && role !== 'instructor' && role !== 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectToDatabase()

  let labphases
  if (role === 'admin') {
    labphases = await LabPhase.find().populate('createdBy', 'name email').sort({ createdAt: -1 }).lean()
  } else if (role === 'instructor') {
    labphases = await LabPhase.find({ $or: [{ createdBy: userId }, { status: 'approved' }] })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean()
  } else {
    labphases = await LabPhase.find({ status: 'approved' })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean()
  }

  return NextResponse.json({
    labphases: labphases.map((l) => ({
      id: l._id.toString(),
      title: l.title,
      description: l.description,
      instructions: l.instructions,
      duration: l.duration,
      image: l.image,
      category: l.category,
      status: l.status,
      createdBy: l.createdBy ? { id: l.createdBy._id?.toString() ?? l.createdBy.toString(), name: (l.createdBy as { name?: string }).name ?? 'Unknown' } : null,
      rejectionReason: l.rejectionReason,
      createdAt: l.createdAt,
    })),
  })
}

export async function POST(req: Request) {
  await requireRole('admin', 'instructor')
  const session = await auth()
  const userId = session!.user.id
  const role = session!.user.role

  const body = await req.json()
  const { title, description, instructions, duration, image, category } = body

  if (!title || !description || !instructions || !duration) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  await connectToDatabase()

  const status = role === 'admin' ? 'approved' : 'pending'

  const lab = await LabPhase.create({
    title,
    description,
    instructions,
    duration,
    image,
    category: category || undefined,
    status,
    createdBy: userId,
  })

  return NextResponse.json({
    id: lab._id.toString(),
    title: lab.title,
    description: lab.description,
    instructions: lab.instructions,
    duration: lab.duration,
    image: lab.image,
    category: lab.category,
    status: lab.status,
    createdAt: lab.createdAt,
  })
}
