import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import LabPhase from '@/models/LabPhase'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin')

  const body = await req.json()
  const { status, rejectionReason } = body

  if (!status || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Status must be approved or rejected' }, { status: 400 })
  }

  const { id } = await params

  await connectToDatabase()

  const lab = await LabPhase.findById(id)
  if (!lab) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  lab.status = status
  if (status === 'rejected' && rejectionReason) {
    lab.rejectionReason = rejectionReason
  } else if (status === 'approved') {
    lab.rejectionReason = undefined
  }

  await lab.save()

  return NextResponse.json({ success: true, id: lab._id.toString(), status: lab.status })
}
