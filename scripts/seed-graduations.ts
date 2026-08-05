import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '@/models/User'
import Course from '@/models/Course'
import Guild from '@/models/Guild'
import LabPhase from '@/models/LabPhase'
import ProjectApplication from '@/models/ProjectApplication'
import Certificate from '@/models/Certificate'
import { ensureGraduation } from '@/lib/graduation'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-learning-msc'
const PASSWORD = 'password123'

interface LeanCourse {
  _id: mongoose.Types.ObjectId
  title: string
  totalSessions: number
  durationInMonths: number
}
interface LeanUser {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function main() {
  console.log('Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('Connected.\n')

  // ── Reuse existing resources or create minimal ones ──
  let instructors = (await User.find({ role: 'instructor' }).limit(3).lean()) as unknown as LeanUser[]
  if (instructors.length === 0) {
    const password = await bcrypt.hash(PASSWORD, 12)
    const created = await User.create([
      { name: 'Sarah Chen', email: 'sarah@elearning.msc', password, role: 'instructor' },
      { name: 'Marcus Johnson', email: 'marcus@elearning.msc', password, role: 'instructor' },
    ])
    instructors = created.map((u) => ({ _id: u._id, name: u.name, email: u.email }))
    console.log(`✓ ${instructors.length} instructors created`)
  }

  let courses = (await Course.find().limit(5).lean()) as unknown as LeanCourse[]
  if (courses.length === 0) {
    const created = await Course.create([
      {
        title: '15-Month Software Engineering Program',
        description: 'Full-stack development track covering frontend, backend, databases, and DevOps.',
        active: true,
        durationInMonths: 15,
        totalSessions: 194,
        moduleCount: 7,
      },
      {
        title: 'Data Science & Analytics Bootcamp',
        description: 'Statistics, machine learning, data engineering, and visualization.',
        active: true,
        durationInMonths: 12,
        totalSessions: 150,
        moduleCount: 4,
      },
      {
        title: 'UI/UX Design Masterclass',
        description: 'Design thinking, user research, prototyping, and visual design.',
        active: true,
        durationInMonths: 6,
        totalSessions: 72,
        moduleCount: 4,
      },
    ])
    courses = created.map((c) => ({ _id: c._id, title: c.title, totalSessions: c.totalSessions, durationInMonths: c.durationInMonths }))
    console.log(`✓ ${courses.length} courses created`)
  }

  // ── Approved lab phases (reuse existing approved ones, else create) ──
  let labPhases = (await LabPhase.find({ status: 'approved' }).limit(5).lean()) as unknown as { _id: mongoose.Types.ObjectId; title: string }[]
  if (labPhases.length === 0) {
    const admin = await User.findOne({ role: 'admin' })
    const created = await LabPhase.create([
      {
        title: 'Phase 1: Foundations',
        description: 'HTML, CSS, JavaScript basics — build your first static webpage',
        instructions: 'Create a personal portfolio page using semantic HTML5 and CSS3.\n\nRequirements:\n- Semantic HTML tags\n- Navigation bar with 3+ links\n- Responsive CSS\n- Deploy to GitHub Pages',
        duration: '4 weeks',
        status: 'approved',
        createdBy: admin?._id ?? instructors[0]._id,
      },
      {
        title: 'Phase 2: Frontend Development',
        description: 'React, state management, routing — build interactive UIs',
        instructions: 'Build a task management dashboard using React.\n\nRequirements:\n- Functional components and hooks\n- State management\n- Routing\n- Loading / empty / error states',
        duration: '6 weeks',
        status: 'approved',
        createdBy: admin?._id ?? instructors[0]._id,
      },
    ])
    labPhases = created.map((l) => ({ _id: l._id, title: l.title }))
    console.log(`✓ ${labPhases.length} lab phases created`)
  }

  // ── Fake students (6 graduated + 3 in progress) ──
  const password = await bcrypt.hash(PASSWORD, 12)

  const graduatedNames: Array<{ name: string; email: string; courseIndex: number; instructorIndex: number; phaseIndex: number; completedDaysAgo: number }> = [
    { name: 'Lina Benali', email: 'lina.benali@fake.msc', courseIndex: 0, instructorIndex: 0, phaseIndex: 0, completedDaysAgo: 12 },
    { name: 'Youssef El Amrani', email: 'youssef.elamrani@fake.msc', courseIndex: 0, instructorIndex: 0, phaseIndex: 1, completedDaysAgo: 25 },
    { name: 'Sara Mansouri', email: 'sara.mansouri@fake.msc', courseIndex: 0, instructorIndex: 0, phaseIndex: 0, completedDaysAgo: 40 },
    { name: 'Omar Haddad', email: 'omar.haddad@fake.msc', courseIndex: 1, instructorIndex: 1, phaseIndex: 1, completedDaysAgo: 55 },
    { name: 'Nora Fassi', email: 'nora.fassi@fake.msc', courseIndex: 1, instructorIndex: 1, phaseIndex: 0, completedDaysAgo: 70 },
    { name: 'Karim Berrada', email: 'karim.berrada@fake.msc', courseIndex: 2, instructorIndex: 2, phaseIndex: 1, completedDaysAgo: 90 },
  ]

  const inProgressNames = [
    { name: 'Zineb Ouahbi', email: 'zineb.ouahbi@fake.msc' },
    { name: 'Mehdi Alaoui', email: 'mehdi.alaoui@fake.msc' },
    { name: 'Salma Idrissi', email: 'salma.idrissi@fake.msc' },
  ]

  async function findOrCreateStudent(name: string, email: string): Promise<LeanUser> {
    const existing = (await User.findOne({ email }).lean()) as unknown as LeanUser | null
    if (existing) return existing
    const created = await User.create({ name, email, password, role: 'student' })
    return { _id: created._id, name, email }
  }

  const graduatedStudents: LeanUser[] = []
  for (const s of graduatedNames) {
    graduatedStudents.push(await findOrCreateStudent(s.name, s.email))
  }
  const inProgressStudents: LeanUser[] = []
  for (const s of inProgressNames) {
    inProgressStudents.push(await findOrCreateStudent(s.name, s.email))
  }
  console.log(`✓ ${graduatedStudents.length} graduated students ready (${inProgressStudents.length} in-progress)`)
  console.log('  password for all fake accounts: ' + PASSWORD)

  // ── Guilds (completed = currentSession >= totalSessions) ──
  async function findOrCreateGuild(name: string, course: LeanCourse, instructor: LeanUser, students: LeanUser[], currentSession: number): Promise<mongoose.Types.ObjectId> {
    const existing = (await Guild.findOne({ name }).lean()) as unknown as { _id: mongoose.Types.ObjectId } | null
    if (existing) return existing._id
    const created = await Guild.create({
      name,
      courseId: course._id,
      instructorId: instructor._id,
      studentIds: students.map((s) => s._id),
      currentSession,
      skillsTotal: course.totalSessions * 40,
      skillsAchieved: Math.round(currentSession * 38),
    })
    return created._id
  }

  const completedGuildIds: Array<{ student: LeanUser; guildId: mongoose.Types.ObjectId }> = []
  const byCourse = new Map<number, mongoose.Types.ObjectId>()
  for (let i = 0; i < graduatedNames.length; i++) {
    const info = graduatedNames[i]
    const course = courses[info.courseIndex % courses.length]
    const instructor = instructors[info.instructorIndex % instructors.length]
    let guildId = byCourse.get(info.courseIndex)
    if (!guildId) {
      const group = graduatedStudents.filter((_, gi) => graduatedNames[gi].courseIndex === info.courseIndex)
      guildId = await findOrCreateGuild(`Cohort ${info.courseIndex + 1} — Completed`, course, instructor, group, course.totalSessions)
      byCourse.set(info.courseIndex, guildId)
    }
    completedGuildIds.push({ student: graduatedStudents[i], guildId })
  }
  console.log(`✓ ${byCourse.size} completed guilds ready`)

  // One in-progress guild (sessions not finished → not a graduate)
  await findOrCreateGuild(
    'Cohort 4 — In Progress',
    courses[0],
    instructors[0],
    inProgressStudents,
    Math.round(courses[0].totalSessions * 0.55)
  )
  console.log('✓ 1 in-progress guild ready (students should NOT appear)')

  // ── Completed lab phase projects ──
  const phaseIds = labPhases.map((l) => l._id)
  for (let i = 0; i < graduatedNames.length; i++) {
    const info = graduatedNames[i]
    const student = graduatedStudents[i]
    const phaseId = phaseIds[info.phaseIndex % phaseIds.length]
    const completedAt = daysAgo(info.completedDaysAgo)
    const scores = [8, 9, 7]

    const existing = await ProjectApplication.findOne({ studentId: student._id, status: 'completed' }).lean()
    if (existing) {
      await ProjectApplication.updateOne({ _id: existing._id }, { $set: { updatedAt: completedAt } })
      continue
    }

    await ProjectApplication.create({
      studentId: student._id,
      labPhaseId: phaseId,
      guildId: completedGuildIds[i].guildId,
      status: 'completed',
      presentation: { url: 'https://www.canva.com/design/fake-presentation', score: scores[0], validated: true },
      gitRepo: { url: 'https://github.com/fake-student/final-project', score: scores[1], validated: true },
      deployment: { url: 'https://fake-student-project.vercel.app', score: scores[2], validated: true },
      finalGrade: Math.round(((scores[0] + scores[1] + scores[2]) / 30) * 100),
    })
    await ProjectApplication.updateOne(
      { studentId: student._id, status: 'completed' },
      { $set: { createdAt: completedAt, updatedAt: completedAt } }
    )
  }
  console.log(`✓ ${graduatedStudents.length} completed lab phase projects ready`)

  // ── Register the graduations (creates certificate records) ──
  let created = 0
  for (const student of graduatedStudents) {
    const records = await ensureGraduation(student._id.toString())
    created += records.length
  }
  const existingCertificates = await Certificate.countDocuments()
  console.log(`✓ ${created} graduation record(s) created (${existingCertificates} total in DB)`)

  console.log('\n── Graduation seed complete ──')
  console.log('Open /graduations as admin to see the 6 graduates.')
  console.log('Each has a certificate you can download via the "Certificate" button.')

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
