import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'

export type ApiRole = 'admin' | 'instructor' | 'student'

export type ApiUser = Awaited<ReturnType<typeof requireRole>>

export type ApiAuthResult =
  | { ok: true; user: ApiUser }
  | { ok: false; response: NextResponse }

export async function authenticate(...roles: ApiRole[]): Promise<ApiAuthResult> {
  try {
    const user = await requireRole(...roles)
    return { ok: true, user }
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      }
    }
    throw error
  }
}
