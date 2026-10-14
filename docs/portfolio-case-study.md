# Portfolio Case Study — E-Learning Platform

## Project Summary

A full-stack e-learning platform built as a Developer Bootcamp capstone project. The platform serves three user roles (Admin, Instructor, Student) and covers the full student lifecycle — enrollment, cohorts, lab phases, project validation, attendance, automated graduation and certificates — plus a privacy-first visitor analytics console.

**Live URL:** [e-teaching.tech](https://e-teaching.tech)
**Repository:** [GitHub](https://github.com/ELMACHHOUNE/e-learning-msc)

## Problem

Traditional e-learning platforms are passive content delivery systems with no operational core. Instructors track attendance and validate projects by hand, project feedback varies between evaluators, and once a student graduates there is no record anyone can query. On top of that, engagement is invisible — the platform has no idea how many people actually read the material.

## Target User

| Role              | Need                                                                   |
| ----------------- | ---------------------------------------------------------------------- |
| **Student**       | See where they are in the program and what is due next                 |
| **Instructor**    | Run attendance and project validation across their guilds without toil |
| **Administrator** | Centralized management of courses, users, cohorts and graduations      |

## Solution

I built a full-stack e-learning platform around the operational workflows that actually cost an instructor time, and added a first-party analytics pipeline so engagement is measurable without shipping visitor data to a third party.

### Key Technical Decisions

1. **Hash-first analytics** — Raw IPs are never persisted; they are HMAC-hashed with a server-side key so visits aggregate per visitor but cannot be reversed
2. **Trust the proxy, not the header** — The client IP is only believed when the app is fronted by our own nginx, otherwise anyone can spoof their address
3. **Cache with a failure backoff** — Geolocation lookups are cached, and a provider outage triggers a cooldown window so quota is not burned
4. **Retention as a first-class concern** — A TTL index and a hard cap on reportable date ranges, driven from one config value
5. **Idempotent ingestion** — Every event carries a unique ID, so client retries never double-count a page view

## Features

### Core Platform

- Three-role architecture with role-based dashboards and RBAC
- Course management with nested curriculum (modules → chapters → lessons)
- Guild/cohort system with session-by-session progression tracking
- Lab phases with 3-step project submission pipeline
- Automated graduation detection and PDF certificate generation
- Attendance tracking, support chat, and public program catalog

### Visitor Analytics

- **First-party ingestion** — A hardened public endpoint with body caps, per-IP rate limits and idempotent event IDs
- **Pseudonymous identity** — HMAC-hashed visitor and IP identifiers, never raw addresses
- **Geolocation** — IPstack lookups cached per IP hash with a failure backoff
- **Admin console** — Overview, geography, visitors, pages, events and retention, all admin-gated

### Infrastructure

- Docker Compose with 5 services (app, MongoDB, RustFS, nginx, mongo-express)
- Nginx reverse proxy with SSL/TLS termination
- RustFS (S3-compatible) for media storage, streamed back through a signed route
- Automated seed scripts with demo data

## Personal Role

This is a solo capstone project. I designed the architecture, implemented all features, built the analytics module end to end, set up the Docker infrastructure, configured the production deployment on Oracle Cloud behind nginx, and created all documentation.

## Tech Stack

| Layer          | Technology                                                       |
| -------------- | ---------------------------------------------------------------- |
| Frontend       | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion |
| Backend        | Next.js API Routes, NextAuth v5, Zod                             |
| Database       | MongoDB 7, Mongoose 9                                            |
| Analytics      | First-party ingest, HMAC hashing, IPstack geolocation, Recharts  |
| Storage        | RustFS (S3-compatible), pdf-lib for certificates                 |
| Infrastructure | Docker Compose, nginx, Oracle Cloud                              |
| DevOps         | GitHub, ESLint, TypeScript strict mode, Node test runner         |

## Challenges

### 1. Measuring engagement without storing identity

**Challenge:** Visitor analytics needs an IP to geolocate, but persisting raw IPs makes the dataset personally identifiable.
**Solution:** The IP is HMAC-hashed with a key that never leaves the server. Every geolocation lookup goes through a cache keyed by that hash, and the stored event carries only the hash plus the resolved country/city.

### 2. Trusting the client IP safely

**Challenge:** Behind a reverse proxy, `X-Forwarded-For` is attacker-controlled. Reading it unconditionally lets anyone forge their own geography.
**Solution:** A single config flag decides whether the proxy's address is trusted. Nginx sets `X-Real-IP` to the real peer, and the flag is only enabled when the app is fronted by that proxy.

### 3. A public ingestion endpoint

**Challenge:** The collector is unauthenticated by necessity, which makes it an abuse vector.
**Solution:** Body-size cap, per-IP rate limit, a cap on events per request, bot and internal-traffic exclusion, and idempotent event IDs so retries are free.

### 4. Fitting analytics into 30 GB

**Challenge:** The deployment target had a 30 GB root disk shared by Docker, MongoDB and object storage, and image builds ran out of space mid-copy.
**Solution:** Dropped the unused local LLM service and its model volume, pruned build cache between releases, and capped the builder heap so the build does not balloon.

## Learning Outcomes

1. **Privacy by construction** — Hashing at the edge of the pipeline is far simpler than redacting afterwards, and it is the only approach that survives an audit.
2. **Configuration is a security boundary** — One flag decides whether a request header is believed. Getting that wrong is a data-integrity bug, not a style choice.
3. **Rate limits are part of the design** — A public write endpoint is only as good as its guardrails.
4. **Docker orchestration** — Managing services with health checks, volumes and environment variables taught me production-grade containerization, and how quickly disk fills up if you do not prune.
5. **Deleting is engineering too** — Removing an unused service freed gigabytes and removed an entire failure surface, which was worth more than any feature built on top of it.

## Future Improvements

1. **Cohort funnels** — Conversion from first visit to enrollment
2. **Streaming ingest** — `navigator.sendBeacon` so navigation never drops a page view
3. **Realtime console** — Server-Sent Events instead of polling
4. **Data export** — Scheduled CSV delivery by email
5. **Cold storage** — Move analytics past the hot retention window into archived exports