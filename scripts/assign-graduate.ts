import mongoose from 'mongoose'
import User from '@/models/User'
import Course from '@/models/Course'
import Guild from '@/models/Guild'
import LabPhase from '@/models/LabPhase'
import ProjectApplication from '@/models/ProjectApplication'
import Certificate from '@/models/Certificate'
import { ensureGraduation } from '@/lib/graduation'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-learning-msc'

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

async function main() {
  const email = process.argv[2] || 'mourad@elearning.msc'
  console.log(`Assigning graduate data for: ${email}`)
  await mongoose.connect(MONGODB_URI)

  // ── Student ──
  const student = (await User.findOne({ email }).lean()) as unknown as LeanUser | null
  if (!student) {
    console.error(`Student ${email} not found`)
    await mongoose.disconnect()
    process.exit(1)
  }
  const studentId = student._id.toString()

  // ── Instructor & course ──
  const instructor = (await User.findOne({ role: 'instructor' }).sort({ name: 1 }).lean()) as unknown as LeanUser | null
  if (!instructor) {
    console.error('No instructor found')
    await mongoose.disconnect()
    process.exit(1)
  }
  const course = (await Course.findOne({ active: true }).sort({ totalSessions: 1 }).lean()) as unknown as LeanCourse | null
  if (!course) {
    console.error('No active course found')
    await mongoose.disconnect()
    process.exit(1)
  }

  // ── Guild: completed at 100% ──
  let guild = (await Guild.findOne({ studentIds: studentId }).lean()) as unknown as { _id: mongoose.Types.ObjectId } | null
  if (!guild) {
    const created = await Guild.create({
      name: `Cohort ${student.name} — Completed`,
      courseId: course._id,
      instructorId: instructor._id,
      studentIds: [studentId],
      currentSession: course.totalSessions,
      skillsTotal: course.totalSessions * 40,
      skillsAchieved: course.totalSessions * 40,
    })
    guild = { _id: created._id }
    console.log(`✓ guild created: ${course.totalSessions}/${course.totalSessions} sessions (100%)`)
  } else {
    await Guild.updateOne({ _id: guild._id }, { $set: { currentSession: course.totalSessions } })
    console.log('✓ existing guild set to 100%')
  }

  // ── Completed lab phase project ──
  let project = (await ProjectApplication.findOne({ studentId, status: 'completed' }).lean()) as unknown as { _id: mongoose.Types.ObjectId } | null
  if (!project) {
    const phase = await LabPhase.findOne({ status: 'approved' }).lean()
    if (!phase) {
      console.error('No approved lab phase found')
      await mongoose.disconnect()
      process.exit(1)
    }
    const scores = [9, 9, 8]
    const created = await ProjectApplication.create({
      studentId,
      labPhaseId: phase._id,
      guildId: guild._id,
      status: 'completed',
      presentation: { url: 'https://www.canva.com/design/mourad-presentation', score: scores[0], validated: true },
      gitRepo: { url: 'https://github.com/mourad/final-project', score: scores[1], validated: true },
      deployment: { url: 'https://mourad-final-project.vercel.app', score: scores[2], validated: true },
      finalGrade: Math.round(((scores[0] + scores[1] + scores[2]) / 30) * 100),
    })
    project = { _id: created._id }
    console.log(`✓ completed lab phase project created (grade ${created.finalGrade})`)
  }

  // ── Register the graduation (creates certificate record) ──
  const records = await ensureGraduation(studentId)
  const certCount = await Certificate.countDocuments({ studentId })
  console.log(`✓ ${records.length} graduation record(s) returned, ${certCount} certificate(s) for ${email}`)
  for (const r of records) {
    console.log(`  ${r.certificateId} | ${r.studentName} | ${r.courseTitle} | ${r.durationF} | ${r.formationDate} | ${r.instructorName}`)
  }

  await mongoose.disconnect()
  console.log('\nDone. Check /graduations (admin) or the student view.')
}

main().catch((err) => {
  console.error('Assign failed:', err)
  process.exit(1)
})
