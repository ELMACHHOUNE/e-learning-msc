'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const VISITOR_KEY = 'et_visitor_id'
const SESSION_KEY = 'et_session_id'
const SESSION_TTL_MS = 30 * 60 * 1000
const FLUSH_INTERVAL_MS = 8000
const MAX_QUEUE = 8
const CLIENT_EVENT_TYPES = ['page_view', 'navigation_click', 'search_submitted', 'download_started', 'login_success']

export interface TrackEventOptions {
  path?: string
  title?: string
  metadata?: Record<string, string | number>
}

interface QueuedEvent {
  eventId: string
  eventType: string
  path: string
  pageTitle?: string
  referrer?: string
  sessionId: string
  visitorId: string
  metadata?: Record<string, string | number>
}

function readUuid(key: string, session: boolean) {
  try {
    const storage = session ? sessionStorage : localStorage
    const existing = storage.getItem(key)
    if (existing) return existing
    const created = crypto.randomUUID()
    storage.setItem(key, created)
    return created
  } catch {
    return crypto.randomUUID()
  }
}

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { id: string; lastSeen: number }
    if (!parsed?.id || Date.now() - parsed.lastSeen > SESSION_TTL_MS) return null
    return parsed.id
  } catch {
    return null
  }
}

function writeSession(id: string) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, lastSeen: Date.now() }))
  } catch {
    // storage unavailable — a session id is still generated per request
  }
}

const queue: QueuedEvent[] = []
let visitorIdCache: string | null = null
let timer: ReturnType<typeof setTimeout> | null = null

function currentReferrer() {
  if (typeof document === 'undefined') return undefined
  const referrer = document.referrer
  if (!referrer || referrer === document.location.href) return undefined
  try {
    return new URL(referrer).hostname
  } catch {
    return undefined
  }
}

function flush() {
  if (typeof navigator === 'undefined') return
  if (queue.length === 0) return
  if (navigator.doNotTrack === '1') {
    queue.length = 0
    return
  }

  const batch = queue.splice(0, MAX_QUEUE)
  const payload = JSON.stringify({ events: batch })
  const endpoint = '/api/analytics/collect'

  try {
    if (typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' })
      if (navigator.sendBeacon(endpoint, blob)) return
    }
  } catch {
    // fall through to fetch
  }

  void fetch(endpoint, {
    method: 'POST',
    body: payload,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
  }).catch(() => undefined)
}

function enqueue(event: Omit<QueuedEvent, 'eventId'>) {
  queue.push({ ...event, eventId: crypto.randomUUID() })
  if (queue.length > MAX_QUEUE * 4) queue.splice(0, queue.length - MAX_QUEUE * 4)
  if (timer) return
  timer = setTimeout(() => {
    timer = null
    flush()
  }, FLUSH_INTERVAL_MS)
}

/**
 * Records a controlled analytics event. Only approved event types are accepted and no
 * form values, query strings, or free text are ever sent.
 */
export function trackEvent(eventType: string, options: TrackEventOptions = {}) {
  if (typeof window === 'undefined') return
  if (!CLIENT_EVENT_TYPES.includes(eventType)) return

  const visitorId = visitorIdCache ?? readUuid(VISITOR_KEY, false)
  visitorIdCache = visitorId

  let sessionId = readSession()
  if (!sessionId) {
    sessionId = readUuid(SESSION_KEY, true)
    writeSession(sessionId)
  } else {
    writeSession(sessionId)
  }

  enqueue({
    eventType,
    path: options.path ?? window.location.pathname,
    pageTitle: options.title ?? document.title,
    referrer: currentReferrer(),
    sessionId,
    visitorId,
    metadata: options.metadata,
  })
}

export function AnalyticsTracker() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname) return
    if (pathname.startsWith('/admin/analytics')) return
    if (lastPath.current === pathname) return
    lastPath.current = pathname

    trackEvent('page_view')

    const flushOnHide = () => {
      flush()
    }
    document.addEventListener('visibilitychange', flushOnHide)
    return () => document.removeEventListener('visibilitychange', flushOnHide)
  }, [pathname])

  useEffect(() => {
    const onUnload = () => flush()
    window.addEventListener('pagehide', onUnload)
    return () => window.removeEventListener('pagehide', onUnload)
  }, [])

  return null
}