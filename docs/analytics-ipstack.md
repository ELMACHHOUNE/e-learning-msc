# Visitor Analytics (IPstack)

First-party visitor analytics for `e-teaching.tech`, surfaced in the admin dashboard at
`/admin/analytics` and enriched with IP-based geolocation from [IPstack by APILayer](https://apilayer.com/products/ipstack/).

This document covers architecture, configuration, metric definitions, retention, deployment,
and troubleshooting. For the broader platform see `AGENTS.md`.

---

## 1. Architecture at a glance

```
browser (AnalyticsTracker in app/layout.tsx)
  │  page_view + approved events, batched, sent with navigator.sendBeacon
  │  payload: eventId, eventType, path, pageTitle, referrer, sessionId, visitorId, metadata
  ▼
POST /api/analytics/collect          lib/analytics/ingest.ts
  │  1. zod-validate the batch and every event
  │  2. resolve the client IP from the trusted request context (never from the payload)
  │  3. rate-limit per keyed IP hash
  │  4. normalize paths, strip sensitive query params, drop excluded routes
  │  5. dedupe by client eventId (unique index is the second line of defence)
  │  6. sessionize server-side (30-minute inactivity window)
  │  7. enrich geolocation from the keyed cache or IPstack
  ▼
MongoDB
  analytics_events     one document per page view / engagement event
  analytics_sessions   one document per visit
  analytics_geocaches  keyed cache of IPstack results
  ▼
GET /api/admin/analytics?report=…    lib/analytics/reports.ts
  │  requireRole('admin') first, then aggregation pipelines
  ▼
app/(main)/admin/analytics/page.tsx   Overview · Geography · Visitors · Pages · Events · Settings
```

### Design decisions

| Decision | Why |
|---|---|
| One `/admin/analytics` route with tabs | Matches the existing single-route tabbed admin console (`/admin?tab=…`). Fewer routes, one authorization surface. |
| One report API with `?report=` | Matches `/api/admin/dashboard?tab=`. One place to enforce authorization and response shape. |
| MongoDB as the geolocation cache | The project has no Redis. Caching in Mongo with a TTL index avoids adding a service. |
| No daily rollup collection | At the platform's current traffic volume, indexed aggregation pipelines stay well inside the VPS budget. `AnalyticsEventDaily` should only be added if measured latency demands it. |
| In-memory rate limiter | Single `app` container. Documented as a limitation in §11. |

---

## 2. Configuration

All configuration is server-side environment variables. **Never** prefix any of them with
`NEXT_PUBLIC_` — that would ship the secret to the browser.

| Variable | Default | Purpose |
|---|---|---|
| `ANALYTICS_ENABLED` | `true` | Master switch. `false` stops collection entirely and every dashboard tab stays empty. |
| `IPSTACK_ACCESS_KEY` | *(unset)* | Server-only provider key. Absent → geolocation is skipped, all other analytics keep working. |
| `IPSTACK_BASE_URL` | `https://api.ipstack.com` | Override for a proxy or mock server. |
| `IPSTACK_TIMEOUT_MS` | `3000` | Per-request timeout (clamped 250–15000). |
| `IPSTACK_CACHE_TTL_HOURS` | `168` | Successful-lookup cache lifetime (7 days). |
| `IPSTACK_FAILURE_BACKOFF_MINUTES` | `60` | Shorter retry window after a failure, to stop burning quota on a broken key. |
| `ANALYTICS_HASH_SECRET` | falls back to `AUTH_SECRET` | HMAC key for the visitor and IP hashes. Set a dedicated 32+ byte random value. |
| `ANALYTICS_RETENTION_DAYS` | `90` | Drives the TTL index and `npm run analytics:purge`. |
| `ANALYTICS_SESSION_WINDOW_MINUTES` | `30` | Inactivity gap that closes a visit. |
| `ANALYTICS_REPORTING_TZ` | `UTC` | Timezone used to bucket report days. Storage is always UTC. |
| `ANALYTICS_EXCLUDE_ADMINS` | `true` | Marks signed-in administrators as internal traffic. |
| `ANALYTICS_TRUST_PROXY` | `false` locally / `true` in Docker | Whether to read `X-Real-IP` / `X-Forwarded-For`. |
| `ANALYTICS_RATE_LIMIT_PER_MINUTE` | `120` | Events accepted per client hash per minute. |
| `ANALYTICS_MAX_EVENTS_PER_REQUEST` | `10` | Cap on a single batch. |
| `ANALYTICS_MAX_BODY_BYTES` | `16384` | Rejects oversized bodies with `413`. |
| `ANALYTICS_MAX_RANGE_DAYS` | `90` | Hard cap on any dashboard date range. |

Templates: `.env.example` (full reference), `.env.development`, `.env.docker`, `.env.production`.
The compose files pass every variable through at **runtime**, so no secret is ever baked into
an image layer.

### Rotating the key

1. Create a new key in the APILayer dashboard.
2. Put it in `.env` on the host as `IPSTACK_ACCESS_KEY`.
3. `docker compose -f docker-compose.prod.yml up -d app` — no rebuild required.
4. Confirm on `/admin/analytics → Settings` that *Geolocation provider configured* is green.
5. Revoke the old key in APILayer.

Restarting the app also resets the in-process provider usage counters. That is expected.

---

## 3. Data model

> **Collection names.** Mongoose derives them from the model name, so the physical
> collections are `analyticsevents`, `analyticssessions` and `analyticsgeocaches` (not
> snake_case). Never hard-code them — always read `Model.collection.collectionName`, which is
> what `lib/analytics/indexes.ts` and `scripts/purge-analytics.ts` do.

### `AnalyticsEvent` → `analyticsevents`

`eventId` (unique), `eventType`, `occurredAt`, `receivedAt` (TTL), `sessionId`,
`visitorIdHash`, `ipHash`, `path`, `pageTitle`, `referrerHost`, `referrerType`,
`countryCode`, `countryName`, `continentCode`, `continentName`, `regionName`, `city`,
`latitude`, `longitude`, `timezone`, `isp`, `asn`, `connectionType`, `geoStatus`,
`deviceType`, `browserFamily`, `osFamily`, `isAuthenticated`, `userRole`, `isInternal`,
`isBot`, `metadata`.

Indexes: unique `eventId`; `occurredAt`; `(occurredAt, isBot, isInternal)`;
`(occurredAt, countryCode)`; `(occurredAt, path)`; `sessionId`;
`(visitorIdHash, occurredAt)`; `(eventType, occurredAt)`; TTL `receivedAt_1_ttl`.

### `AnalyticsSession` → `analyticssessions`

`sessionId` (unique), `visitorIdHash`, `startedAt`, `lastSeenAt`, `endedAt`,
`pageViewCount`, `landingPath`, `exitPath`, geo fields, device fields, `isAuthenticated`,
`userRole`, `isInternal`, `isBot`, `referrerHost`.

Indexes: unique `sessionId`; `startedAt`; `(visitorIdHash, startedAt)`;
`(startedAt, countryCode)`; `(isBot, isInternal, startedAt)`.

### `AnalyticsGeoCache` → `analyticsgeocaches`

`ipHash` (unique), `status`, `geo`, `errorCode`, `fetchedAt`, `expiresAt`, `hitCount`.
Indexes: unique `ipHash`; TTL `expiresAt_1` (`expireAfterSeconds: 0`).

### Never stored

Raw IP addresses, passwords, tokens, cookies, authorization headers, form values, support
message contents, grades, or assessment answers. The visitor id and IP address are HMAC'd
before they reach a query.

---

## 4. Metric definitions

These are the exact definitions the dashboard uses. They are deliberately distinct.

| Metric | Definition |
|---|---|
| **Page view** | One recorded navigation to an eligible route. Excluded: `/api/*`, `/_next/*`, `/uploads/*`, `/images/*`, `/certificates/*`, and `/admin/analytics` itself. |
| **Session (visit)** | Page views from one visitor with no gap longer than `ANALYTICS_SESSION_WINDOW_MINUTES`. Sessionization is **server-authoritative**: the client proposes a session id, but the server continues the stored session only while it is inside the window. |
| **Unique visitor** | A distinct `visitorIdHash` in the window. It is an HMAC of a random browser id — not a person, not an account. |
| **New visitor** | A visitor in the period with no recorded page view before the period started, within retained history. |
| **Returning visitor** | The complement of new: had at least one earlier page view. |
| **Avg pages per session** | `pageViews / sessions`, always computed from underlying totals. |
| **Engagement rate** | Share of sessions containing **two or more page views**. Clock-independent. |
| **Avg session duration** | Mean gap between `startedAt` and `lastSeenAt`, over sessions with ≥2 page views **and** a positive elapsed time. Rendered as `—` when no session qualifies. |
| **Top country** | Country with the most unique visitors in the window. |
| **Geo coverage** | Share of page views with a known `countryCode`. |
| **Direct / unknown referrer** | Any event with no referrer host. **Not** proof of direct navigation — referrer stripping produces the same empty value. |

Percentages are always computed from group totals, never by averaging per-group percentages.

### Event vocabulary

`page_view`, `session_start`, `session_end`, `course_view`, `lesson_view`,
`navigation_click`, `search_submitted`, `download_started`, `login_success`.

- The tracker emits `page_view` automatically on every client-side navigation.
- The server promotes `page_view` to `course_view` for `/programs/<slug>` and `lesson_view`
  for `/courses/<courseId>`.
- `navigation_click`, `search_submitted`, `download_started` and `login_success` are exposed
  via `trackEvent()` for explicit instrumentation but are **not** auto-wired, so no button or
  user action is tracked indiscriminately.
- Nothing is collected for keystrokes, form values, messages, or assessment answers.

---

## 5. Geolocation

### Provider fields by plan

| Field | Free | Professional | Business+ |
|---|---|---|---|
| country code / name | ✅ | ✅ | ✅ |
| continent code / name | ✅ | ✅ | ✅ |
| region code / name | ✅ | ✅ | ✅ |
| city | ✅ | ✅ | ✅ |
| latitude / longitude | ✅ | ✅ | ✅ |
| timezone | ✅ | ✅ | ✅ |
| postal / zip code | ✅ | ✅ | ✅ |
| ISP, ASN | — | ✅ | ✅ |
| connection type | — | — | ✅ |
| security proxy / tor / hosting flags | — | — | ✅ |

The normalizer reads whatever the response actually contains and leaves everything else
undefined. **Postal code and the security block are never requested or stored**, even when
available. A field is never invented when a lookup fails.

### Cache

- Key: `HMAC-SHA256(ANALYTICS_HASH_SECRET, "ip:" + normalizedIp)`, truncated to 32 hex chars.
  The raw address is never a cache key and never persisted.
- Successful lookups: cached for `IPSTACK_CACHE_TTL_HOURS` (default 7 days).
- Failures: cached as `status: 'negative'` for only `IPSTACK_FAILURE_BACKOFF_MINUTES`
  (default 60 minutes), so an invalid key cannot burn quota.
- One lookup per IP per cache period. The geolocation cache document has its own TTL index, so
  expired rows are reaped by MongoDB.
- A cached negative is always reported as a **failure**, never as stale success data.

### Supported address families

IPv4 and IPv6 are both normalized. Loopback, private (`10/8`, `172.16/12`, `192.168/16`,
`fc00::/7`), link-local (`169.254/16`, `fe80::/10`), CGNAT, documentation, multicast, and
reserved ranges are rejected before any outbound request. IPv4-mapped IPv6 (`::ffff:a.b.c.d`)
is classified by the embedded IPv4 address.

### Accuracy disclaimer

IP geolocation estimates the **network** location of a visitor. On mobile networks and VPNs it
can be off by tens of kilometres, and it is never a GPS-accurate position. The dashboard says
so explicitly. Browser geolocation and GPS tracking are **not** implemented and must not be
added without a separate privacy review.

---

## 6. Privacy and consent

**What is collected:** normalized path, page title, referrer hostname, coarse geography,
device/browser/OS family, a pseudonymous visitor id, a role flag for authenticated visits,
and a server timestamp.

**What is never collected:** raw IP addresses, credentials, cookies, headers, form contents,
message contents, grades, assessment answers, canvas/font/audio fingerprints.

**Identifiers.** `visitorId` is a random UUID in `localStorage`; the server stores only
`HMAC(secret, visitorId)`. `ipHash` is `HMAC(secret, "ip:" + ip)` and exists solely to key
the geolocation cache. Clearing site data resets both.

**Who can access it:** only users whose session role is `admin`. Enforced server-side by
`requireRole('admin')` on every report endpoint plus the existing `/admin/:path*` middleware
matcher. Hiding the nav link is not the control.

**How long it is kept:** `ANALYTICS_RETENTION_DAYS` (default 90) enforced by a TTL index on
`AnalyticsEvent.receivedAt`, plus `npm run analytics:purge` to prune sessions in step.

**Consent.** The tracker respects `navigator.doNotTrack === '1'` by discarding the queue. It
does **not** implement a consent-management banner. Because only pseudonymous, coarse data is
collected and no cross-site identifier is used, the module is treated as "strictly necessary
analytics". **If you later introduce a consent banner, gate the `AnalyticsTracker` behind it
before adding any non-essential tracking.**

**Deletion.** Clearing a visitor's identifier requires deleting their events by
`visitorIdHash`; note that because the hash is keyed, rotating `ANALYTICS_HASH_SECRET`
orphans historical rows rather than linking them forward.

---

## 7. Security

| Control | Implementation |
|---|---|
| Server-side authorization | `requireRole('admin')` runs before `connectToDatabase()` on every report. |
| Middleware | `proxy.ts` matcher already covers `/admin/:path*`. |
| Secret handling | Server-only env var, no `NEXT_PUBLIC_` prefix, no image layer, never logged. |
| Trusted proxy | `X-Real-IP` preferred; otherwise the **rightmost** `X-Forwarded-For` entry. Earlier entries are client-supplied and are never read. Disabled by `ANALYTICS_TRUST_PROXY=false`. |
| Input validation | zod `.strict()` schemas — unknown keys (e.g. an injected `ip` or `countryCode`) reject the event. |
| No operator injection | Every stored field is read from the validated object; metadata is allowlisted, typed, truncated, and Mongo-operator values are dropped. |
| Payload bounds | 16 KB body cap (`413`), 10 events per batch. |
| Rate limiting | Per keyed-IP sliding window, `429` + `Retry-After`. |
| Deduplication | Client `eventId` pre-check plus a unique index. |
| Idempotent timestamps | The server always sets `occurredAt`; the client's value is ignored entirely. |
| Error hygiene | Generic client messages; the caught `error.message` goes to the server log only. |
| Query bounds | Date range capped at `ANALYTICS_MAX_RANGE_DAYS`; table page size capped at 100; detailed tables paginated; CSV export capped at 5000 events / 1000 pages. |
| Cache headers | Every administrative response is `Cache-Control: private, no-store`. |
| No public IP lookup | There is no endpoint that resolves an arbitrary address. `POST /api/analytics/collect` is the only IPstack consumer and it never accepts an address. |

### Known gaps outside this module (pre-existing)

`app/api/upload/route.ts` has no authentication check, and `app/api/support/messages` accepts
unauthenticated writes. Both predate this work and are unrelated to analytics, but they should
be fixed.

---

## 8. Operations

### Creating indexes

Mongoose creates the schema-declared indexes automatically on first connection. The only
index that cannot be expressed declaratively is the **retention TTL**, whose lifetime depends
on `ANALYTICS_RETENTION_DAYS`. Bootstrap it with whichever is convenient:

**a) From the admin UI** — `/admin/analytics → Settings → Sync database indexes`. Admin only,
idempotent, creates missing indexes and re-arms the TTL. Equivalent to `POST /api/admin/analytics/indexes`.

