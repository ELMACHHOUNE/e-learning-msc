import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAnalyticsConfig, validateAnalyticsConfig } from '@/lib/analytics/config'
import { collectEvents, type CollectOutcome } from '@/lib/analytics/ingest'

validateAnalyticsConfig()

export async function POST(req: Request) {
  const config = getAnalyticsConfig()

  if (!config.enabled) {
    return NextResponse.json({ status: 'disabled' }, { status: 202 })
  }

  const contentLength = Number(req.headers.get('content-length') ?? 0)
  if (contentLength > config.maxBodyBytes) {
    return NextResponse.json({ status: 'rejected' }, { status: 413 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ status: 'rejected' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ status: 'rejected' }, { status: 400 })
  }

  const session = await auth().catch(() => null)

  const failure: CollectOutcome = { status: 'rejected', accepted: 0, error: 'Unable to record' }
  const outcome: CollectOutcome = await collectEvents(req, body, {
    userId: session?.user?.id,
    userRole: session?.user?.role,
  }).catch(() => failure)

  if (outcome.status === 'rejected') {
    const rateLimited = outcome.error === 'Rate limit exceeded'
    return NextResponse.json(
      { status: 'rejected' },
      {
        status: rateLimited ? 429 : 400,
        headers: rateLimited && outcome.retryAfter ? { 'Retry-After': String(outcome.retryAfter) } : undefined,
      },
    )
  }

  return NextResponse.json({ status: outcome.status }, { status: 202 })
}