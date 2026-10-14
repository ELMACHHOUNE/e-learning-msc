interface Bucket {
  count: number
  resetAt: number
}

interface RateLimiterStore {
  buckets: Map<string, Bucket>
  lastSweep: number
}

const SWEEP_INTERVAL_MS = 60_000
const MAX_TRACKED_KEYS = 20_000

declare global {
  var analyticsRateLimiter: RateLimiterStore | undefined
}

function store(): RateLimiterStore {
  if (!global.analyticsRateLimiter) {
    global.analyticsRateLimiter = { buckets: new Map(), lastSweep: Date.now() }
  }
  return global.analyticsRateLimiter
}

function sweep(state: RateLimiterStore, now: number) {
  if (now - state.lastSweep < SWEEP_INTERVAL_MS && state.buckets.size < MAX_TRACKED_KEYS) return
  state.lastSweep = now
  for (const [key, bucket] of state.buckets) {
    if (bucket.resetAt <= now) state.buckets.delete(key)
  }
  if (state.buckets.size > MAX_TRACKED_KEYS) {
    const excess = state.buckets.size - MAX_TRACKED_KEYS
    let removed = 0
    for (const key of state.buckets.keys()) {
      state.buckets.delete(key)
      removed += 1
      if (removed >= excess) break
    }
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export function consumeRateLimit(key: string, limitPerMinute: number): RateLimitResult {
  const state = store()
  const now = Date.now()
  sweep(state, now)

  const windowMs = 60_000
  const existing = state.buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    state.buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: Math.max(0, limitPerMinute - 1), retryAfterSeconds: 0 }
  }

  if (existing.count >= limitPerMinute) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count += 1
  return { allowed: true, remaining: Math.max(0, limitPerMinute - existing.count), retryAfterSeconds: 0 }
}

export function resetRateLimits() {
  if (global.analyticsRateLimiter) {
    global.analyticsRateLimiter.buckets.clear()
    global.analyticsRateLimiter.lastSweep = Date.now()
  }
}