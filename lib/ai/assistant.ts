import { connectToDatabase } from '@/lib/db'
import Course from '@/models/Course'
import CourseContent from '@/models/CourseContent'
import Guild from '@/models/Guild'
import User from '@/models/User'
import { generateStructured } from './provider'
import { buildAssistantPrompt } from './prompts'
import { AssistantResponseSchema, type AssistantResponse, type AssistantRequest } from './schemas'
import { AIServiceError } from './errors'

interface CourseDoc {
  _id: { toString(): string }
  title: string
  description: string
}

interface ContentDoc {
  courseId: { toString(): string }
  content: Array<{
    title: string
    chapters: Array<{
      title: string
      lessons: Array<{
        title: string
        content: string
        type: string
      }>
    }>
  }>
}

export async function processAssistantRequest(
  userId: string,
  request: AssistantRequest,
): Promise<AssistantResponse> {
  await connectToDatabase()

  const course = await Course.findById(request.courseId).lean() as CourseDoc | null
  if (!course) {
    throw new AIServiceError('Course not found', 'COURSE_NOT_FOUND', 404)
  }

  const user = await User.findById(userId).lean() as { role?: string } | null
  const isInstructorOrAdmin = user?.role === 'instructor' || user?.role === 'admin'

  if (!isInstructorOrAdmin) {
    const isEnrolled = await Guild.exists({
      courseId: request.courseId,
      studentIds: userId,
    })
    if (!isEnrolled) {
      throw new AIServiceError('You are not enrolled in this course', 'FORBIDDEN', 403)
    }
  }

  let contentTitle: string | undefined
  let contentBody: string | undefined

  if (request.contentId) {
    const content = await CourseContent.findOne({ courseId: request.courseId }).lean() as ContentDoc | null
    if (content) {
      for (const mod of content.content) {
        for (const ch of mod.chapters) {
          for (const lesson of ch.lessons) {
            if (lesson.title === request.contentId) {
              contentTitle = lesson.title
              contentBody = lesson.content
              break
            }
          }
        }
      }
    }
  }

  const { system, prompt } = buildAssistantPrompt({
    courseTitle: course.title,
    courseDescription: course.description,
    contentTitle,
    contentBody,
    studentMessage: request.message,
  })

  const raw = await generateStructured<unknown>({ prompt, system })

  const validation = AssistantResponseSchema.safeParse(raw)
  if (!validation.success) {
    throw new AIServiceError(
      `AI response validation failed: ${validation.error.issues.map((i) => i.message).join(', ')}`,
      'AI_VALIDATION_ERROR',
      502,
    )
  }

  return validation.data
}