**b) From the host** (requires `MONGODB_URI` in `.env.local`):

```bash
npm run analytics:indexes
```

The standalone Docker image ships no `scripts/` directory, so **use option (a) in Docker**.
Both paths run the same `lib/analytics/indexes.ts` function.

It is additive — it creates missing indexes and drops/recreates only the TTL index when the
configured window has changed. It never deletes data, and re-running it is a no-op.

### Purging old data

```bash
npm run analytics:purge
```

Deletes events, sessions, and geocache rows older than `ANALYTICS_RETENTION_DAYS`. The TTL
index already reaps events on its own; schedule this monthly if you want sessions pruned
promptly.

### Running checks

```bash
npm run lint
npm run typecheck
npm test          # 113 assertions, Node's built-in runner, no real IPstack quota consumed
npm run build
```

### Monitoring the provider

`/admin/analytics → Settings` shows lookup attempts, successes, failures, cache hits, quota
errors, the last success timestamp, and the last error code. Counters are **per process** and
reset on restart. IPstack does not expose a remaining-quota figure through its API, so none is
displayed — check the APILayer dashboard for plan usage.

---

## 9. Troubleshooting

| Symptom | Likely cause | Action |
|---|---|---|
| *Configuration warning* on Settings | `IPSTACK_ACCESS_KEY` unset | Add the key to `.env`, restart the app. |
| *Geo coverage 0%* while events exist | Provider unreachable, invalid key, or every visitor behind a private/proxy address | Check *Last error code*. `invalid_access_key` → rotate. `non_public_address` → expected for internal traffic. |
| `Last error code: quota_exceeded` | Plan limit reached | Upgrade the plan or raise `IPSTACK_CACHE_TTL_HOURS` so fewer lookups are needed. |
| `Last error code: feature_disabled` | Field requires a higher plan | Expected on free. The module degrades to country/region/city. |
| `Last error code: timeout` | Provider slow or blocked | Raise `IPSTACK_TIMEOUT_MS`; check outbound egress from the VPS. |
| All KPIs zero, events table empty | `ANALYTICS_ENABLED=false`, or collection only just enabled | Check the Settings tab. **Historical reports cannot be reconstructed** — data starts when tracking starts. |
| `429` in the browser network tab | Rate limit exceeded | Raise `ANALYTICS_RATE_LIMIT_PER_MINUTE`, or lower `IPSTACK_CACHE_TTL_HOURS` churn. |
| `400` from `/api/analytics/collect` | Malformed payload | Check `ANALYTICS_MAX_EVENTS_PER_REQUEST` if you increased batching. |
| Report dates shifted | `ANALYTICS_REPORTING_TZ` set | Reporting buckets use that zone; storage stays UTC. |
| Reporting timezone ignored | Small-ICU Node build | The value is validated at startup and falls back to `UTC` with a warning. `node:22-alpine` in the Dockerfile has full ICU. |
| Duplicate-looking rows in Reports | Strict Mode double-render | The tracker guards on `usePathname` and the server dedupes by `eventId`. If you add a second tracker, remove this one. |

