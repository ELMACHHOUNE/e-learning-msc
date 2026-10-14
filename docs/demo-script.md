# Demo Script — E-Learning Platform

## Duration: 3-5 minutes

---

### 0:00–0:30 — Problem & Introduction

**Script:**
"This is a full-stack e-learning platform built for my Developer Bootcamp capstone. The problem: traditional e-learning platforms give you no signal — instructors spend hours on attendance and project validation, and nobody knows how students actually engage with the material.

My solution: a three-role platform that runs the whole student lifecycle — enrollment, guilds, lab phases, project validation, attendance, graduation and certificates — plus a first-party analytics console so engagement is measurable without shipping visitor data to a third party."

---

### 0:30–1:30 — Existing Platform

**Script:**
"Let me show you the platform first. It's a full-stack application built with Next.js 16, TypeScript, MongoDB, and Docker.

[Show the dashboard]
Here's the role-based dashboard. Admins see analytics, instructors see their guilds, students see their progress.

[Show course detail]
Students navigate through modules, chapters, and lessons. The content is stored in MongoDB with a nested curriculum structure.

[Show lab phases]
Lab phases let instructors create hands-on projects. Students submit their work through a 3-step validation pipeline — presentation, git repo, then deployment."

---

### 1:30–2:30 — Student Lifecycle

**Script:**
"Now let me show the operational core — the part an instructor lives in every week.

[Open Teach → Attendance]
Attendance is tracked per session, per guild. The instructor marks present, absent or late, and it's persisted against the cohort.

[Open LabPhase → Student Projects]
Each project submission goes through three validated steps with a score on each. The instructor validates; nothing is auto-graded.

[Show a graduation record]
When skills are complete, graduation is triggered automatically and a certificate PDF is generated from a template."

---

### 2:30–3:15 — Visitor Analytics

**Script:**
"The part I'm proudest of is the analytics console, because it is entirely first-party — we do not embed a third-party tracking script.

[Open Admin → Analytics]
Page views and visits are collected by our own hardened ingest endpoint.

The key architectural points:
- IPs are never stored raw — they are HMAC-hashed with a server-side key
- Geolocation goes through IPstack and is cached, with a failure backoff so an outage does not burn quota
- The client IP is only trusted when the app is fronted by our own nginx proxy
- There is a body-size cap, a per-IP rate limit, and a retention TTL index"

---

### 3:15–3:45 — Security & Infrastructure

**Script:**
"Let me show the architecture.

The platform runs as five containers: the Next.js app, MongoDB, RustFS for media, nginx as the reverse proxy, and mongo-express for browsing data.

Security:
- JWT sessions with a one-hour expiry
- Role-based access on every route handler via requireRole
- Secrets only ever read from environment variables, never bundled to the browser
- Media is stored as objects in RustFS and streamed back through a signed route — never written to public/"

---

### 3:45–4:30 — Testing & Engineering

**Script:**
"Under the hood:
- Input validation with Zod on every route handler
- A Node-native test suite covering IP normalization, geolocation caching, report aggregation and security guards
- ESLint and strict TypeScript run before anything merges
- Media and certificate handling are isolated in lib/ so the UI never talks to S3 directly"

---

### 4:30–5:00 — Conclusion & Future

**Script:**
"In summary, this platform demonstrates:
- Full-stack engineering with Next.js and TypeScript
- A three-role domain model with real operational workflows
- A privacy-first analytics pipeline built from scratch
- Docker containerization with a production reverse proxy
- Comprehensive documentation

Future improvements would include cohort funnel reports, realtime dashboard updates, and moving analytics beyond the hot retention window into cold storage.

Thank you."