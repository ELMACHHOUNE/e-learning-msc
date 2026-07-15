import { NextResponse } from 'next/server'
import { auth, requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import ProjectApplication from '@/models/ProjectApplication'
import Guild from '@/models/Guild'
import LabPhase from '@/models/LabPhase'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role

  await connectToDatabase()

  let projects
  if (role === 'admin') {
    projects = await ProjectApplication.find()
      .populate('studentId', 'name email avatar')
      .populate('labPhaseId', 'title')
      .populate('guildId', 'name')
      .sort({ createdAt: -1 })
      .lean()
  } else if (role === 'instructor') {
    const guilds = await Guild.find({ instructorId: userId }).select('_id').lean()
    const guildIds = guilds.map((g) => (g._id as { toString(): string }).toString())
    projects = await ProjectApplication.find({ guildId: { $in: guildIds } })
      .populate('studentId', 'name email avatar')
      .populate('labPhaseId', 'title')
      .populate('guildId', 'name')
      .sort({ createdAt: -1 })
      .lean()
  } else {
    projects = await ProjectApplication.find({ studentId: userId })
      .populate('studentId', 'name email avatar')
      .populate('labPhaseId', 'title')
      .populate('guildId', 'name')
      .sort({ createdAt: -1 })
      .lean()
  }

  return NextResponse.json({
    projects: projects.map((p) => ({
      id: p._id.toString(),
      studentId: p.studentId?._id?.toString() ?? (p.studentId as unknown as { toString(): string }).toString(),
      student: p.studentId ? { id: p.studentId._id?.toString() ?? (p.studentId as unknown as { toString(): string }).toString(), name: (p.studentId as { name?: string }).name ?? 'Unknown', email: (p.studentId as { email?: string }).email, avatar: (p.studentId as { avatar?: string }).avatar } : null,
      labPhaseId: p.labPhaseId?._id?.toString() ?? (p.labPhaseId as unknown as { toString(): string }).toString(),
      labPhaseTitle: (p.labPhaseId as { title?: string })?.title ?? 'Unknown',
      guildId: p.guildId?._id?.toString() ?? (p.guildId as unknown as { toString(): string })?.toString(),
      guildName: (p.guildId as { name?: string })?.name,
      status: p.status,
      presentation: p.presentation,
      gitRepo: p.gitRepo,
      deployment: p.deployment,
      finalGrade: p.finalGrade,
      createdAt: p.createdAt,
    })),
  })
}

export async function POST(req: Request) {
  await requireRole('student')
  const session = await auth()
  const userId = session!.user.id

  const body = await req.json()
  const { labPhaseId } = body

  if (!labPhaseId) {
    return NextResponse.json({ error: 'LabPhase ID is required' }, { status: 400 })
  }

  await connectToDatabase()

  const existing = await ProjectApplication.findOne({
    studentId: userId,
    status: { $in: ['pending', 'approved', 'in_progress'] },
  })
  if (existing) {
    return NextResponse.json({ error: 'You already have an active project application' }, { status: 400 })
  }

  const lab = await LabPhase.findById(labPhaseId)
  if (!lab || lab.status !== 'approved') {
    return NextResponse.json({ error: 'LabPhase not available' }, { status: 400 })
  }

  const guilds = await Guild.find({ studentIds: userId }).populate('courseId', 'totalSessions category').lean()
  const completedGuild = guilds.find((g) => {
    const total = (g as { courseId: { totalSessions?: number } }).courseId?.totalSessions ?? 0
    return total > 0 && (g as { currentSession: number }).currentSession >= total
  })
  if (!completedGuild) {
    return NextResponse.json({ error: 'You must complete all sessions of at least one course before applying' }, { status: 400 })
  }

  const courseCategory = (completedGuild.courseId as { category?: string })?.category
  if (courseCategory && lab.category && lab.category !== courseCategory) {
    return NextResponse.json({ error: `This lab phase is for "${lab.category}" but your completed course is in "${courseCategory}"` }, { status: 400 })
  }

  const project = await ProjectApplication.create({
    studentId: userId,
    labPhaseId,
    guildId: completedGuild?._id,
    status: 'pending',
    presentation: { url: '', validated: false },
    gitRepo: { url: '', validated: false },
    deployment: { url: '', validated: false },
  })

  return NextResponse.json({ id: project._id.toString(), status: project.status })
}
