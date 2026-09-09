import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import OneToOne from '@/models/OneToOne'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid slot id' }, { status: 400 })
  }

  const body = (await req.json()) as { action?: string }
  if (body.action !== 'cancel') {
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  }

  await connectToDatabase()

  const slot = await OneToOne.findById(id)
  if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 })

  if (session.user.role === 'instructor' && String(slot.instructorId) !== session.user.id) {
    return NextResponse.json({ error: 'Not your slot' }, { status: 403 })
  }
  if (session.user.role === 'student') {
    if (String(slot.studentId) !== session.user.id) {
      return NextResponse.json({ error: 'Not your booking' }, { status: 403 })
    }
    if (slot.status !== 'booked') {
      return NextResponse.json({ error: 'Only booked slots can be cancelled' }, { status: 400 })
    }
    if (new Date(slot.date).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'This session already happened' }, { status: 400 })
    }
  }

  if (slot.status === 'cancelled') {
    return NextResponse.json({ error: 'Slot is already cancelled' }, { status: 409 })
  }

  slot.status = 'cancelled'
  await slot.save()

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'instructor' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid slot id' }, { status: 400 })
  }

  await connectToDatabase()

  const slot = await OneToOne.findById(id)
  if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 })

  if (session.user.role === 'instructor' && String(slot.instructorId) !== session.user.id) {
    return NextResponse.json({ error: 'Not your slot' }, { status: 403 })
  }

  await slot.deleteOne()

  return NextResponse.json({ success: true })
}

export const runtime = 'nodejs'