import { connectToDatabase } from '@/lib/db'
import Certificate from '@/models/Certificate'
import ProjectApplication from '@/models/ProjectApplication'
import Guild from '@/models/Guild'
import User from '@/models/User'

export const ACADEMY_NAME = 'E-Learning MSC Academy'

export interface GraduationRecord {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  projectId: string
  courseId: string
  courseTitle: string
  instructorId?: string
  instructorName: string
  academyName: string
  durationF: string
  formationDate: string
  certificateId: string
  graduatedAt: Date | string
  createdAt: Date | string
}

interface PopulatedGuild {
  _id: { toString(): string }
  currentSession: number
  courseId?:
    | {
        _id?: { toString(): string }
        toString(): string
        title?: string
        durationInMonths?: number
        totalSessions?: number
      }
    | null
  instructorId?:
    | { _id?: { toString(): string }; toString(): string; name?: string }
    | null
}

interface PopulatedProject {
  _id: { toString(): string }
  studentId: { toString(): string }
  guildId?: { toString(): string } | null
  status: string
  updatedAt?: Date
  createdAt?: Date
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

async function generateUniqueCertificateId(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await Certificate.countDocuments()
  let seq = count + 1
  let id = `CERT-${year}-${String(seq).padStart(4, '0')}`
  while (await Certificate.exists({ certificateId: id })) {
    seq += 1
    id = `CERT-${year}-${String(seq).padStart(4, '0')}`
  }
  return id
}

interface CertificateDocLike {
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

function toRecord(cert: CertificateDocLike): GraduationRecord {
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

/**
 * A student graduates only after completing every milestone:
 * 1. At least one course fully completed (all guild sessions done — includes lessons & checkpoints)
 * 2. At least one lab phase fully completed (all project steps validated, status "completed")
 *
 * Ensures a certificate record exists for every completed project and returns the created records.
 */
export async function ensureGraduation(studentId: string): Promise<GraduationRecord[]> {
  await connectToDatabase()

  const projects = (await ProjectApplication.find({ studentId, status: 'completed' }).lean()) as unknown as PopulatedProject[]
  if (projects.length === 0) return []

  const guilds = (await Guild.find({ studentIds: studentId })
    .populate('courseId', 'title durationInMonths totalSessions')
    .populate('instructorId', 'name')
    .lean()) as unknown as PopulatedGuild[]

  const completedGuilds = guilds.filter((g) => {
    const total = g.courseId?.totalSessions ?? 0
    return total > 0 && g.currentSession >= total
  })
  if (completedGuilds.length === 0) return []

  const user = await User.findById(studentId).select('name email').lean()
  const studentName = (user as { name?: string } | null)?.name ?? 'Student'
  const studentEmail = (user as { email?: string } | null)?.email ?? ''

  const created: GraduationRecord[] = []

  for (const project of projects) {
    const existing = await Certificate.findOne({ studentId, projectId: project._id.toString() }).lean()
    if (existing) {
      created.push(toRecord(existing as unknown as CertificateDocLike))
      continue
    }

    let course = completedGuilds[0]?.courseId
    let instructor = completedGuilds[0]?.instructorId
    if (project.guildId) {
      const guild = (await Guild.findById(project.guildId.toString())
        .populate('courseId', 'title durationInMonths totalSessions')
        .populate('instructorId', 'name')
        .lean()) as unknown as PopulatedGuild | null
      if (guild) {
        course = guild.courseId ?? course
        instructor = guild.instructorId ?? instructor
      }
    }

    const courseId = course?._id?.toString?.() ?? (course as { toString?: () => string })?.toString?.()
    if (!courseId) continue

    const courseTitle = course?.title ?? 'Program'
    const months = course?.durationInMonths ?? 0
    const durationF = months > 0 ? `${months} ${months === 1 ? 'Month' : 'Months'}` : ''
    const instructorName = instructor?.name ?? 'Unknown Instructor'
    const graduatedAt = project.updatedAt ?? project.createdAt ?? new Date()

    const certificate = await Certificate.create({
      studentId,
      projectId: project._id.toString(),
      courseId,
      studentName,
      studentEmail,
      courseTitle,
      instructorId: instructor?._id?.toString() ?? instructor?.toString?.() ?? undefined,
      instructorName,
      academyName: ACADEMY_NAME,
      durationF,
      formationDate: formatDate(graduatedAt),
      certificateId: await generateUniqueCertificateId(),
      graduatedAt,
    })

    created.push(toRecord(certificate as unknown as CertificateDocLike))
  }

  return created
}
