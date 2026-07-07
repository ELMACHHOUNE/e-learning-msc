'use client'

import { useState } from 'react'
import { Button, Badge, Avatar } from '@/components/ui'
import { Search, Check, X, Clock } from 'lucide-react'

type AttendanceStatus = 'present' | 'absent' | 'late'

interface StudentRecord {
  id: string
  name: string
  status: AttendanceStatus
}

const initialStudents: StudentRecord[] = [
  { id: '1', name: 'Alice Johnson', status: 'present' },
  { id: '2', name: 'Bob Smith', status: 'present' },
  { id: '3', name: 'Carol White', status: 'absent' },
  { id: '4', name: 'David Brown', status: 'late' },
  { id: '5', name: 'Eve Davis', status: 'present' },
]

export default function AttendancePage() {
  const [students, setStudents] = useState(initialStudents)
  const [searchQuery, setSearchQuery] = useState('')

  const updateStatus = (id: string, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    )
  }

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    present: students.filter((s) => s.status === 'present').length,
    absent: students.filter((s) => s.status === 'absent').length,
    late: students.filter((s) => s.status === 'late').length,
  }

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <h1 className="text-display-md text-ink font-700 leading-[0.95]">Attendance</h1>
        <div className="flex items-center gap-lg">
          <Badge variant="success">{stats.present} Present</Badge>
          <Badge variant="error">{stats.absent} Absent</Badge>
          <Badge variant="warning">{stats.late} Late</Badge>
        </div>
      </div>

      <div className="flex items-center justify-between mb-lg">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="w-full h-10 pl-10 pr-md bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none"
          />
        </div>
        <p className="text-body-sm text-mute">Session 54 - Sep 15, 2026</p>
      </div>

      <div className="bg-canvas border border-hairline overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline bg-surface-soft">
              <th className="text-left px-lg py-md text-caption text-charcoal font-600">Student</th>
              <th className="text-center px-lg py-md text-caption text-charcoal font-600">Present</th>
              <th className="text-center px-lg py-md text-caption text-charcoal font-600">Absent</th>
              <th className="text-center px-lg py-md text-caption text-charcoal font-600">Late</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((student) => (
              <tr key={student.id} className="border-b border-hairline hover:bg-surface-soft/50">
                <td className="px-lg py-md">
                  <div className="flex items-center gap-md">
                    <Avatar name={student.name} size="sm" />
                    <span className="text-body-sm text-ink">{student.name}</span>
                  </div>
                </td>
                {(['present', 'absent', 'late'] as AttendanceStatus[]).map((status) => {
                  const isActive = student.status === status
                  return (
                    <td key={status} className="px-lg py-md text-center">
                      <button
                        onClick={() => updateStatus(student.id, status)}
                        className={`w-8 h-8 rounded-xs border transition-colors cursor-pointer bg-transparent flex items-center justify-center mx-auto ${
                          isActive
                            ? status === 'present'
                              ? 'bg-success border-success text-white'
                              : status === 'absent'
                              ? 'bg-error border-error text-white'
                              : 'bg-warning border-warning text-white'
                            : 'border-hairline-strong text-charcoal hover:bg-surface-soft'
                        }`}
                      >
                        {status === 'present' && <Check className="w-4 h-4" />}
                        {status === 'absent' && <X className="w-4 h-4" />}
                        {status === 'late' && <Clock className="w-4 h-4" />}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-md mt-lg">
        <Button variant="outline-dark">Cancel</Button>
        <Button variant="primary">Save Attendance</Button>
      </div>
    </div>
  )
}
