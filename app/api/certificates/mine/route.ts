import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Certificate from '@/models/Certificate'
import type { GraduationRecord } from '@/lib/graduation'

interface CertificateLean {
  _id: { toString(): string }
  studentId: { toString(): string }
  projectId: { toString(): string }
  courseId: { toString(): string }
  studentName: string
  studentEmail: string
  courseTitle: string
  instructorId?: { toString(): string } | null
  instructorName: string
  academyName: string
  durationF: string
  formationDate: string
  certificateId: string
  graduatedAt: Date
  createdAt: Date
}

function toRecord(cert: CertificateLean): GraduationRecord {
  return {
    id: cert._id.toString(),
    studentId: cert.studentId.toString(),
    studentName: cert.studentName,
    studentEmail: cert.studentEmail,
    projectId: cert.projectId.toString(),
    courseId: cert.courseId.toString(),
    courseTitle: cert.courseTitle,
    instructorId: cert.instructorId?.toString(),
    instructorName: cert.instructorName,
    academyName: cert.academyName,
    durationF: cert.durationF,
    formationDate: cert.formationDate,
    certificateId: cert.certificateId,
    graduatedAt: cert.graduatedAt,
    createdAt: cert.createdAt,
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectToDatabase()

  const certificates = await Certificate.find({ studentId: session.user.id })
    .sort({ graduatedAt: -1 })
    .limit(100)
    .lean()

  return NextResponse.json({
    certificates: certificates.map((c) => toRecord(c as unknown as CertificateLean)),
  })
}
