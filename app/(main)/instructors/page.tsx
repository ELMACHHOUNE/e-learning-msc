'use client'

import { useState, useEffect } from 'react'
import LogoSpinner from '@/components/shared/logo-spinner'
import { Badge, Avatar } from '@/components/ui'
import { Search, MessageCircle, Phone } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface InstructorGuild {
  id: string
  name: string
  courseTitle: string
  studentCount: number
}

interface Instructor {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  role: string
  createdAt: string
  guilds: InstructorGuild[]
  totalStudents: number
  totalGuilds: number
}

export default function InstructorsPage() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchInstructors() {
      try {
        const res = await fetch('/api/instructors')
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to fetch instructors')
        }
        const data = await res.json()
        setInstructors(data.instructors)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchInstructors()
  }, [])

  const filtered = instructors.filter((inst) =>
    inst.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isAdmin = session?.user?.role === 'admin'

  if (status === 'loading') {
    return <LogoSpinner />
  }

  if (!isAdmin) {
    return (
      <div className="max-w-[1440px] mx-auto px-xl py-xxl">
        <p className="text-error">Access denied. Admin only.</p>
      </div>
    )
  }

  if (loading) {
    return <LogoSpinner />
  }

  if (error) {
    return (
      <div className="max-w-[1440px] mx-auto px-xl py-xxl">
        <p className="text-error">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <h1 className="text-display-md text-ink font-700 leading-[0.95]">Instructors</h1>
        <Badge variant="new">{instructors.length} Total</Badge>
      </div>

      <div className="relative w-72 mb-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search instructors..."
          className="w-full h-10 pl-10 pr-md bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none"
        />
      </div>

      <div className="bg-canvas border border-hairline overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline bg-surface-soft">
              <th className="text-left px-lg py-md text-caption text-charcoal font-600">Instructor</th>
              <th className="text-left px-lg py-md text-caption text-charcoal font-600">Phone</th>
              <th className="text-left px-lg py-md text-caption text-charcoal font-600">Guilds</th>
              <th className="text-left px-lg py-md text-caption text-charcoal font-600">Total Students</th>
              <th className="text-right px-lg py-md text-caption text-charcoal font-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inst) => (
              <tr key={inst.id} className="border-b border-hairline hover:bg-surface-soft/50">
                <td className="px-lg py-md">
                  <div className="flex items-center gap-md">
                    <Avatar name={inst.name} size="sm" src={inst.avatar} />
                    <div>
                      <p className="text-body-sm text-ink">{inst.name}</p>
                      <p className="text-caption text-mute">{inst.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-lg py-md text-body-sm text-charcoal">
                  {inst.phone || '—'}
                </td>
                <td className="px-lg py-md text-body-sm text-charcoal">
                  {inst.totalGuilds}
                </td>
                <td className="px-lg py-md text-body-sm text-charcoal">
                  {inst.totalStudents}
                </td>
                <td className="px-lg py-md text-right">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={`mailto:${inst.email}`}
                      className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-strong rounded-xs text-charcoal hover:text-ink hover:bg-surface-soft transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                    {inst.phone && (
                      <a
                        href={`https://wa.me/${inst.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-strong rounded-xs text-charcoal hover:text-[#25D366] hover:bg-surface-soft transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-lg py-xl text-center text-mute text-body-sm">
                  No instructors found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
