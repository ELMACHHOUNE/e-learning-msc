import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { isObjectId } from '@/lib/utils'
import LabPhase from '@/models/LabPhase'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role
  const { id } = await params
  if (!isObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  await connectToDatabase()

  const lab = await LabPhase.findById(id)
  if (!lab) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (role !== 'admin' && lab.createdBy.toString() !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (role !== 'admin' && lab.status !== 'pending') {
    return NextResponse.json({ error: 'Can only edit pending labphases' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { title, description, instructions, duration, image, category } = body

  if (duration !== undefined) {
    if (typeof duration !== 'string' || !duration.trim()) {
      return NextResponse.json({ error: 'Duration is required' }, { status: 400 })
    }
    lab.duration = duration.trim()
  }

  if (title) lab.title = title
  if (description) lab.description = description
  if (instructions) lab.instructions = instructions
  if (image !== undefined) lab.image = image
  if (category !== undefined) lab.category = category || undefined

  if (role === 'admin' && body.status) {
    if (!['pending', 'approved', 'rejected'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    lab.status = body.status
  }

  if (role !== 'admin') {
    lab.status = 'pending'
  }

  await lab.save()

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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role
  const { id } = await params
  if (!isObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  await connectToDatabase()

  const lab = await LabPhase.findById(id)
  if (!lab) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (role !== 'admin' && lab.createdBy.toString() !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await LabPhase.findByIdAndDelete(id)

  return NextResponse.json({ success: true })
}
