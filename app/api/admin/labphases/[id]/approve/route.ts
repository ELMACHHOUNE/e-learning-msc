import { NextResponse } from 'next/server'
import { authenticate } from '@/lib/api-auth'
import { connectToDatabase } from '@/lib/db'
import { isObjectId } from '@/lib/utils'
import LabPhase from '@/models/LabPhase'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await authenticate('admin')
  if (!guard.ok) return guard.response

  const { id } = await params
  if (!isObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { status, rejectionReason } = body

  if (typeof status !== 'string' || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Status must be approved or rejected' }, { status: 400 })
  }

  await connectToDatabase()

  const lab = await LabPhase.findById(id)
  if (!lab) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  lab.status = status as 'approved' | 'rejected'
  if (status === 'rejected') {
    lab.rejectionReason =
      typeof rejectionReason === 'string' && rejectionReason.trim()
        ? rejectionReason.trim()
        : undefined
  } else {
    lab.rejectionReason = undefined
  }

  await lab.save()

  return NextResponse.json({ success: true, id: lab._id.toString(), status: lab.status })
}
