'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Badge, ConfirmDialog, confirm } from '@/components/ui'
import { Trash2, XCircle, CalendarPlus } from 'lucide-react'
import { InstructorGuard } from '@/components/shared/instructor-guard'
import { cn } from '@/lib/utils'
import { SlotCard } from '@/components/teach/one-to-one/slot-card'
import { type GuildBrief, type OneToOneDTO } from '@/components/teach/one-to-one/types'

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Request failed')
  return data as T
}

const todayISO = () => new Date().toISOString().slice(0, 10)

function OneToOnePageContent() {
  const [guilds, setGuilds] = useState<GuildBrief[]>([])
  const [slots, setSlots] = useState<OneToOneDTO[]>([])
  const [guildId, setGuildId] = useState('')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [duration, setDuration] = useState(30)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [now] = useState(() => Date.now())
  const [today] = useState(() => todayISO())

  const notify = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    window.setTimeout(() => setMessage(null), 4000)
  }

  async function load() {
    const data = await api<{ guilds: GuildBrief[]; slots: OneToOneDTO[] }>('/api/one-to-one')
    setGuilds(data.guilds ?? [])
    setSlots(data.slots ?? [])
    if (guildId || data.guilds.length === 0) return
    setGuildId((prev) => prev || data.guilds[0].id)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api<{ guilds: GuildBrief[]; slots: OneToOneDTO[] }>('/api/one-to-one')
        if (cancelled) return
        setGuilds(data.guilds ?? [])
        setSlots(data.slots ?? [])
        setGuildId(data.guilds?.[0]?.id ?? '')
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

  const upcoming = useMemo(
    () =>
      slots
        .filter((s) => new Date(s.date).getTime() >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [slots, now]
  )
  const past = useMemo(
    () =>
      slots
        .filter((s) => new Date(s.date).getTime() < now)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [slots, now]
  )

  const guildLabel = (id: string) => {
    const g = guilds.find((x) => x.id === id)
    return g ? `${g.name} — ${g.courseTitle}` : ''
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!guildId) return notify('error', 'Select a guild')
    if (!date) return notify('error', 'Pick a date')

    setBusy(true)
    try {
      await api('/api/one-to-one', {
        method: 'POST',
        body: JSON.stringify({
          guildId,
          date: `${date}T${time || '09:00'}`,
          duration,
          title: title.trim() || undefined,
        }),
      })
      setTitle('')
      setDate('')
      setTime('09:00')
      setDuration(30)
      await load()
      notify('success', 'Availability slot created')
    } catch (e) {
      notify('error', (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function handleDelete(slot: OneToOneDTO) {
    confirm({
      title: 'Delete this slot?',
      message: `The ${formatSlotDateTime(slot)} one-to-one slot will be removed permanently.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await api(`/api/one-to-one/${slot.id}`, { method: 'DELETE' })
          await load()
          notify('success', 'Slot deleted')
        } catch (e) {
          notify('error', (e as Error).message)
        }
      },
    })
  }

  async function handleCancel(slot: OneToOneDTO) {
    setBusy(true)
    try {
      await api(`/api/one-to-one/${slot.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'cancel' }),
      })
      await load()
      notify('success', 'Booking cancelled')
    } catch (e) {
      notify('error', (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const guildOptions = guilds.map((g) => (
    <option key={g.id} value={g.id}>
      {g.name} — {g.courseTitle}
    </option>
  ))

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="mb-xxl">
        <h1 className="text-display-md text-ink font-700 leading-[0.95]">One-to-One Sessions</h1>
        <p className="text-body-sm text-mute mt-sm">
          Open availability slots for your students and manage their bookings.
        </p>
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
          <div className="h-48 bg-surface-soft animate-pulse" />
          <div className="h-64 bg-surface-soft animate-pulse" />
        </div>
      ) : (
        <div className="grid xl:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] gap-xxl">
          <div>
            <div className="bg-canvas border border-hairline p-xxl">
              <h2 className="text-heading-sm text-ink font-700 mb-lg">Open availability</h2>
              <form onSubmit={handleCreate} className="space-y-lg">
                <div>
                  <label className="block text-body-sm text-charcoal mb-xxs">Guild</label>
                  <select
                    value={guildId}
                    onChange={(e) => setGuildId(e.target.value)}
                    required
                    className="h-12 w-full bg-canvas text-ink text-body-md px-md border-b border-hairline-strong rounded-none focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-ink"
                  >
                    {guildOptions}
                  </select>
                </div>

                <div>
                  <label className="block text-body-sm text-charcoal mb-xxs">Title (optional)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Midterm help session"
                    className="h-12 w-full bg-canvas text-ink text-body-md px-md border-b border-hairline-strong rounded-none focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-ink"
                  />
                </div>

                <div className="grid grid-cols-2 gap-lg">
                  <div>
                    <label className="block text-body-sm text-charcoal mb-xxs">Date</label>
                    <input
                      type="date"
                      value={date}
                      min={today}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="h-12 w-full bg-canvas text-ink text-body-md px-md border-b border-hairline-strong rounded-none focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm text-charcoal mb-xxs">Time</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="h-12 w-full bg-canvas text-ink text-body-md px-md border-b border-hairline-strong rounded-none focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-ink"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-body-sm text-charcoal mb-xxs">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="h-12 w-full bg-canvas text-ink text-body-md px-md border-b border-hairline-strong rounded-none focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-ink"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                  </select>
                </div>

                <Button type="submit" variant="primary" disabled={busy} className="w-full">
                  <CalendarPlus className="w-4 h-4 mr-2" /> Create slot
                </Button>
              </form>
            </div>
          </div>

          <div className="space-y-xxl">
            <div>
              <div className="flex items-center justify-between mb-lg">
                <h2 className="text-heading-sm text-ink font-700">Upcoming</h2>
                <Badge variant="info">{upcoming.length}</Badge>
              </div>
              {upcoming.length === 0 ? (
                <div className="bg-canvas border border-hairline p-xxl text-center">
                  <p className="text-body-sm text-mute">No upcoming one-to-one slots.</p>
                </div>
              ) : (
                <div className="space-y-lg">
                  {upcoming.map((slot) => (
                    <SlotCard key={slot.id} slot={slot} guildLabel={guildLabel(slot.guildId)}>
                      {slot.status === 'booked' && (
                        <Button variant="outline-dark" size="sm" disabled={busy} onClick={() => handleCancel(slot)}>
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel booking
                        </Button>
                      )}
                      <button
                        onClick={() => handleDelete(slot)}
                        className="h-9 px-3 inline-flex items-center gap-1 text-button-sm text-error hover:opacity-70 bg-transparent border-none cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </SlotCard>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-lg">
                <h2 className="text-heading-sm text-ink font-700">Past</h2>
                <Badge variant="default">{past.length}</Badge>
              </div>
              {past.length === 0 ? (
                <div className="bg-canvas border border-hairline p-xxl text-center">
                  <p className="text-body-sm text-mute">No past one-to-one sessions.</p>
                </div>
              ) : (
                <div className="space-y-lg">
                  {past.map((slot) => (
                    <SlotCard key={slot.id} slot={slot} guildLabel={guildLabel(slot.guildId)} isPast>
                      {slot.status === 'booked' && (
                        <span className="text-caption text-success">{slot.studentName ?? 'Student'}</span>
                      )}
                      <button
                        onClick={() => handleDelete(slot)}
                        className="h-9 px-3 inline-flex items-center gap-1 text-button-sm text-error hover:opacity-70 bg-transparent border-none cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </SlotCard>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog />
    </div>
  )
}

function formatSlotDateTime(slot: OneToOneDTO) {
  const d = new Date(slot.date)
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`
}

export default function OneToOnePage() {
  return (
    <InstructorGuard>
      <OneToOnePageContent />
    </InstructorGuard>
  )
}