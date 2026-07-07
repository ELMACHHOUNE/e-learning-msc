'use client'

import { useState } from 'react'
import { Button, Badge, Avatar, Progress } from '@/components/ui'
import { Search, Mail, MessageCircle } from 'lucide-react'

const students = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', program: 'Software Engineering', progress: 100, status: 'green' as const },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', program: 'Data Science', progress: 72, status: 'blue' as const },
  { id: '3', name: 'Carol White', email: 'carol@example.com', program: 'Software Engineering', progress: 45, status: 'orange' as const },
  { id: '4', name: 'David Brown', email: 'david@example.com', program: 'UI/UX Design', progress: 28, status: 'red' as const },
  { id: '5', name: 'Eve Davis', email: 'eve@example.com', program: 'Data Science', progress: 91, status: 'green' as const },
]

const statusColors = {
  green: 'bg-success',
  blue: 'bg-info',
  orange: 'bg-warning',
  red: 'bg-error',
}

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <th className="text-left px-lg py-md text-caption text-charcoal font-600">Progress</th>
              <th className="text-right px-lg py-md text-caption text-charcoal font-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((student) => (
              <tr key={student.id} className="border-b border-hairline hover:bg-surface-soft/50">
                <td className="px-lg py-md">
                  <div className="flex items-center gap-md">
                    <Avatar name={student.name} size="sm" />
                    <div>
                      <p className="text-body-sm text-ink">{student.name}</p>
                      <p className="text-caption text-mute">{student.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-lg py-md text-body-sm text-charcoal">{student.program}</td>
                <td className="px-lg py-md">
                  <div className="flex items-center gap-md max-w-[200px]">
                    <Progress value={student.progress} />
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusColors[student.status]}`} />
                    <span className="text-caption text-charcoal shrink-0">{student.progress}%</span>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
