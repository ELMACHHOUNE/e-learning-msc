import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { ProjectReviewRequestSchema, processProjectReview } from '@/lib/ai'
import { AIServiceError } from '@/lib/ai'

export async function POST(req: Request) {
  try {
    await requireRole('instructor', 'admin')
    const body = await req.json()

    const validation = ProjectReviewRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues.map((i) => i.message) },
        { status: 400 },
      )
    }

    const response = await processProjectReview(validation.data)

    return NextResponse.json(response)
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
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