---

## 10. Disabling analytics

Safest full stop — set this in `.env` and restart:

```bash
ANALYTICS_ENABLED=false
```

`POST /api/analytics/collect` then returns `202 { status: 'disabled' }` and writes nothing.
Existing rows stay queryable until the retention window elapses. To remove them immediately:

```bash
ANALYTICS_RETENTION_DAYS=1 npm run analytics:purge
```

That deletes everything older than one day. To wipe the analytics collections outright, drop
`analyticsevents`, `analyticssessions` and `analyticsgeocaches` in mongo-express — no other
platform data lives in them.

To drop collection only, remove the key and keep `ANALYTICS_ENABLED=true` — every metric keeps
working except geography. Removing the nav entry does not disable collection; use the env var.

---

## 11. Limitations

1. **Rate limiting is per process.** With more than one `app` replica the effective limit
   multiplies. A shared store would be needed.
2. **Provider usage counters are per process** and reset on restart. Real quota lives in the
   APILayer dashboard.
3. **No pre-aggregated daily collection.** Fine at current volume; revisit if dashboards get
   slow, then add `AnalyticsEventDaily` written by a scheduled job.
4. **Session duration is approximated** by the gap between the first and last event. It does
   not measure attention or idle time, and is suppressed for single-event sessions.
5. **Engagement is page-view depth, not interaction.** No scroll depth, video watch time, or
   click heatmaps — those require invasive instrumentation and a separate privacy review.
6. **No historical import** from nginx logs. Importing request counts would misrepresent them
   as page views and sessions, so it is deliberately not done.
7. **Bot detection is heuristic** on a small allow-pattern list. Unusual user agents are *not*
   classified as bots.
8. **Referrer attribution is coarse** — one hostname, no campaign or UTM breakdown, and no
   referrer data from privacy-stripped navigations.
9. **DNT is honoured but there is no CMP.** See §6.
10. **City-level geolocation is an estimate**, frequently wrong on mobile networks.