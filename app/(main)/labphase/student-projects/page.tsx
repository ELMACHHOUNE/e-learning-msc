'use client'

import { useState, useEffect } from 'react'
import { Button, Badge, Avatar } from '@/components/ui'
import LogoSpinner from '@/components/shared/logo-spinner'
import { toast } from '@/components/ui/alert'
import { Search, CheckCircle, XCircle, ExternalLink, Send, X, Save } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface StepData {
  url: string
  score?: number
  validated: boolean
}

interface ProjectData {
  id: string
  studentId: string
  student: { id: string; name: string; email: string; avatar?: string } | null
  labPhaseId: string
  labPhaseTitle: string
  guildId?: string
  guildName?: string
  status: string
  presentation: StepData
  gitRepo: StepData
  deployment: StepData
  finalGrade?: number
  createdAt: string
}

const statusConfig: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending Approval' },
  approved: { variant: 'info', label: 'Approved' },
  in_progress: { variant: 'info', label: 'In Progress' },
  completed: { variant: 'success', label: 'Completed' },
  rejected: { variant: 'error', label: 'Rejected' },
}

const stepMeta = {
  presentation: { label: 'Presentation (Canva)', placeholder: 'https://www.canva.com/...' },
  gitRepo: { label: 'Git Repository', placeholder: 'https://github.com/...' },
  deployment: { label: 'Deployed Version', placeholder: 'https://your-app.vercel.app/...' },
} as const

type StepKey = keyof typeof stepMeta

function ApplyModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [labPhases, setLabPhases] = useState<{ id: string; title: string; category?: string }[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [saving, setSaving] = useState(false)
  const [myCategory, setMyCategory] = useState('')

  useEffect(() => {
    async function init() {
      try {
        const [lpRes, dashRes] = await Promise.all([
          fetch('/api/admin/labphases'),
          fetch('/api/dashboard'),
        ])
        if (lpRes.ok) {
          const lpData = await lpRes.json()
          setLabPhases(lpData.labphases ?? [])
        }
        if (dashRes.ok) {
          const dashData = await dashRes.json()
          if (dashData.guilds?.length > 0) {
            const g = dashData.guilds.find((g: { currentSession: number; totalSessions: number }) => g.currentSession >= g.totalSessions) ?? dashData.guilds[0]
            if (g.courseCategory) setMyCategory(g.courseCategory)
          }
        }
      } catch {}
    }
    init()
  }, [])

  async function handleApply() {
    if (!selectedId) {
      toast({ variant: 'error', title: 'Select a lab phase' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labPhaseId: selectedId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: 'error', title: 'Failed to apply', message: data.error })
        return
      }
      toast({ variant: 'success', title: 'Application submitted' })
      onSave()
      onClose()
    } catch {
      toast({ variant: 'error', title: 'Failed to apply' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/45 grid place-items-center" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-canvas border border-hairline shadow-lg w-[420px] max-w-[calc(100vw-2rem)] flex flex-col">
        <div className="flex items-center justify-between px-xl py-lg border-b border-hairline">
          <h2 className="text-heading-sm text-ink font-700">Apply for Lab Phase</h2>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-mute hover:text-ink p-0"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-xl">
          {myCategory && (
            <p className="text-caption text-mute mb-3">Showing lab phases for <span className="font-600 text-ink">{myCategory}</span></p>
          )}
          {labPhases.length === 0 ? (
            <p className="text-body-sm text-mute">No lab phases available</p>
          ) : (
            <div className="space-y-md">
              {labPhases
                .filter((lp) => !myCategory || !lp.category || lp.category === myCategory)
                .map((lp) => (
                  <label key={lp.id} className="flex items-center gap-3 p-lg border border-hairline cursor-pointer hover:bg-surface-soft transition-colors">
                    <input type="radio" name="labPhase" value={lp.id} onChange={() => setSelectedId(lp.id)} checked={selectedId === lp.id} className="accent-ink" />
                    <div>
                      <span className="text-body-sm text-ink">{lp.title}</span>
                      {lp.category && <span className="text-caption text-mute ml-2">({lp.category})</span>}
                    </div>
                  </label>
                ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-md p-xl border-t border-hairline">
          <Button variant="outline-dark" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleApply} disabled={saving || !selectedId}>
            <Send className="w-4 h-4 mr-1" /> Apply
          </Button>
        </div>
      </div>
    </div>
  )
}

function StepModal({
  project,
  step,
  onClose,
  onSave,
}: {
  project: ProjectData
  step: StepKey
  onClose: () => void
  onSave: () => void
}) {
  const [url, setUrl] = useState(project[step]?.url ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!url.trim()) {
      toast({ variant: 'error', title: 'URL is required' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit-step', step, url }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: 'error', title: 'Failed to submit', message: data.error })
        return
      }
      toast({ variant: 'success', title: `${stepMeta[step].label} submitted` })
      onSave()
      onClose()
    } catch {
      toast({ variant: 'error', title: 'Failed to submit' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/45 grid place-items-center" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-canvas border border-hairline shadow-lg w-[420px] max-w-[calc(100vw-2rem)] flex flex-col">
        <div className="flex items-center justify-between px-xl py-lg border-b border-hairline">
          <h2 className="text-heading-sm text-ink font-700">Submit {stepMeta[step].label}</h2>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-mute hover:text-ink p-0"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-xl">
          <label className="text-caption text-mute uppercase tracking-widest font-600 mb-1.5 block">URL</label>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={stepMeta[step].placeholder} className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2.5 rounded-xs outline-none focus:border-ink transition-colors" />
        </div>
        <div className="flex justify-end gap-md p-xl border-t border-hairline">
          <Button variant="outline-dark" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> Submit
          </Button>
        </div>
      </div>
    </div>
  )
}

function ValidateModal({
  project,
  step,
  onClose,
  onSave,
}: {
  project: ProjectData
  step: StepKey
  onClose: () => void
  onSave: () => void
}) {
  const [score, setScore] = useState(0)
  const [saving, setSaving] = useState(false)
  const current = project[step]

  async function handleValidate() {
    if (score < 0 || score > 10) {
      toast({ variant: 'error', title: 'Score must be between 0 and 10' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate-step', step, score }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: 'error', title: 'Failed to validate', message: data.error })
        return
      }
      toast({ variant: 'success', title: `${stepMeta[step].label} scored ${score}/10` })
      onSave()
      onClose()
    } catch {
      toast({ variant: 'error', title: 'Failed to validate' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/45 grid place-items-center" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-canvas border border-hairline shadow-lg w-[420px] max-w-[calc(100vw-2rem)] flex flex-col">
        <div className="flex items-center justify-between px-xl py-lg border-b border-hairline">
          <h2 className="text-heading-sm text-ink font-700">Validate {stepMeta[step].label}</h2>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-mute hover:text-ink p-0"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-xl space-y-lg">
          <div>
            <label className="text-caption text-mute uppercase tracking-widest font-600 mb-1.5 block">Submitted URL</label>
            <a href={current.url} target="_blank" rel="noopener noreferrer" className="text-body-sm text-ink underline break-all">{current.url}</a>
          </div>
          <div>
            <label className="text-caption text-mute uppercase tracking-widest font-600 mb-1.5 block">Score (0–10)</label>
            <input type="number" min={0} max={10} value={score} onChange={(e) => setScore(Number(e.target.value))} className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2.5 rounded-xs outline-none focus:border-ink transition-colors" />
          </div>
        </div>
        <div className="flex justify-end gap-md p-xl border-t border-hairline">
          <Button variant="outline-dark" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleValidate} disabled={saving}>
            <CheckCircle className="w-4 h-4 mr-1" /> Validate
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function StudentProjectsPage() {
  const { data: session } = useSession()
  const role = session?.user?.role
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showApply, setShowApply] = useState(false)
  const [submitStep, setSubmitStep] = useState<{ project: ProjectData; step: StepKey } | null>(null)
  const [validateStep, setValidateStep] = useState<{ project: ProjectData; step: StepKey } | null>(null)

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects)
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchProjects() }, [])

  async function handleAction(id: string, action: string) {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: 'error', title: 'Failed', message: data.error })
        return
      }
      toast({ variant: 'success', title: action === 'approve' ? 'Application approved' : 'Application rejected' })
      fetchProjects()
    } catch {
      toast({ variant: 'error', title: 'Failed' })
    }
  }

  const filtered = projects.filter((p) =>
    (p.student?.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.labPhaseTitle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return <LogoSpinner />

  const isStudent = role === 'student'
  const isInstructor = role === 'instructor' || role === 'admin'
  const activeProject = projects.find((p) => ['pending', 'approved', 'in_progress'].includes(p.status))
  const canApply = isStudent && !activeProject

  const stepsOrder: StepKey[] = ['presentation', 'gitRepo', 'deployment']

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <div>
          <h1 className="text-display-md text-ink font-700 leading-[0.95]">Student Projects</h1>
          <p className="text-body-sm text-mute mt-sm">
            {isStudent ? 'Apply for a lab phase and submit your project' : 'Review and validate student projects'}
          </p>
        </div>
        <div className="flex items-center gap-md">
          <Badge variant="default">{projects.length} Total</Badge>
          {canApply && (
            <Button variant="primary" size="sm" onClick={() => setShowApply(true)}>
              <Send className="w-4 h-4 mr-1" /> Apply for Lab Phase
            </Button>
          )}
        </div>
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

      {projects.length === 0 ? (
        <div className="bg-canvas border border-hairline py-xxxl text-center">
          <p className="text-body-md text-mute">No projects yet</p>
        </div>
      ) : (
        <div className="grid gap-lg">
          {filtered.map((project) => {
            const config = statusConfig[project.status] ?? statusConfig.pending
            return (
              <div key={project.id} className="bg-canvas border border-hairline p-xxl">
                <div className="flex items-start justify-between mb-lg">
                  <div>
                    <div className="flex items-center gap-md mb-xs">
                      <h2 className="text-heading-sm text-ink font-700">{project.labPhaseTitle}</h2>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                    {project.student && (
                      <div className="flex items-center gap-md mt-sm">
                        <Avatar name={project.student.name} size="sm" src={project.student.avatar} />
                        <span className="text-body-sm text-charcoal">{project.student.name}</span>
                        <span className="text-caption text-mute">{project.student.email}</span>
                      </div>
                    )}
                    {project.finalGrade !== undefined && project.finalGrade !== null && (
                      <p className={`text-heading-sm font-700 mt-sm ${project.finalGrade >= 70 ? 'text-success' : project.finalGrade >= 50 ? 'text-warning' : 'text-error'}`}>
                        Final Grade: {project.finalGrade}%
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {project.status === 'pending' && isInstructor && (
                      <>
                        <Button variant="primary" size="sm" onClick={() => handleAction(project.id, 'approve')}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button variant="outline-dark" size="sm" onClick={() => handleAction(project.id, 'reject')}>
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Steps */}
                {(project.status === 'approved' || project.status === 'in_progress' || project.status === 'completed') && (
                  <div className="border-t border-hairline pt-lg mt-lg">
                    <p className="text-caption text-mute uppercase tracking-widest font-600 mb-md">Validation Steps</p>
                    <div className="grid gap-md">
                      {stepsOrder.map((step, idx) => {
                        const current = project[step]
                        const isCurrentStep = idx === 0 || stepsOrder.slice(0, idx).every((s) => project[s]?.validated)
                        const canSubmit = isStudent && project.studentId === session?.user?.id && !current.validated && current.url === '' && isCurrentStep && project.status !== 'completed'
                        const canValidate = isInstructor && current.url && !current.validated

                        return (
                          <div key={step} className="flex items-center justify-between p-lg bg-surface-soft border border-hairline">
                            <div className="flex items-center gap-lg min-w-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-button-sm font-700 ${current.validated ? 'bg-success text-on-dark' : current.url ? 'bg-info text-on-dark' : 'bg-surface-soft text-mute border border-hairline-strong'}`}>
                                {current.validated ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                              </div>
                              <div className="min-w-0">
                                <p className="text-body-sm text-ink font-600">{stepMeta[step].label}</p>
                                {current.url ? (
                                  <a href={current.url} target="_blank" rel="noopener noreferrer" className="text-caption text-ink underline break-all inline-flex items-center gap-1">
                                    {current.url} <ExternalLink className="w-3 h-3 shrink-0" />
                                  </a>
                                ) : (
                                  <p className="text-caption text-mute">Not submitted</p>
                                )}
                                {current.validated && current.score !== undefined && (
                                  <p className={`text-caption font-600 ${current.score >= 7 ? 'text-success' : current.score >= 5 ? 'text-warning' : 'text-error'}`}>
                                    Score: {current.score}/10
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {canSubmit && (
                                <Button variant="primary" size="sm" onClick={() => setSubmitStep({ project, step })}>
                                  <ExternalLink className="w-4 h-4 mr-1" /> Submit
                                </Button>
                              )}
                              {canValidate && (
                                <Button variant="primary" size="sm" onClick={() => setValidateStep({ project, step })}>
                                  <CheckCircle className="w-4 h-4 mr-1" /> Validate
                                </Button>
                              )}
                              {current.validated && current.score !== undefined && (
                                <span className={`text-button-sm font-700 ${current.score >= 7 ? 'text-success' : current.score >= 5 ? 'text-warning' : 'text-error'}`}>
                                  {current.score}/10
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showApply && <ApplyModal onClose={() => setShowApply(false)} onSave={fetchProjects} />}
      {submitStep && <StepModal project={submitStep.project} step={submitStep.step} onClose={() => setSubmitStep(null)} onSave={fetchProjects} />}
      {validateStep && <ValidateModal project={validateStep.project} step={validateStep.step} onClose={() => setValidateStep(null)} onSave={fetchProjects} />}
    </div>
  )
}
