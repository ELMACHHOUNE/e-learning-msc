# Final Product Review

## Problem Solved

Traditional e-learning platforms are static - students consume content passively, instructors spend hours creating assessments manually, and progress tracking is fragmented across spreadsheets. There is no way to see how students actually engage with the material, and no tooling to help instructors scale their feedback.

## Target User

- **Students** enrolled in coding bootcamp courses who need on-demand help understanding course material
- **Instructors** who need to track attendance, validate project submissions and keep cohorts on schedule
- **Administrators** who manage courses, users, cohorts, graduation records and platform-wide engagement

## Project Journey

The project started as a standard e-learning platform with course management, user roles, and cohort tracking. It evolved through 35 development phases into a three-role platform with guilds, lab phases, project validation, automated graduation and a first-party visitor analytics console.

Key milestones:
1. **Base platform** - Authentication, course management, guild/cohort system, lab phases, project submissions, attendance, graduation, and certificate generation
2. **Visitor analytics** - First-party ingestion, IP hashing, geolocation caching, rate limiting and retention TTL
3. **Infrastructure** - Docker containerization with MongoDB, RustFS (S3-compatible storage), and nginx reverse proxy
4. **Security** - Authentication, RBAC, input validation, proxy-trusted client IP handling
5. **Documentation** - Architecture docs, analytics module guide, testing guide, demo script, interview prep

## Main Features

### Core Platform
- **Three-role architecture** (Admin, Instructor, Student) with role-based dashboards
- **Course management** with nested curriculum (modules -> chapters -> lessons)
- **Guild/cohort system** with instructor assignment and session tracking
- **Lab phases** with 3-step project submission pipeline (presentation, git repo, deployment)
- **Automated graduation** and PDF certificate generation using pdf-lib
- **Attendance tracking** per session with present/absent/late statuses
- **Real-time support chat** with admin reply capability
- **Public program catalog** with SEO optimization

### Analytics
- **First-party visitor analytics** - Page views and visits collected by a hardened public ingest endpoint
- **Geolocation** - IPstack lookups, hashed and cached, with a failure backoff so quota is not burned
- **Admin console** - Overview, geography, visitors, pages, events and retention, all server-rendered

### Infrastructure
- **Docker Compose** with 5 services (app, MongoDB, RustFS, nginx, mongo-express)
- **RustFS** (S3-compatible) for media storage
- **Nginx** reverse proxy with SSL/TLS termination
- **Automated seed scripts** for demo data with 6 graduated students

## Hardest Challenge

**Pseudonymous visitor tracking without leaking identity.** Visitor analytics needs an IP to geolocate, but storing raw IPs would make the dataset personally identifiable and legally risky. The hardest challenge was building a pipeline that is useful for reporting yet anonymous by construction:

1. Hashing IPs and visitor IDs with an HMAC key so the same visitor aggregates across visits but cannot be reversed
2. Resolving every hash through a short-lived geolocation cache, with a failure backoff so a provider outage does not burn quota
3. Trusting the client IP only when the app is fronted by a proxy we control, so a direct request cannot spoof its own address
4. Enforcing a retention TTL and a hard cap on any reportable date range

The second hardest challenge was **ingestion hardening** on a public, unauthenticated endpoint: body-size caps, per-IP rate limits, bot and internal-traffic exclusion, and idempotent event IDs so retries never double-count.

## Future Improvements

1. **Streaming ingest** - Ship events with `navigator.sendBeacon` so navigation never drops a page view
2. **Funnel reports** - Cohort-level conversion from first visit to enrollment
3. **Realtime dashboard** - Server-Sent Events instead of polling
4. **Data export** - Scheduled CSV delivery by email
5. **Longer retention** - Move from a TTL index to cold storage once the dataset outgrows the hot window