'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button, Badge } from '@/components/ui'
import { Video, Clock, CalendarDays, CalendarPlus } from 'lucide-react'
import { InstructorGuard } from '@/components/shared/instructor-guard'
import { safeUrl } from '@/lib/utils'
import {
  type GuildSummary,
  type SessionDTO,
  formatSessionFull,
  formatSessionTime,
} from '@/components/teach/attendance/types'

function OnlineSessionsPageContent() {
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
    () =>
      sessions
        .filter((s) => new Date(s.date).getTime() >= now && s.link)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [sessions, now]
  )

  const guildName = (id: string) => {
    const g = guilds.find((x) => x.id === id)
    return g ? `${g.name} — ${g.courseTitle}` : ''
  }

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between flex-wrap gap-md mb-xxl">
        <div>
          <h1 className="text-display-md text-ink font-700 leading-[0.95]">Online Sessions</h1>
          <p className="text-body-sm text-mute mt-sm">
            Your scheduled guild sessions with meeting links.
          </p>
        </div>
        <Link href="/teach/attendance" className="no-underline">
          <Button variant="primary">
            <CalendarPlus className="w-4 h-4 mr-2" /> Schedule on Calendar
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-lg border border-error/40 bg-error/10 text-error px-lg py-md text-body-sm">{error}</div>
      )}

      {loading ? (
        <div className="space-y-lg">
          <div className="h-32 bg-surface-soft animate-pulse" />
          <div className="h-32 bg-surface-soft animate-pulse" />
        </div>
      ) : upcoming.length === 0 ? (
        <div className="bg-canvas border border-hairline p-xxxl text-center">
          <CalendarDays className="w-8 h-8 text-mute mx-auto mb-md" />
          <h2 className="text-heading-md text-ink font-700 mb-sm">No upcoming linked sessions</h2>
          <p className="text-body-sm text-mute max-w-md mx-auto">
            Sessions with a meeting link will appear here. Use the calendar to schedule one and paste the link.
          </p>
          <div className="mt-lg">
            <Link href="/teach/attendance" className="no-underline">
              <Button variant="outline-dark">Go to Attendance Calendar</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-lg">
          {upcoming.map((session) => (
            <div key={session.id} className="bg-canvas border border-hairline p-xxl">
              <div className="flex items-start justify-between flex-wrap gap-md">
                <div>
                  <div className="flex items-center gap-md mb-sm">
                    <Badge variant="default">Session {session.sessionNumber}</Badge>
                    <Badge variant="info">Upcoming</Badge>
                  </div>
                  <h2 className="text-heading-sm text-ink font-700 mb-sm">{session.title}</h2>
                  <p className="text-body-sm text-mute mb-md">{guildName(session.guildId)}</p>
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
                <a href={safeUrl(session.link)} target="_blank" rel="noopener noreferrer" className="no-underline">
                  <Button variant="primary">
                    <Video className="w-4 h-4 mr-2" /> Join Session
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function OnlineSessionsPage() {
  return (
    <InstructorGuard>
      <OnlineSessionsPageContent />
    </InstructorGuard>
  )
}