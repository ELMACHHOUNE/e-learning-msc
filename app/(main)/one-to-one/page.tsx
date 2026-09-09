'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button, Badge, ConfirmDialog } from '@/components/ui'
import { CalendarPlus, XCircle, UserCheck } from 'lucide-react'
import { RoleGuard } from '@/components/shared/role-guard'
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

function BookingPageContent() {
  const { data: session } = useSession()
  const me = session?.user?.id ?? ''

  const [guilds, setGuilds] = useState<GuildBrief[]>([])
  const [slots, setSlots] = useState<OneToOneDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [now] = useState(() => Date.now())

  const notify = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    window.setTimeout(() => setMessage(null), 4000)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api<{ guilds: GuildBrief[]; slots: OneToOneDTO[] }>('/api/one-to-one')
        if (cancelled) return
        setGuilds(data.guilds ?? [])
        setSlots(data.slots ?? [])
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

  const available = useMemo(
    () =>
      slots
        .filter((s) => s.status === 'available' && new Date(s.date).getTime() >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [slots, now]
  )

  const grouped = useMemo(() => {
    const map = new Map<string, OneToOneDTO[]>()
    for (const s of available) {
      if (!map.has(s.guildId)) map.set(s.guildId, [])
      map.get(s.guildId)!.push(s)
    }
    return map
  }, [available])

  const mine = useMemo(
    () =>
      slots
        .filter((s) => s.studentId === me)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [slots, me]
  )

  const guildBy = (id: string) => guilds.find((g) => g.id === id)

  async function handleBook(slot: OneToOneDTO) {
    setBusyId(slot.id)
    try {
      await api('/api/one-to-one', { method: 'POST', body: JSON.stringify({ slotId: slot.id }) })
      const data = await api<{ guilds: GuildBrief[]; slots: OneToOneDTO[] }>('/api/one-to-one')
      setGuilds(data.guilds ?? [])
      setSlots(data.slots ?? [])
      notify('success', 'One-to-one booked')
    } catch (e) {
      notify('error', (e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleCancel(slot: OneToOneDTO) {
    setBusyId(slot.id)
    try {
      await api(`/api/one-to-one/${slot.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'cancel' }),
      })
      const data = await api<{ guilds: GuildBrief[]; slots: OneToOneDTO[] }>('/api/one-to-one')
      setGuilds(data.guilds ?? [])
      setSlots(data.slots ?? [])
      notify('success', 'Booking cancelled')
    } catch (e) {
      notify('error', (e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="mb-xxl">
        <h1 className="text-display-md text-ink font-700 leading-[0.95]">One-to-One Booking</h1>
        <p className="text-body-sm text-mute mt-sm">
          Grab a dedicated time slot with your instructor.
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
          <div className="h-64 bg-surface-soft animate-pulse" />
          <div className="h-48 bg-surface-soft animate-pulse" />
        </div>
      ) : (
        <div className="space-y-xxl">
          <div>
            <div className="flex items-center justify-between mb-lg">
              <h2 className="text-heading-sm text-ink font-700">Book a session</h2>
              <Badge variant="info">{available.length}</Badge>
            </div>

            {grouped.size === 0 ? (
              <div className="bg-canvas border border-hairline p-xxxl text-center">
                <CalendarPlus className="w-8 h-8 text-mute mx-auto mb-md" />
                <h3 className="text-heading-sm text-ink font-700 mb-sm">No open slots right now</h3>
                <p className="text-body-sm text-mute max-w-md mx-auto">
                  Your instructors haven&apos;t opened any availability yet. Check back later.
                </p>
              </div>
            ) : (
              <div className="space-y-xxl">
                {[...grouped.entries()].map(([guildId, list]) => {
                  const g = guildBy(guildId)
                  return (
                    <div key={guildId}>
                      <h3 className="text-heading-xs text-charcoal font-600 mb-lg">
                        {g ? `${g.name} — ${g.courseTitle}` : 'Session'}
                      </h3>
                      <div className="space-y-lg">
                        {list.map((slot) => (
                          <SlotCard key={slot.id} slot={slot} guildLabel={g ? g.courseTitle : ''} instructorLabel={g?.instructorName}>
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={busyId === slot.id}
                              onClick={() => handleBook(slot)}
                            >
                              Book
                            </Button>
                          </SlotCard>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-lg">
              <h2 className="text-heading-sm text-ink font-700">My bookings</h2>
              <Badge variant="default">{mine.length}</Badge>
            </div>
            {mine.length === 0 ? (
              <div className="bg-canvas border border-hairline p-xxxl text-center">
                <UserCheck className="w-8 h-8 text-mute mx-auto mb-md" />
                <p className="text-body-sm text-mute">You haven&apos;t booked any one-to-one sessions yet.</p>
              </div>
            ) : (
              <div className="space-y-lg">
                {mine.map((slot) => {
                  const g = guildBy(slot.guildId)
                  const isPast = new Date(slot.date).getTime() < now
                  return (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      guildLabel={g ? `${g.name} — ${g.courseTitle}` : ''}
                      instructorLabel={g?.instructorName}
                      isPast={isPast}
                    >
                      {slot.status === 'booked' && !isPast && (
                        <Button
                          variant="outline-dark"
                          size="sm"
                          disabled={busyId === slot.id}
                          onClick={() => handleCancel(slot)}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
                        </Button>
                      )}
                    </SlotCard>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog />
    </div>
  )
}

export default function OneToOneBookingPage() {
  return (
    <RoleGuard roles={['student']}>
      <BookingPageContent />
    </RoleGuard>
  )
}