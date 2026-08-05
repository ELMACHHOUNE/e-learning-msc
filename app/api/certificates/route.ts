import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import Certificate from '@/models/Certificate'
import ProjectApplication from '@/models/ProjectApplication'
import { ensureGraduation, type GraduationRecord } from '@/lib/graduation'

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
  await requireRole('admin')
  await connectToDatabase()

  // Backfill: any student with a completed lab phase project + completed course
  // that hasn't been registered yet gets a graduation record on the spot.
  const studentIds = await ProjectApplication.find({ status: 'completed' }).distinct('studentId')
  for (const studentId of studentIds) {
    try {
      await ensureGraduation(studentId.toString())
    } catch (error) {
      console.error(`Graduation backfill failed for ${studentId.toString()}:`, error)
    }
  }

  const certificates = await Certificate.find()
    .sort({ graduatedAt: -1 })
    .limit(300)
    .lean()

  return NextResponse.json({
    certificates: certificates.map((c) => toRecord(c as unknown as CertificateLean)),
  })
}
