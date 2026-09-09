'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Badge,
  Progress,
  ConfirmDialog,
  confirm,
} from '@/components/ui'
import { Plus, CalendarPlus, Pencil, Trash2, Link2, Copy } from 'lucide-react'
import { InstructorGuard } from '@/components/shared/instructor-guard'
import { cn, safeUrl } from '@/lib/utils'
import {
  type AttendanceStatus,
  type GuildSummary,
  type RosterStudent,
  type SessionDTO,
  type SessionFormValues,
  toDayKey,
  formatSessionFull,
  formatSessionTime,
} from '@/components/teach/attendance/types'
import { SessionCalendar } from '@/components/teach/attendance/session-calendar'
import { SessionForm } from '@/components/teach/attendance/session-form'
import { AttendanceMark } from '@/components/teach/attendance/attendance-mark'

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Request failed')
  return data as T
}

type FormState = { mode: 'create' } | { mode: 'edit'; session: SessionDTO } | null

function AttendancePageContent() {
  const [guilds, setGuilds] = useState<GuildSummary[]>([])
  const [sessions, setSessions] = useState<SessionDTO[]>([])
  const [students, setStudents] = useState<RosterStudent[]>([])
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null)
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(() => toDayKey(new Date()))
  const [form, setForm] = useState<FormState>(null)
  const [attendanceOpenId, setAttendanceOpenId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [copyId, setCopyId] = useState<string | null>(null)
  const [now] = useState(() => Date.now())

  const notify = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    window.setTimeout(() => setMessage(null), 4000)
  }

  async function fetchScoped(guildId: string) {
    const [base, scoped] = await Promise.all([
      api<{ guilds: GuildSummary[] }>('/api/sessions'),
      api<{ sessions: SessionDTO[]; students: RosterStudent[] }>(`/api/sessions?guildId=${guildId}`),
    ])
    setGuilds(base.guilds ?? [])
    if (!base.guilds.some((g) => g.id === guildId)) {
      const first = base.guilds[0]
      if (!first) return
      setSelectedGuildId(first.id)
      const sc = await api<{ sessions: SessionDTO[]; students: RosterStudent[] }>(`/api/sessions?guildId=${first.id}`)
      setSessions(sc.sessions ?? [])
      setStudents(sc.students ?? [])
      return
    }
    setSessions(scoped.sessions ?? [])
    setStudents(scoped.students ?? [])
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api<{ guilds: GuildSummary[] }>('/api/sessions')
        if (cancelled) return
        setGuilds(data.guilds ?? [])
        const first = data.guilds?.[0]?.id ?? null
        setSelectedGuildId(first)
        if (first) {
          const scoped = await api<{ sessions: SessionDTO[]; students: RosterStudent[] }>(`/api/sessions?guildId=${first}`)
          if (cancelled) return
          setSessions(scoped.sessions ?? [])
          setStudents(scoped.students ?? [])
        }
      } catch (e) {
        if (!cancelled) notify('error', (e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function selectGuild(guildId: string) {
    if (guildId === selectedGuildId) return
    setSelectedGuildId(guildId)
    setForm(null)
    setAttendanceOpenId(null)
    setLoading(true)
    try {
      const scoped = await api<{ sessions: SessionDTO[]; students: RosterStudent[] }>(`/api/sessions?guildId=${guildId}`)
      setSessions(scoped.sessions ?? [])
      setStudents(scoped.students ?? [])
    } catch (e) {
      notify('error', (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(values: SessionFormValues) {
    setBusy(true)
    try {
      await api('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          guildId: values.guildId,
          sessionNumber: values.sessionNumber,
          title: values.title || undefined,
          date: `${values.date}T${values.time || '09:00'}`,
          link: values.link || undefined,
        }),
      })
      setForm(null)
      await fetchScoped(values.guildId)
      notify('success', `Session ${values.sessionNumber} scheduled`)
    } catch (e) {
      notify('error', (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdate(session: SessionDTO, values: SessionFormValues) {
    setBusy(true)
    try {
      await api(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: values.title || undefined,
          link: values.link || undefined,
          date: `${values.date}T${values.time || '09:00'}`,
          sessionNumber: values.sessionNumber,
        }),
      })
      setForm(null)
      await fetchScoped(session.guildId)
      notify('success', `Session ${values.sessionNumber} updated`)
    } catch (e) {
      notify('error', (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function handleDelete(session: SessionDTO) {
    confirm({
      title: 'Delete this session?',
      message: `Session ${session.sessionNumber} (${session.title}) and its attendance records will be removed.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await api(`/api/sessions/${session.id}`, { method: 'DELETE' })
          setAttendanceOpenId(null)
          await fetchScoped(session.guildId)
          notify('success', `Session ${session.sessionNumber} deleted`)
        } catch (e) {
          notify('error', (e as Error).message)
        }
      },
    })
  }

  async function handleAttendance(session: SessionDTO, records: { studentId: string; status: AttendanceStatus }[]) {
    setBusy(true)
    try {
      await api(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ records }),
      })
      setAttendanceOpenId(null)
      await fetchScoped(session.guildId)
      notify('success', `Attendance saved for session ${session.sessionNumber}`)
    } catch (e) {
      notify('error', (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function copyLink(session: SessionDTO) {
    try {
      await navigator.clipboard.writeText(safeUrl(session.link))
      setCopyId(session.id)
      window.setTimeout(() => setCopyId(null), 1500)
    } catch {}
  }

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, SessionDTO[]>()
    for (const s of sessions) {
      const key = toDayKey(new Date(s.date))
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return map
  }, [sessions])

  const selectedGuild = guilds.find((g) => g.id === selectedGuildId) ?? null
  const daySessions = [...(sessionsByDay.get(selectedDay) ?? [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const selectedDayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${selectedDay}T00:00:00`))
  const progressPct = selectedGuild && selectedGuild.totalSessions > 0
    ? Math.round((selectedGuild.currentSession / selectedGuild.totalSessions) * 100)
    : 0

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between flex-wrap gap-md mb-xxl">
        <div>
          <h1 className="text-display-md text-ink font-700 leading-[0.95]">Attendance</h1>
          <p className="text-body-sm text-mute mt-sm">
            Plan each session, share the link, and take attendance — right from the calendar.
          </p>
        </div>
        <div className="flex items-center gap-lg">
          {selectedGuild ? (
            <>
              <Badge variant="default">{selectedGuild.studentCount} students</Badge>
              <Badge variant="info">
                {sessions.length} scheduled / {selectedGuild.totalSessions}
              </Badge>
              <Badge variant="success">
                {selectedGuild.currentSession}/{selectedGuild.totalSessions} sessions · {progressPct}%
              </Badge>
            </>
          ) : (
            <Badge variant="default">No guilds</Badge>
          )}
        </div>
      </div>

      {message && (
        <div
          className={cn(
            'mb-lg border px-lg py-md text-body-sm',
            message.type === 'success' ? 'border-success/40 bg-success/10 text-success' : 'border-error/40 bg-error/10 text-error'
          )}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="grid gap-lg">
          <div className="h-96 bg-surface-soft animate-pulse" />
          <div className="h-64 bg-surface-soft animate-pulse" />
        </div>
      ) : guilds.length === 0 ? (
        <div className="bg-canvas border border-hairline p-xxxl text-center">
          <h2 className="text-heading-md text-ink font-700 mb-sm">You have no guilds yet</h2>
          <p className="text-body-sm text-mute max-w-md mx-auto">
            Once an admin assigns you to a guild, you&apos;ll be able to schedule sessions and track attendance here.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-lg">
            <label className="block text-body-sm text-charcoal mb-xxs">Guild</label>
            <select
              value={selectedGuildId ?? ''}
              onChange={(e) => selectGuild(e.target.value)}
              className="h-12 w-full sm:w-96 bg-canvas text-ink text-body-md px-md border-b border-hairline-strong rounded-none focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-ink"
            >
              {guilds.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — {g.courseTitle}
                </option>
              ))}
            </select>
          </div>

          {selectedGuild && selectedGuild.totalSessions > 0 && (
            <div className="mb-xxl grid sm:grid-cols-2 gap-lg">
              <div>
                <div className="flex items-center justify-between mb-sm">
                  <span className="text-body-sm text-charcoal">Course progress</span>
                  <span className="text-body-sm text-charcoal">
                    {selectedGuild.currentSession}/{selectedGuild.totalSessions} sessions ({progressPct}%)
                  </span>
                </div>
                <Progress value={progressPct} />
              </div>
            </div>
          )}

          <div className="grid xl:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] gap-xxl">
            <div>
              <SessionCalendar
                month={month}
                onMonthChange={setMonth}
                sessionsByDay={sessionsByDay}
                onSelectDay={setSelectedDay}
              />
              <p className="text-caption text-mute mt-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-primary mr-1 align-middle" />
                scheduled session
                <span className="inline-block w-2 h-2 rounded-full bg-success ml-lg mr-1 align-middle" />
                attendance recorded
              </p>
            </div>

            <div>
              {form ? (
                <SessionForm
                  mode={form.mode}
                  guilds={guilds}
                  selectedGuildId={selectedGuildId ?? ''}
                  initialSession={form.mode === 'edit' ? form.session : null}
                  defaultDate={selectedDay}
                  busy={busy}
                  onSave={form.mode === 'create' ? handleCreate : (values) => handleUpdate(form.session, values)}
                  onCancel={() => setForm(null)}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-lg">
                    <h2 className="text-heading-sm text-ink font-700">{selectedDayLabel}</h2>
                    <Button variant="primary" size="sm" onClick={() => setForm({ mode: 'create' })}>
                      <CalendarPlus className="w-4 h-4 mr-2" /> Schedule
                    </Button>
                  </div>

                  {daySessions.length === 0 ? (
                    <div className="bg-canvas border border-hairline p-xxl text-center">
                      <p className="text-body-sm text-mute mb-md">No sessions on this day.</p>
                      <Button variant="outline-dark" size="sm" onClick={() => setForm({ mode: 'create' })}>
                        <Plus className="w-4 h-4 mr-2" /> Add a session
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-lg">
                      {daySessions.map((session) => {
                        const isPast = new Date(session.date).getTime() < now
                        const isOpen = attendanceOpenId === session.id
                        return (
                          <div key={session.id} className="bg-canvas border border-hairline">
                            <div className="p-lg">
                              <div className="flex items-center gap-md flex-wrap mb-sm">
                                <Badge variant="default">Session {session.sessionNumber}</Badge>
                                <Badge
                                  variant={session.hasAttendance ? 'success' : isPast ? 'error' : 'info'}
                                >
                                  {session.hasAttendance ? 'Recorded' : isPast ? 'Overdue' : 'Upcoming'}
                                </Badge>
                                {isPast && session.hasAttendance && (
                                  <span className="text-caption text-success">{session.records.length} marked</span>
                                )}
                              </div>
                              <h3 className="text-heading-sm text-ink font-700 mb-xs">{session.title}</h3>
                              <div className="flex items-center gap-lg flex-wrap mb-md">
                                <span className="text-body-sm text-charcoal">{formatSessionFull(session.date)}</span>
                                <span className="text-body-sm text-charcoal">{formatSessionTime(session.date)}</span>
                                {session.link && (
                                  <a
                                    href={safeUrl(session.link)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-body-sm text-link underline inline-flex items-center gap-1"
                                  >
                                    <Link2 className="w-3.5 h-3.5" /> {session.link}
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-md flex-wrap">
                                <Button variant={isOpen ? 'outline-dark' : 'primary'} size="sm" onClick={() => setAttendanceOpenId(isOpen ? null : session.id)}>
                                  {isOpen ? 'Close' : session.hasAttendance ? 'Edit Attendance' : 'Take Attendance'}
                                </Button>
                                {session.link && (
                                  <Button variant="outline-dark" size="sm" onClick={() => copyLink(session)}>
                                    <Copy className={cn('w-3.5 h-3.5 mr-1', copyId === session.id && 'text-success')} />
                                    {copyId === session.id ? 'Copied' : 'Copy Link'}
                                  </Button>
                                )}
                                <button
                                  onClick={() => setForm({ mode: 'edit', session })}
                                  className="h-9 px-3 inline-flex items-center gap-1 text-button-sm text-charcoal hover:text-ink bg-transparent border-none cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(session)}
                                  className="h-9 px-3 inline-flex items-center gap-1 text-button-sm text-error hover:opacity-70 bg-transparent border-none cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            </div>
                            {isOpen && (
                              <AttendanceMark
                                students={students}
                                session={session}
                                busy={busy}
                                onSave={(records) => handleAttendance(session, records)}
                                onCancel={() => setAttendanceOpenId(null)}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      <ConfirmDialog />
    </div>
  )
}

export default function AttendancePage() {
  return (
    <InstructorGuard>
      <AttendancePageContent />
    </InstructorGuard>
  )
}