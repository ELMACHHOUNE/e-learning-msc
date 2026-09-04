import { connectToDatabase } from '@/lib/db'
import ProjectApplication from '@/models/ProjectApplication'
import LabPhase from '@/models/LabPhase'
import User from '@/models/User'
import { generateStructured } from './provider'
import { buildProjectReviewPrompt } from './prompts'
import { ProjectFeedbackSchema, type ProjectFeedback, type ProjectReviewRequest } from './schemas'
import { AIServiceError } from './errors'

interface LabPhaseDoc {
  _id: { toString(): string }
  title: string
  description: string
  instructions: string
}

interface ProjectDoc {
  _id: { toString(): string }
  studentId: { toString(): string }
  labPhaseId: { toString(): string }
  status: string
  presentation: { url: string; validated: boolean; score?: number }
  gitRepo: { url: string; validated: boolean; score?: number }
  deployment: { url: string; validated: boolean; score?: number }
  finalGrade?: number
}

interface UserDoc {
  name: string
}

export async function processProjectReview(
  request: ProjectReviewRequest,
): Promise<ProjectFeedback> {
  await connectToDatabase()

  const project = await ProjectApplication.findById(request.projectApplicationId).lean() as ProjectDoc | null
  if (!project) {
    throw new AIServiceError('Project application not found', 'PROJECT_NOT_FOUND', 404)
  }

  const labPhase = await LabPhase.findById(project.labPhaseId).lean() as LabPhaseDoc | null
  if (!labPhase) {
    throw new AIServiceError('Lab phase not found', 'LAB_PHASE_NOT_FOUND', 404)
  }

  const student = await User.findById(project.studentId).select('name').lean() as UserDoc | null
  const studentName = student?.name ?? 'Unknown Student'

  const { system, prompt } = buildProjectReviewPrompt({
    labPhaseTitle: labPhase.title,
    labPhaseDescription: labPhase.description,
    labPhaseInstructions: labPhase.instructions,
    studentName,
    presentationUrl: project.presentation.url,
    presentationValidated: project.presentation.validated,
    presentationScore: project.presentation.score,
    gitRepoUrl: project.gitRepo.url,
    gitRepoValidated: project.gitRepo.validated,
    gitRepoScore: project.gitRepo.score,
    deploymentUrl: project.deployment.url,
    deploymentValidated: project.deployment.validated,
    deploymentScore: project.deployment.score,
    status: project.status,
    finalGrade: project.finalGrade,
  })

  const raw = await generateStructured<unknown>({ prompt, system })

  const validation = ProjectFeedbackSchema.safeParse(raw)
  if (!validation.success) {
    throw new AIServiceError(
      `AI feedback validation failed: ${validation.error.issues.map((i) => i.message).join(', ')}`,
      'AI_VALIDATION_ERROR',
      502,
    )
  }

  return validation.data
}
