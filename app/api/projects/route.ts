import { NextResponse } from 'next/server'
import { auth, requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import ProjectApplication from '@/models/ProjectApplication'
import Guild from '@/models/Guild'
import LabPhase from '@/models/LabPhase'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const role = (session.user as any).role

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
    const guildIds = guilds.map((g: any) => g._id)
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
    projects: projects.map((p: any) => ({
      id: p._id.toString(),
      studentId: p.studentId?._id?.toString() ?? p.studentId.toString(),
      student: p.studentId ? { id: p.studentId._id?.toString() ?? p.studentId.toString(), name: (p.studentId as any).name ?? 'Unknown', email: (p.studentId as any).email, avatar: (p.studentId as any).avatar } : null,
      labPhaseId: p.labPhaseId?._id?.toString() ?? p.labPhaseId.toString(),
      labPhaseTitle: (p.labPhaseId as any)?.title ?? 'Unknown',
      guildId: p.guildId?._id?.toString() ?? p.guildId?.toString(),
      guildName: (p.guildId as any)?.name,
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
  const userId = (session?.user as any).id

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
  const completedGuild = guilds.find((g: any) => {
    const total = (g.courseId as any)?.totalSessions ?? 0
    return total > 0 && g.currentSession >= total
  })
  if (!completedGuild) {
    return NextResponse.json({ error: 'You must complete all sessions of at least one course before applying' }, { status: 400 })
  }

  const courseCategory = (completedGuild.courseId as any)?.category
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
