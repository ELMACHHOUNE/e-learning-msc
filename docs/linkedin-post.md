# LinkedIn Post — E-Learning Platform

---

Excited to share my Developer Bootcamp final capstone project: a full-stack e-learning platform!

**The Problem:**
Traditional e-learning platforms are static — instructors hand-track attendance and validate projects one by one, graduation is a manual process, and nobody can see how students actually engage with the material.

**The Solution:**
I built a three-role platform (Admin, Instructor, Student) covering the whole student lifecycle, plus a privacy-first analytics pipeline so engagement is measurable without handing visitor data to a third party.

**What I Built:**
- Guild/cohort system with session-by-session attendance tracking
- Lab phases with a 3-step project submission pipeline (presentation, git repo, deployment)
- Automated graduation detection and PDF certificate generation
- Real-time support chat and a public program catalog
- First-party visitor analytics: hardened ingest, pseudonymous hashing, geolocation caching and an admin console

**Tech Stack:**
- Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
- MongoDB 7 + Mongoose 9
- RustFS (S3-compatible) for media, pdf-lib for certificates
- Docker containerization behind an nginx reverse proxy with SSL
- NextAuth v5 for authentication, Zod for validation

**Key Engineering Decisions:**
- Hash-first analytics — raw IPs are never persisted, only HMAC digests
- Trust the proxy, not the header — the client IP is only believed when we control the proxy
- Idempotent ingestion — every event carries a unique ID, so retries never double-count
- Retention as a first-class concern — a TTL index driven from a single config value
- Human-in-the-loop — instructors make every grading and graduation decision

**What I Learned:**
- Privacy by construction beats redaction after the fact, and it's the only approach that survives an audit
- A public write endpoint is only as good as its guardrails
- Deleting is engineering too — removing an unused service freed gigabytes of disk and an entire failure surface

**Architecture:**
Browser → nginx → Next.js → Auth → RBAC → Validation → MongoDB / RustFS → Response

The platform is fully containerized with Docker Compose, deployed on Oracle Cloud, and includes comprehensive documentation.

#NextJS #TypeScript #MongoDB #Docker #Privacy #Analytics #Elearning #FullStack #Capstone #Engineering

---

*Note: This post reflects the actual implementation. No features are fabricated.*