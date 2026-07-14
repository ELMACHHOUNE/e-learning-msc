import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import ProjectApplication from '@/models/ProjectApplication'
import Guild from '@/models/Guild'
import type { ProjectStep } from '@/types'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const role = (session.user as any).role
  const { id } = await params

  const body = await req.json()
  const { action } = body

  if (!action) return NextResponse.json({ error: 'Action is required' }, { status: 400 })

  await connectToDatabase()

  const project = await ProjectApplication.findById(id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Approve by instructor
  if (action === 'approve') {
    if (role !== 'instructor' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const guild = await Guild.findById(project.guildId)
    if (guild && guild.instructorId.toString() !== userId && role !== 'admin') {
      return NextResponse.json({ error: 'Not your student' }, { status: 403 })
    }

    if (project.status !== 'pending') {
      return NextResponse.json({ error: 'Project is not pending' }, { status: 400 })
    }

    project.status = 'approved'
    await project.save()

    return NextResponse.json({ success: true, status: project.status })
  }

  // Reject by instructor
  if (action === 'reject') {
    if (role !== 'instructor' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (project.status !== 'pending') {
      return NextResponse.json({ error: 'Project is not pending' }, { status: 400 })
    }

    project.status = 'rejected'
    await project.save()

    return NextResponse.json({ success: true, status: project.status })
  }

  // Submit step by student
  if (action === 'submit-step') {
    if (project.studentId.toString() !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (project.status !== 'approved' && project.status !== 'in_progress') {
      return NextResponse.json({ error: 'Project not in progress' }, { status: 400 })
    }

    const { step, url } = body as { step: ProjectStep; url: string }
    if (!step || !['presentation', 'gitRepo', 'deployment'].includes(step)) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
    }
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const steps = ['presentation', 'gitRepo', 'deployment'] as ProjectStep[]
    const stepIndex = steps.indexOf(step)

    // Previous steps must be validated first
    if (stepIndex > 0) {
      const prevStep = steps[stepIndex - 1]
      if (!(project as any)[prevStep]?.validated) {
        return NextResponse.json({ error: `Previous step "${prevStep}" must be validated first` }, { status: 400 })
      }
    }

    ;(project as any)[step].url = url
    project.status = 'in_progress'
    await project.save()

    return NextResponse.json({ success: true, step, url })
  }

  // Validate step by instructor
  if (action === 'validate-step') {
    if (role !== 'instructor' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const guild = await Guild.findById(project.guildId)
    if (guild && guild.instructorId.toString() !== userId && role !== 'admin') {
      return NextResponse.json({ error: 'Not your student' }, { status: 403 })
    }

    const { step, score } = body as { step: ProjectStep; score: number }
    if (!step || !['presentation', 'gitRepo', 'deployment'].includes(step)) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
    }
    if (score === undefined || score < 0 || score > 10) {
      return NextResponse.json({ error: 'Score must be between 0 and 10' }, { status: 400 })
    }

    const stepEntry = (project as any)[step]
    if (!stepEntry?.url) {
      return NextResponse.json({ error: 'Student has not submitted this step yet' }, { status: 400 })
    }

    stepEntry.score = score
    stepEntry.validated = true
    await project.save()

    // Check if all steps are validated
    const allValidated = ['presentation', 'gitRepo', 'deployment'].every(
      (s) => (project as any)[s]?.validated
    )
    if (allValidated) {
      const presentationScore = (project as any).presentation.score ?? 0
      const gitScore = (project as any).gitRepo.score ?? 0
      const deploymentScore = (project as any).deployment.score ?? 0
      const average = ((presentationScore + gitScore + deploymentScore) / 30) * 100
      project.finalGrade = Math.round(average)
      project.status = 'completed'
      await project.save()
    }

    const allDone = ['presentation', 'gitRepo', 'deployment'].every((s) => (project as any)[s]?.validated)

    return NextResponse.json({
      success: true,
      step,
      score,
      finalGrade: project.finalGrade,
      status: project.status,
      allStepsValidated: allDone,
    })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
