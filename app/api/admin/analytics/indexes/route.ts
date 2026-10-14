import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { ensureAnalyticsIndexes } from '@/lib/analytics/indexes'

export const dynamic = 'force-dynamic'

/**
 * Idempotent index bootstrap for hosts where the CLI script cannot reach MongoDB
 * (the standalone Docker image ships no `scripts/` directory). Admin only.
 */
export async function POST() {
  try {
    await requireRole('admin')
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }

  try {
    return NextResponse.json(await ensureAnalyticsIndexes(), { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ error: 'Unable to create analytics indexes' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Use POST' }, { status: 405 })
}