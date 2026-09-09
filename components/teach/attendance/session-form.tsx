'use client'

import { useState } from 'react'
import { Input, Button } from '@/components/ui'
import { toDayKey, type GuildSummary, type SessionDTO, type SessionFormValues } from './types'

interface SessionFormProps {
  mode: 'create' | 'edit'
  guilds: GuildSummary[]
  selectedGuildId: string
  initialSession?: SessionDTO | null
  defaultDate?: string
  busy: boolean
  onSave: (values: SessionFormValues) => Promise<void> | void
  onCancel: () => void
}

function extractParts(session?: SessionDTO | null) {
  if (!session) return { date: '', time: '09:00' }
  const d = new Date(session.date)
  if (Number.isNaN(d.getTime())) return { date: '', time: '09:00' }
  return {
    date: toDayKey(d),
    time: d.toTimeString().slice(0, 5),
  }
}

export function SessionForm({ mode, guilds, selectedGuildId, initialSession, defaultDate, busy, onSave, onCancel }: SessionFormProps) {
  const parts = extractParts(initialSession)
  const guild = guilds.find((g) => g.id === (initialSession?.guildId ?? selectedGuildId))
  const nextSession = Math.min((guild?.currentSession ?? 0) + 1, guild?.totalSessions ?? 1)

  const [guildId, setGuildId] = useState(initialSession?.guildId ?? selectedGuildId)
  const [sessionNumber, setSessionNumber] = useState<string>(
    initialSession ? String(initialSession.sessionNumber) : String(nextSession)
  )
  const [title, setTitle] = useState(initialSession?.title ?? '')
  const [date, setDate] = useState(initialSession ? parts.date : defaultDate ?? parts.date)
  const [time, setTime] = useState(parts.time)
  const [link, setLink] = useState(initialSession?.link ?? '')
  const [error, setError] = useState('')

  const activeGuild = guilds.find((g) => g.id === guildId)
  const maxSession = activeGuild?.totalSessions ?? 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = Number(sessionNumber)
    if (!guildId) return setError('Select a guild')
    if (!sessionNumber || !Number.isInteger(num) || num < 1) return setError('Enter a valid session number')
    if (maxSession > 0 && num > maxSession) return setError(`Cannot exceed ${maxSession} sessions`)
    if (!date) return setError('Choose a date')
    onSave({ guildId, sessionNumber: num, title: title.trim(), date, time, link: link.trim() })
  }

  return (
    <div className="bg-canvas border border-hairline p-xxl">
      <div className="flex items-center justify-between mb-lg">
        <h3 className="text-heading-sm text-ink font-700">{mode === 'create' ? 'Schedule a Session' : 'Edit Session'}</h3>
        <span className="text-caption text-mute">Session {activeGuild ? `${activeGuild.currentSession}/${activeGuild.totalSessions || '-'} completed` : ''}</span>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-lg">
        <div>
          <label className="block text-body-sm text-charcoal mb-xxs">Guild</label>
          <select
            value={guildId}
            disabled={mode === 'edit'}
            onChange={(e) => {
              setGuildId(e.target.value)
              const g = guilds.find((x) => x.id === e.target.value)
              const next = Math.min((g?.currentSession ?? 0) + 1, g?.totalSessions ?? 1)
              setSessionNumber(String(next))
            }}
            className="h-12 w-full bg-canvas text-ink text-body-md px-md border-b border-hairline-strong rounded-none focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-ink disabled:opacity-50"
          >
            {guilds.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} — {g.courseTitle}
              </option>
            ))}
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-lg">
          <Input
            label="Session Number"
            type="number"
            min={1}
            max={maxSession || undefined}
            value={sessionNumber}
            onChange={(e) => setSessionNumber(e.target.value)}
          />
          <Input
            label="Session Title (optional)"
            value={title}
            placeholder={`Session ${sessionNumber || ''}`.trim()}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-lg">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>

        <Input
          label="Session Link (optional)"
          value={link}
          placeholder="https://meet.google.com/…"
          onChange={(e) => setLink(e.target.value)}
        />

        {error && <p className="text-body-sm text-error">{error}</p>}

        <div className="flex items-center justify-end gap-md mt-sm">
          <Button variant="outline-dark" type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : mode === 'create' ? 'Schedule Session' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}