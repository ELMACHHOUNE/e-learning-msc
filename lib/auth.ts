import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import type { Role } from '@/types'

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user as { id: string; name: string; email: string; image?: string; role: Role } | undefined
}

export async function requireRole(...roles: Role[]) {
  const session = await getSession()
  const user = session?.user as { id: string; role: Role } | undefined
  if (!user) throw new Error('Unauthorized')
  if (roles.length > 0 && !roles.includes(user.role)) {
    throw new Error('Forbidden')
  }
  return user
}
