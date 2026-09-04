import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import AIQuizDraft from '@/models/AIQuizDraft'
import { AIServiceError } from '@/lib/ai'
import { z } from 'zod'

const QuizDraftSchema = z.object({
  courseId: z.string().min(1),
  contentId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  questions: z.array(z.object({
    question: z.string().min(1),
    options: z.array(z.string()).min(2),
    correctAnswer: z.string().min(1),
    explanation: z.string().min(1),
  })).min(1).max(20),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
})

export async function GET() {
  try {
    const user = await requireRole('instructor', 'admin')
    await connectToDatabase()

    const drafts = await AIQuizDraft.find({ createdBy: user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    return NextResponse.json(drafts)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      if (error.message === 'Forbidden') {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireRole('instructor', 'admin')
    const body = await req.json()

    const validation = QuizDraftSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues.map((i) => i.message) },
        { status: 400 },
      )
    }

    await connectToDatabase()

    const draft = await AIQuizDraft.create({
      createdBy: user.id,
      courseId: validation.data.courseId,
      contentId: validation.data.contentId,
      title: validation.data.title,
      description: validation.data.description,
      questions: validation.data.questions,
      difficulty: validation.data.difficulty,
      aiModel: process.env.OLLAMA_MODEL ?? 'unknown',
      aiGenerationTime: 0,
    })

    return NextResponse.json(draft, { status: 201 })
  } catch (error) {
    if (error instanceof AIServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      )
    }
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      if (error.message === 'Forbidden') {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
