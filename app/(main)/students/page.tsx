'use client'

import { useState, useEffect } from 'react'
import { Button, Badge, Avatar, Progress } from '@/components/ui'
import { Search, Mail, MessageCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface StudentGuild {
  id: string
  name: string
  courseTitle: string
  instructorName?: string
}

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  role: string
  createdAt: string
  guilds: StudentGuild[]
}

function getProgressColor(percent: number) {
  if (percent >= 100) return 'bg-success'
  if (percent >= 70) return 'bg-info'
  if (percent >= 40) return 'bg-warning'
  return 'bg-error'
}

export default function StudentsPage() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch('/api/students')
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to fetch students')
        }
        const data = await res.json()
        setStudents(data.students)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
  }, [])

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isAdmin = session?.user?.role === 'admin'

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-xl py-xxl">
        <p className="text-ink">Loading students...</p>
      </div>
    )
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
        <h1 className="text-display-md text-ink font-700 leading-[0.95]">My Students</h1>
        <Badge variant="new">{students.length} Total</Badge>
      </div>

      <div className="relative w-72 mb-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search students..."
          className="w-full h-10 pl-10 pr-md bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none"
        />
      </div>

      <div className="bg-canvas border border-hairline overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline bg-surface-soft">
              <th className="text-left px-lg py-md text-caption text-charcoal font-600">Student</th>
              <th className="text-left px-lg py-md text-caption text-charcoal font-600">Program</th>
              {isAdmin && <th className="text-left px-lg py-md text-caption text-charcoal font-600">Instructor</th>}
              <th className="text-left px-lg py-md text-caption text-charcoal font-600">Progress</th>
              <th className="text-right px-lg py-md text-caption text-charcoal font-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((student) => {
              const progress = student.guilds.length > 0
                ? Math.round(student.guilds.length * 30)
                : 0
              const clamped = Math.min(progress, 100)

              return (
                <tr key={student.id} className="border-b border-hairline hover:bg-surface-soft/50">
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-md">
                      <Avatar name={student.name} size="sm" src={student.avatar} />
                      <div>
                        <p className="text-body-sm text-ink">{student.name}</p>
                        <p className="text-caption text-mute">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-lg py-md text-body-sm text-charcoal">
                    {student.guilds.map((g) => g.courseTitle).join(', ') || '—'}
                  </td>
                  {isAdmin && (
                    <td className="px-lg py-md text-body-sm text-charcoal">
                      {student.guilds.map((g) => g.instructorName).filter(Boolean).join(', ') || '—'}
                    </td>
                  )}
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-md max-w-[200px]">
                      <Progress value={clamped} />
                      <span className={`w-2 h-2 rounded-full shrink-0 ${getProgressColor(clamped)}`} />
                      <span className="text-caption text-charcoal shrink-0">{clamped}%</span>
                    </div>
                  </td>
                  <td className="px-lg py-md text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-strong rounded-xs cursor-pointer text-charcoal hover:text-ink">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-strong rounded-xs cursor-pointer text-charcoal hover:text-ink">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-lg py-xl text-center text-mute text-body-sm">
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
