'use client'

import { useState } from 'react'
import { Button, Badge, Avatar, Progress } from '@/components/ui'
import { Search, ExternalLink, GitBranch } from 'lucide-react'

const projects = [
  { id: '1', title: 'E-Commerce Platform', student: 'Alice Johnson', status: 'submitted' as const, grade: 92, repo: 'github.com/alice/ecommerce' },
  { id: '2', title: 'Weather Dashboard', student: 'Bob Smith', status: 'in-review' as const, grade: null, repo: 'github.com/bob/weather' },
  { id: '3', title: 'Task Management App', student: 'Carol White', status: 'revision' as const, grade: 68, repo: 'github.com/carol/tasks' },
  { id: '4', title: 'Portfolio Website', student: 'David Brown', status: 'draft' as const, grade: null, repo: 'github.com/david/portfolio' },
]

const statusConfig = {
  submitted: { variant: 'success' as const, label: 'Submitted' },
  'in-review': { variant: 'info' as const, label: 'In Review' },
  revision: { variant: 'warning' as const, label: 'Needs Revision' },
  draft: { variant: 'default' as const, label: 'Draft' },
}

export default function StudentProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.student.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <h1 className="text-display-md text-ink font-700 leading-[0.95]">Student Projects</h1>
      </div>

      <div className="relative w-72 mb-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects..."
          className="w-full h-10 pl-10 pr-md bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none"
        />
      </div>

      <div className="bg-canvas border border-hairline overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline bg-surface-soft">
              <th className="text-left px-lg py-md text-caption text-charcoal font-600">Project</th>
              <th className="text-left px-lg py-md text-caption text-charcoal font-600">Student</th>
              <th className="text-left px-lg py-md text-caption text-charcoal font-600">Status</th>
              <th className="text-left px-lg py-md text-caption text-charcoal font-600">Grade</th>
              <th className="text-right px-lg py-md text-caption text-charcoal font-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((project) => {
              const config = statusConfig[project.status]
              return (
                <tr key={project.id} className="border-b border-hairline hover:bg-surface-soft/50">
                  <td className="px-lg py-md">
                    <p className="text-body-sm text-ink font-600">{project.title}</p>
                  </td>
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-md">
                      <Avatar name={project.student} size="sm" />
                      <span className="text-body-sm text-charcoal">{project.student}</span>
                    </div>
                  </td>
                  <td className="px-lg py-md">
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </td>
                  <td className="px-lg py-md">
                    {project.grade !== null ? (
                      <span className={`text-body-sm font-600 ${project.grade >= 90 ? 'text-success' : project.grade >= 70 ? 'text-info' : 'text-warning'}`}>
                        {project.grade}%
                      </span>
                    ) : (
                      <span className="text-body-sm text-mute">—</span>
                    )}
                  </td>
                  <td className="px-lg py-md text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-strong rounded-xs cursor-pointer text-charcoal hover:text-ink">
                        <GitBranch className="w-4 h-4" />
                      </button>
                      <Button variant="primary" size="sm">
                        Review <ExternalLink className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
