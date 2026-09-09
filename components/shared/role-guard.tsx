'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import type { Role } from '@/types'

interface RoleGuardProps {
  roles: Role[]
  children: React.ReactNode
}

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const role = session?.user?.role
  const allowed = role != null && roles.includes(role)

  useEffect(() => {
    if (status === 'authenticated' && role != null && !roles.includes(role)) {
      router.push('/dashboard')
    }
  }, [status, role, roles, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (status === 'authenticated' && !allowed) {
    return null
  }

  return <>{children}</>
}