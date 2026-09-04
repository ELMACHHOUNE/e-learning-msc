import { connectToDatabase } from '@/lib/db'
import Course from '@/models/Course'
import CourseContent from '@/models/CourseContent'
import { generateStructured } from './provider'
import { buildQuizPrompt } from './prompts'
import { QuizOutputSchema, type QuizOutput, type QuizRequest } from './schemas'
import { AIServiceError } from './errors'

interface CourseDoc {
  _id: { toString(): string }
  title: string
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

export async function processQuizRequest(
  request: QuizRequest,
): Promise<QuizOutput> {
  await connectToDatabase()

  const course = await Course.findById(request.courseId).lean() as CourseDoc | null
  if (!course) {
    throw new AIServiceError('Course not found', 'COURSE_NOT_FOUND', 404)
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

  const { system, prompt } = buildQuizPrompt({
    courseTitle: course.title,
    contentTitle,
    contentBody,
    questionCount: request.questionCount,
    difficulty: request.difficulty,
  })

  const raw = await generateStructured<unknown>({ prompt, system })

  const validation = QuizOutputSchema.safeParse(raw)
  if (!validation.success) {
    throw new AIServiceError(
      `AI quiz response validation failed: ${validation.error.issues.map((i) => i.message).join(', ')}`,
      'AI_VALIDATION_ERROR',
      502,
    )
  }

  return validation.data
}
