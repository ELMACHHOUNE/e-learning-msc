'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Badge } from '@/components/ui'
import { CalendarDays, Video, Clock, Hash } from 'lucide-react'
import { cn, safeUrl } from '@/lib/utils'
import {
  type GuildSummary,
  type SessionDTO,
  formatSessionFull,
  formatSessionTime,
} from '@/components/teach/attendance/types'

const STATUS_LABEL: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
}

export default function SessionsPage() {
  const [guilds, setGuilds] = useState<GuildSummary[]>([])
  const [sessions, setSessions] = useState<SessionDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/sessions')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load sessions')
        if (cancelled) return
        setGuilds(data.guilds ?? [])
        setSessions(data.sessions ?? [])
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const upcoming = useMemo(
    () => sessions.filter((s) => new Date(s.date).getTime() >= now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [sessions, now]
  )

  const past = useMemo(
    () => sessions.filter((s) => new Date(s.date).getTime() < now).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [sessions, now]
  )

  const guildName = (id: string) => guilds.find((g) => g.id === id)?.name ?? ''

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between flex-wrap gap-md mb-xxl">
        <div>
          <h1 className="text-display-md text-ink font-700 leading-[0.95]">My Sessions</h1>
          <p className="text-body-sm text-mute mt-sm">
            Your scheduled guild sessions, meeting links, and attendance record.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-lg border border-error/40 bg-error/10 text-error px-lg py-md text-body-sm">{error}</div>
      )}

      {loading ? (
        <div className="grid gap-lg">
          <div className="h-48 bg-surface-soft animate-pulse" />
          <div className="h-48 bg-surface-soft animate-pulse" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-canvas border border-hairline p-xxxl text-center">
          <CalendarDays className="w-8 h-8 text-mute mx-auto mb-md" />
          <h2 className="text-heading-md text-ink font-700 mb-sm">No sessions scheduled yet</h2>
          <p className="text-body-sm text-mute max-w-md mx-auto">
            Your instructor hasn&apos;t scheduled any sessions for your guilds yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="grid gap-xxl">
          <section>
            <div className="flex items-center gap-2 mb-lg">
              <Video className="w-4 h-4 text-mute" />
              <h2 className="text-heading-sm text-ink font-700">Upcoming</h2>
              <Badge variant="info">{upcoming.length}</Badge>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-body-sm text-mute">No upcoming sessions.</p>
            ) : (
              <div className="grid gap-lg">
                {upcoming.map((session) => {
                  const link = safeUrl(session.link)
                  return (
                    <div key={session.id} className="bg-canvas border border-hairline p-xxl">
                      <div className="flex items-start justify-between flex-wrap gap-md">
                        <div className="min-w-0">
                          <div className="flex items-center gap-md flex-wrap mb-sm">
                            <Badge variant="new">{guildName(session.guildId)}</Badge>
                            <Badge variant="default">Session {session.sessionNumber}</Badge>
                          </div>
                          <h3 className="text-heading-sm text-ink font-700 mb-sm">{session.title}</h3>
                          <div className="flex items-center gap-lg flex-wrap">
                            <span className="flex items-center gap-1 text-body-sm text-charcoal">
                              <CalendarDays className="w-4 h-4" />
                              {formatSessionFull(session.date)}
                            </span>
                            <span className="flex items-center gap-1 text-body-sm text-charcoal">
                              <Clock className="w-4 h-4" />
                              {formatSessionTime(session.date)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-md">
                          {link ? (
                            <a href={link} target="_blank" rel="noopener noreferrer" className="no-underline">
                              <Button variant="primary">
                                <Video className="w-4 h-4 mr-2" /> Join Session
                              </Button>
                            </a>
                          ) : (
                            <Badge variant="warning">Link not shared yet</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-lg">
              <Hash className="w-4 h-4 text-mute" />
              <h2 className="text-heading-sm text-ink font-700">Past sessions</h2>
              <Badge variant="default">{past.length}</Badge>
            </div>
            {past.length === 0 ? (
              <p className="text-body-sm text-mute">No past sessions yet.</p>
            ) : (
              <div className="bg-canvas border border-hairline">
                {past.map((session, i) => (
                  <div
                    key={session.id}
                    className={cn('flex items-center justify-between flex-wrap gap-md px-lg py-md', i > 0 && 'border-t border-hairline')}
                  >
                    <div className="min-w-0">
                      <p className="text-body-sm text-ink font-600">
                        {session.title} <span className="text-mute font-400">· Session {session.sessionNumber}</span>
                      </p>
                      <p className="text-caption text-mute">
                        {guildName(session.guildId)} · {formatSessionFull(session.date)}
                      </p>
                    </div>
                    {session.myStatus ? (
                      <Badge
                        variant={session.myStatus === 'present' ? 'success' : session.myStatus === 'late' ? 'warning' : 'error'}
                      >
                        {STATUS_LABEL[session.myStatus]}
                      </Badge>
                    ) : (
                      <Badge variant="default">Not marked</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}