'use client'

import { useState } from 'react'
import { Check, X, Clock } from 'lucide-react'
import { Avatar, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { AttendanceStatus, RosterStudent, SessionDTO } from './types'

const STATUSES: AttendanceStatus[] = ['present', 'absent', 'late']

const STATUS_META: Record<AttendanceStatus, { label: string; icon: React.ComponentType<{ className?: string }>; cell: string; active: string }> = {
  present: { label: 'Present', icon: Check, cell: 'border-hairline-strong text-charcoal hover:bg-surface-soft', active: 'bg-success border-success text-white' },
  absent: { label: 'Absent', icon: X, cell: 'border-hairline-strong text-charcoal hover:bg-surface-soft', active: 'bg-error border-error text-white' },
  late: { label: 'Late', icon: Clock, cell: 'border-hairline-strong text-charcoal hover:bg-surface-soft', active: 'bg-warning border-warning text-white' },
}

interface AttendanceMarkProps {
  students: RosterStudent[]
  session: SessionDTO
  busy: boolean
  onSave: (records: { studentId: string; status: AttendanceStatus }[]) => Promise<void> | void
  onCancel: () => void
}

export function AttendanceMark({ students, session, busy, onSave, onCancel }: AttendanceMarkProps) {
  const initial = new Map<string, AttendanceStatus>()
  for (const s of students) initial.set(s.id, 'present')
  for (const r of session.records) initial.set(r.studentId, r.status)

  const [statuses, setStatuses] = useState(initial)
  const [searchQuery, setSearchQuery] = useState('')

  const setStatus = (id: string, status: AttendanceStatus) => {
    setStatuses((prev) => new Map(prev).set(id, status))
  }

  const filtered = students.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const counts = {
    present: students.filter((s) => statuses.get(s.id) === 'present').length,
    absent: students.filter((s) => statuses.get(s.id) === 'absent').length,
    late: students.filter((s) => statuses.get(s.id) === 'late').length,
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(
      students.map((s) => ({
        studentId: s.id,
        status: statuses.get(s.id) ?? 'present',
      }))
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-hairline bg-surface-soft/50">
      <div className="flex items-center justify-between flex-wrap gap-md px-lg py-md">
        <div className="flex items-center gap-md flex-wrap">
          <span className="text-body-sm text-charcoal font-600">Session {session.sessionNumber} attendance</span>
          <span className="text-body-sm text-success font-600">{counts.present} present</span>
          <span className="text-body-sm text-error font-600">{counts.absent} absent</span>
          <span className="text-body-sm text-warning font-600">{counts.late} late</span>
        </div>
        <div className="flex items-center gap-md">
          <Button variant="outline-dark" size="sm" type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={busy || students.length === 0}>
            {busy ? 'Saving…' : 'Save Attendance'}
          </Button>
        </div>
      </div>

      <div className="px-lg pb-lg">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search students…"
          className="w-full h-10 px-md mb-md bg-canvas text-ink text-body-sm border-b border-hairline-strong rounded-none placeholder:text-ash focus-visible:outline-none"
        />

        {students.length === 0 ? (
          <p className="text-body-sm text-mute">No students assigned to this guild yet.</p>
        ) : (
          <div className="bg-canvas border border-hairline">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-soft border-b border-hairline">
                  <th className="text-left px-lg py-sm text-caption text-charcoal font-600">Student</th>
                  {STATUSES.map((s) => (
                    <th key={s} className="text-center px-lg py-sm text-caption text-charcoal font-600 capitalize">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => {
                  const current = statuses.get(student.id) ?? 'present'
                  return (
                    <tr key={student.id} className="border-b border-hairline hover:bg-surface-soft/50">
                      <td className="px-lg py-md">
                        <div className="flex items-center gap-md">
                          <Avatar name={student.name} size="sm" src={student.avatar} />
                          <span className="text-body-sm text-ink">{student.name}</span>
                        </div>
                      </td>
                      {STATUSES.map((status) => {
                        const meta = STATUS_META[status]
                        const Icon = meta.icon
                        const isActive = current === status
                        return (
                          <td key={status} className="px-lg py-md text-center">
                            <button
                              type="button"
                              onClick={() => setStatus(student.id, status)}
                              className={cn(
                                'w-8 h-8 rounded-xs border flex items-center justify-center mx-auto transition-colors cursor-pointer',
                                isActive ? meta.active : meta.cell
                              )}
                              aria-label={`Mark ${student.name} ${status}`}
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </form>
  )
}