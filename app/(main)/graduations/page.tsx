'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Search, Award, GraduationCap, Layers, Calendar } from 'lucide-react'
import { Badge, Avatar, Button } from '@/components/ui'
import LogoSpinner from '@/components/shared/logo-spinner'
import { CertificateDialog } from '@/components/certificate/certificate-dialog'
import type { CertificateData } from '@/types/certificate'

interface Graduate {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  courseId: string
  courseTitle: string
  instructorName: string
  academyName: string
  durationF: string
  formationDate: string
  certificateId: string
  graduatedAt: string
  createdAt: string
}

function formatGraduatedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function GraduationsPage() {
  const { data: session, status } = useSession()
  const [graduates, setGraduates] = useState<Graduate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Graduate | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/certificates', { cache: 'no-store' })
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Failed to fetch graduates' }))
          throw new Error(data.error ?? 'Failed to fetch graduates')
        }
        const data = await res.json()
        setGraduates(JSON.parse(JSON.stringify(data.certificates ?? [])))
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const isAdmin = status === 'authenticated' && session?.user?.role === 'admin'

  const filtered = graduates.filter(
    (g) =>
      g.studentName.toLowerCase().includes(search.toLowerCase()) ||
      g.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
      g.courseTitle.toLowerCase().includes(search.toLowerCase())
  )

  const graduatedThisYear = graduates.filter(
    (g) => new Date(g.graduatedAt).getFullYear() === new Date().getFullYear()
  ).length
  const programsCompleted = new Set(graduates.map((g) => g.courseId)).size

  if (loading) return <LogoSpinner />

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <div>
          <h1 className="text-display-md text-ink font-700 leading-[0.95]">Graduations</h1>
          <p className="text-body-sm text-mute mt-sm">
            Students who completed 100% of the platform — courses, checkpoints, and lab phases
          </p>
        </div>
        <Badge variant="new">Graduates</Badge>
      </div>

      {error && isAdmin && (
        <div className="bg-canvas border border-hairline py-xxxl text-center mb-xxl">
          <p className="text-body-md text-mute">{error}</p>
        </div>
      )}

      {!error && isAdmin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xxl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="bg-canvas border border-hairline p-xl"
            >
              <div className="w-10 h-10 bg-primary text-on-primary flex items-center justify-center mb-md">
                <GraduationCap className="w-5 h-5" />
              </div>
              <p className="text-display-lg text-ink font-700 leading-[0.95] mb-xs">{graduates.length}</p>
              <p className="text-body-sm text-mute">Total Graduates</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-canvas border border-hairline p-xl"
            >
              <div className="w-10 h-10 bg-success text-on-primary flex items-center justify-center mb-md">
                <Calendar className="w-5 h-5" />
              </div>
              <p className="text-display-lg text-ink font-700 leading-[0.95] mb-xs">{graduatedThisYear}</p>
              <p className="text-body-sm text-mute">Graduated This Year</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-canvas border border-hairline p-xl"
            >
              <div className="w-10 h-10 bg-info text-on-primary flex items-center justify-center mb-md">
                <Layers className="w-5 h-5" />
              </div>
              <p className="text-display-lg text-ink font-700 leading-[0.95] mb-xs">{programsCompleted}</p>
              <p className="text-body-sm text-mute">Programs Completed</p>
            </motion.div>
          </div>

          <div className="relative w-72 mb-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search graduates..."
              className="w-full h-10 pl-10 pr-md bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="bg-canvas border border-hairline py-xxxl text-center">
              <Award className="w-10 h-10 text-mute mx-auto mb-lg" />
              <p className="text-body-md text-mute">
                {graduates.length === 0
                  ? 'No graduates yet. Students appear here once they complete all courses and lab phases.'
                  : 'No graduates match your search'}
              </p>
            </div>
          ) : (
            <div className="bg-canvas border border-hairline overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline bg-surface-soft">
                    <th className="text-left px-lg py-md text-caption text-charcoal font-600">Graduate</th>
                    <th className="text-left px-lg py-md text-caption text-charcoal font-600">Program</th>
                    <th className="text-left px-lg py-md text-caption text-charcoal font-600">Instructor</th>
                    <th className="text-left px-lg py-md text-caption text-charcoal font-600">Graduated On</th>
                    <th className="text-left px-lg py-md text-caption text-charcoal font-600">Certificate ID</th>
                    <th className="text-right px-lg py-md text-caption text-charcoal font-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((g) => (
                    <tr key={g.id} className="border-b border-hairline hover:bg-surface-soft/50">
                      <td className="px-lg py-md">
                        <div className="flex items-center gap-md">
                          <Avatar name={g.studentName} size="sm" />
                          <div>
                            <p className="text-body-sm text-ink">{g.studentName}</p>
                            <p className="text-caption text-mute">{g.studentEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-lg py-md text-body-sm text-charcoal">{g.courseTitle}</td>
                      <td className="px-lg py-md text-body-sm text-charcoal">{g.instructorName}</td>
                      <td className="px-lg py-md text-body-sm text-charcoal">{formatGraduatedAt(g.graduatedAt)}</td>
                      <td className="px-lg py-md">
                        <code className="text-caption text-ink bg-surface-soft border border-hairline px-sm py-xs">
                          {g.certificateId}
                        </code>
                      </td>
                      <td className="px-lg py-md text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelected(g)}
                          className="gap-1.5"
                        >
                          <Award className="w-4 h-4" /> Certificate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!error && !isAdmin && (
        <div className="bg-canvas border border-hairline py-xxxl text-center">
          <p className="text-body-md text-mute">Admin access required</p>
        </div>
      )}

      {selected && (
        <CertificateDialog
          open
          onClose={() => setSelected(null)}
          data={
            {
              studentFullName: selected.studentName,
              durationF: selected.durationF,
              formationDate: selected.formationDate,
              certificateId: selected.certificateId,
              instructorName: selected.instructorName,
              academyName: selected.academyName,
            } satisfies CertificateData
          }
        />
      )}
    </div>
  )
}
