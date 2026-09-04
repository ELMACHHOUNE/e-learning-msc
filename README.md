<div align="center">
  <img src="./public/images/icon.png" alt="E-Learning MSC Logo" width="80" height="80" />
</div>

# E-Learning MSC

> **AI Developer Bootcamp — Capstone Project**
> An AI-powered e-learning platform with local LLM integration via Ollama.

A full-featured e-learning platform built with Next.js, MongoDB, and Tailwind CSS. Three-role architecture (Admin, Instructor, Student) with course management, guild/cohort system, lab phases, project submission & validation, attendance tracking, automated graduation & certificate generation, and real-time support chat. AI features include a Learning Assistant, Quiz Generator, and Project Feedback — all powered by local LLM inference.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Framer Motion |
| Database | MongoDB via Mongoose 9 |
| Auth | NextAuth.js v5 (beta) — Credentials + Google/GitHub OAuth |
| AI | Ollama (local LLM inference) + phi4-mini |
| Certificates | PDF generation via pdf-lib (template-based, placeholder erasure) |
| Charts | Recharts |
| Icons | Lucide React |
| Media storage | RustFS (S3-compatible object storage, self-hosted) via `@aws-sdk/client-s3` |
| UI Primitives | Custom components (Button, Badge, Card, Avatar, Progress, etc.) |
| Validation | Zod v4 |

## Architecture

### Roles

- **Admin** — Full access to users, courses, guilds, categories, lab phases, support messages, and graduation records
- **Instructor** — Manages assigned guilds, logs attendance, creates lab phases, validates project submissions
- **Student** — Enrolled in guilds, views courses, submits lab phase projects, tracks progress, downloads certificates

### Route Groups

- `(auth)` — Login, forgot password
- `(main)` — All authenticated pages (dashboard, admin, courses, profile, teach tools, lab phases)
- `public` — Landing page, program listing, program details

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- Docker & Docker Compose (for Ollama and services)

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
MONGODB_URI=mongodb://localhost:27017/e-learning-msc
AUTH_SECRET=your-secret-key
AUTH_URL=http://localhost:3000

# Optional: OAuth providers
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# RustFS (S3-compatible object storage) — images & media
RUSTFS_ENDPOINT=http://localhost:9000
RUSTFS_BUCKET=e-learning-msc
RUSTFS_ACCESS_KEY=elearningfsadmin
RUSTFS_SECRET_KEY=elearningfsadmin-secret
RUSTFS_REGION=us-east-1

# Docker compose only
APP_PORT=3000
HTTP_PORT=80
ME_PORT=8585
```

### Install & Run (Local Development)

```bash
npm install
npm run seed        # Populate DB with demo data
npm run dev         # http://localhost:3000
```

Login credentials after seeding: check `scripts/seed.ts` for default admin/instructor/student accounts.

### AI Setup (Ollama)

The AI features use Ollama for local LLM inference. Ollama runs as a Docker service.

#### Quick Start

```bash
# Start all services including Ollama
docker compose up -d

# Pull the AI model (one-time setup)
docker compose exec ollama ollama pull phi4-mini

# Verify Ollama is running
curl http://localhost:11434/api/tags

# Verify the model is available
docker compose exec ollama ollama list
```

#### Model Selection

**Default model: `phi4-mini`** (3.8B parameters)

- Small enough for Docker with 4-8GB RAM
- Good structured output quality
- Fast inference for interactive use (15-25 tok/s on CPU)

Alternative: `llama3.1:8b` for higher quality (requires more resources).

#### Environment Variables

```env
OLLAMA_BASE_URL=http://ollama:11434  # Docker service name
OLLAMA_MODEL=phi4-mini                # Model to use
AI_PROVIDER=ollama                    # Provider abstraction
```

#### Verification

```bash
# Check AI health endpoint
curl http://localhost:3000/api/ai/health

# Expected response:
# {"available":true,"provider":"ollama","model":"phi4-mini","modelLoaded":true}
```

---

## Branching Strategy

| Branch | Purpose | Deploy Target |
|--------|---------|---------------|
| `main` | Production-ready code | VPS (e-teaching.tech) |
| `dev` | Active development | Local / Staging |

**Workflow:**
- Create feature branches from `dev`
- Merge features → `dev` via PR
- Merge `dev` → `main` via `./scripts/merge-to-main.sh` (runs lint + build)

---

## Docker Deployment

### Development (dev branch)

**Files:** `docker-compose.dev.yml`, `Dockerfile.dev`, `nginx/nginx.dev.conf`, `.env.development`

```bash
# Switch to dev branch
git checkout dev

# First-time setup
cp .env.development .env.local
# Edit .env.local if needed

# Build & start (hot reload enabled)
docker compose -f docker-compose.dev.yml --env-file .env.development up -d --build

# Access at http://localhost:3000 (direct) or http://localhost (via nginx)
# Mongo Express: http://localhost:8585 (admin/admin)
# RustFS Console: http://localhost:9001 (elearningfsadmin/elearningfsadmin-secret)

# Seed database
docker exec e-learning-app-dev npx tsx --env-file=.env.local scripts/seed.ts

# Stop
docker compose -f docker-compose.dev.yml down
```

### Production (main branch)

**Files:** `docker-compose.prod.yml`, `Dockerfile`, `nginx/nginx.conf`, `.env.production`

```bash
# On VPS, switch to main
git checkout main
git pull origin main

# First-time setup
cp .env.production .env
# Edit .env with production values (AUTH_SECRET, AUTH_URL, etc.)

# Build & start
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# Access at https://e-teaching.tech (SSL via certbot)
# Mongo Express: http://localhost:8585
# RustFS Console: http://localhost:9001

# Stop
docker compose -f docker-compose.prod.yml down
```

### Quick Commands

| Task | Development | Production |
|------|-------------|------------|
| Build | `docker compose -f docker-compose.dev.yml --env-file .env.development build` | `docker compose -f docker-compose.prod.yml --env-file .env build` |
| Start | `docker compose -f docker-compose.dev.yml --env-file .env.development up -d` | `docker compose -f docker-compose.prod.yml --env-file .env up -d` |
| Logs | `docker logs -f e-learning-app-dev` | `docker logs -f e-learning-app` |
| Restart | `docker compose -f docker-compose.dev.yml restart` | `docker compose -f docker-compose.prod.yml restart` |
| Seed | `docker exec e-learning-app-dev npx tsx --env-file=.env.local scripts/seed.ts` | `docker exec e-learning-app npx tsx --env-file=.env scripts/seed.ts` |

### Helper Scripts

```bash
# Setup branch environment
./scripts/setup-branch.sh dev    # or main

# Deploy
./scripts/deploy.sh dev          # or prod

# Merge dev → main (with lint + build checks)
./scripts/merge-to-main.sh
```

---

## Legacy Docker Compose (docker-compose.yml)

The original `docker-compose.yml` is kept for reference. Use `docker-compose.prod.yml` for new production deployments.

```bash
cp .env.docker .env   # compose template — fill in AUTH_SECRET / AUTH_URL
docker compose up --build   # nginx on ${HTTP_PORT:-80}, app direct on ${APP_PORT:-3000}, mongo on 27017, rustfs S3 on 9000 + console on 9001, mongo-express on ${ME_PORT:-8585}
docker compose down         # stop (data persists in the mongodb_data / rustfs_data volumes)
```

Browse the app through nginx at `http://localhost`. `AUTH_URL` must match the nginx-facing URL (default `http://localhost` in `.env.docker`). The app container also stays reachable directly on `${APP_PORT:-3000}` for debugging.

Seed the container database after `up`:

```powershell
$env:MONGODB_URI='mongodb://localhost:27017/e-learning-msc'
$env:SEED_PASSWORD='password123'
npx tsx scripts/seed.ts
```

Uploaded images/avatars/cover photos are stored in the RustFS bucket (`RUSTFS_BUCKET`, default `e-learning-msc`) and served back through `app/uploads/[...path]/route.ts`, so the client URL stays `/uploads/<folder>/<name>`. Push Media to the RustFS console at `http://localhost:9001` (default `RUSTFS_ACCESS_KEY` / `RUSTFS_SECRET_KEY` in `.env.docker`).

A Mongo web UI is available at `http://localhost:8585` (mongo-express; login `ME_USER`/`ME_PASSWORD`, defaults `admin`/`admin`). Note: `8081` is not used by default — Windows Docker Desktop reserves the 8054–8353 port band, so `ME_PORT` defaults to `8585`.

Note: port `9000` is the RustFS **S3 API** only (no browser UI — it returns `AccessDenied` XML to anonymous browser hits, which is expected). The storage console is on `9001`.

## Project Structure

Source files live at the **project root** (there is no `src/` directory); the `@/*` path alias resolves to the repo root.

```
├── app/
│   ├── (auth)/                          # Public auth pages
│   │   ├── login/page.tsx               # Sign in with credentials/OAuth
│   │   └── forgot-password/page.tsx     # Password reset request
│   ├── (main)/                          # Authenticated shell (navbar, sidebar, chat)
│   │   ├── layout.tsx                   # Main layout with providers
│   │   ├── admin/                       # Admin portal
│   │   │   ├── page.tsx                 # Admin dashboard overview
│   │   │   └── courses/
│   │   │       ├── [id]/page.tsx        # Course editor (full builder)
│   │   │       └── new/page.tsx         # Create new course
│   │   ├── courses/                     # Course catalog (authenticated)
│   │   │   ├── page.tsx                 # Course listing
│   │   │   └── [courseId]/page.tsx      # Course detail viewer
│   │   ├── dashboard/page.tsx           # Role-based analytics dashboard
│   │   ├── graduations/page.tsx         # Graduation records & certificate export
│   │   ├── instructors/page.tsx         # Instructor directory (admin)
│   │   ├── labphase/                    # Lab phase management
│   │   │   ├── lab-phase-list/page.tsx  # List & create lab phases
│   │   │   └── student-projects/page.tsx# Project submissions & validation
│   │   ├── profile/page.tsx             # Account settings & avatar upload
│   │   ├── students/page.tsx            # Student directory
│   │   └── teach/                       # Instructor tools
│   │       ├── attendance/page.tsx      # Session attendance logging
│   │       ├── earnings/page.tsx        # Earnings overview
│   │       ├── one-to-one/page.tsx      # One-to-one sessions
│   │       └── online-sessions/page.tsx # Online session management
│   ├── api/                             # REST API route handlers
│   │   ├── admin/
│   │   │   ├── categories/              # CRUD for categories
│   │   │   ├── courses/                 # CRUD for courses
│   │   │   ├── dashboard/route.ts       # Admin stats
│   │   │   ├── guilds/                  # CRUD for guilds/cohorts
│   │   │   ├── labphases/               # CRUD + approve lab phases
│   │   │   └── users/                   # User management
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth.js handlers
│   │   ├── certificates/
│   │   │   ├── route.ts                 # List certificates (admin)
│   │   │   ├── mine/route.ts            # Current user's certificates
│   │   │   └── generate/route.ts        # PDF generation
│   │   ├── courses/route.ts             # Public course listing
│   │   ├── dashboard/route.ts           # Dashboard analytics data
│   │   ├── instructors/route.ts         # Instructor listing
│   │   ├── projects/                    # Project applications CRUD
│   │   ├── students/route.ts            # Student listing
│   │   ├── support/messages/route.ts    # Support chat messages
│   │   ├── upload/route.ts              # Base64 image → RustFS upload
│   │   └── user/profile/route.ts        # Current user profile CRUD
│   ├── uploads/[...path]/route.ts       # Streams RustFS objects (signed S3 GET)
│   ├── programs/                        # Public course catalog
│   │   ├── page.tsx                     # Program listing with cards
│   │   └── [courseId]/page.tsx          # Public course detail (SEO, curriculum)
│   ├── globals.css                      # Tailwind v4 theme tokens
│   ├── layout.tsx                       # Root layout (providers, fonts)
│   ├── page.tsx                         # Landing page
│   ├── loading.tsx                      # Global loading UI
│   ├── not-found.tsx                    # 404 page
│   ├── robots.ts                        # robots.txt generation
│   └── sitemap.ts                       # sitemap.xml generation
├── components/
│   ├── admin/
│   │   └── course-editor.tsx            # Full course content builder (modules/chapters/lessons)
│   ├── ai/                              # AI feature components
│   │   ├── index.ts                     # Barrel export
│   │   ├── learning-assistant.tsx       # Student chat widget
│   │   ├── quiz-generator.tsx           # Instructor quiz builder
│   │   ├── project-feedback.tsx         # Instructor feedback display
│   │   └── ai-badge.tsx                 # AI-generated badge
│   ├── certificate/
│   │   └── certificate-dialog.tsx       # Certificate preview & download dialog
│   ├── dashboard/
│   │   └── admin-charts.tsx             # Recharts analytics (pie, bar, donut, horizontal bar)
│   ├── shared/
│   │   ├── navbar.tsx                   # Top navigation with user menu
│   │   ├── sidebar-navigation.tsx       # Collapsible role-based sidebar
│   │   ├── chat-support.tsx             # Intercom-style support widget
│   │   ├── session-provider.tsx         # NextAuth session context
│   │   ├── logo-spinner.tsx             # Branded loading spinner
│   │   ├── theme-toggle.tsx             # Dark/light mode toggle
│   │   └── index.ts                     # Barrel export
│   └── ui/                              # Reusable primitives (Button, Badge, Card, Avatar, Input, Alert, ConfirmDialog, Progress, ImageUpload, RichTextEditor)
├── lib/
│   ├── ai/                              # AI service layer
│   │   ├── index.ts                     # Barrel exports
│   │   ├── client.ts                    # Ollama HTTP client
│   │   ├── provider.ts                  # AIProvider interface + OllamaProvider
│   │   ├── prompts.ts                   # Centralized prompt builders
│   │   ├── schemas.ts                   # Zod schemas for AI output
│   │   ├── assistant.ts                 # Learning assistant logic
│   │   ├── quiz-generator.ts            # Quiz generation logic
│   │   ├── project-reviewer.ts          # Project feedback logic
│   │   └── errors.ts                    # AI-specific error types
│   ├── auth.ts                          # NextAuth config, getCurrentUser(), requireRole()
│   ├── certificate.ts                   # Client helper: generate/download certificate PDFs
│   ├── db.ts                            # Cached MongoDB connection (connectToDatabase)
│   ├── graduation.ts                    # ensureGraduation() + ACADEMY_NAME config
│   ├── rustfs.ts                        # S3 client + bucket init + upload/get for RustFS
│   └── utils.ts                         # cn(), formatDate(), truncate(), safeUrl(), safeMailto(), safePhoneUrl()
├── models/                              # 10 Mongoose models (guards against hot-reload recompilation)
│   ├── User.ts
│   ├── Course.ts
│   ├── CourseContent.ts
│   ├── Guild.ts
│   ├── LabPhase.ts
│   ├── ProjectApplication.ts
│   ├── SessionLog.ts
│   ├── Certificate.ts
│   ├── Category.ts
│   └── Message.ts
├── types/
│   ├── index.ts                         # Core domain interfaces
│   ├── certificate.ts                   # Certificate-specific types
│   └── next-auth.d.ts                   # NextAuth module augmentation
├── hooks/
│   └── use-outside-click.tsx            # Click-outside detection hook
├── public/
│   ├── certificates/PDF/certificate.pdf # Branded certificate template
│   ├── images/                          # Static assets (icon, covers, screenshots)
│   └── videos/                          # Demo videos
├── scripts/
│   ├── seed.ts                          # Full DB reset + demo data (6 graduates)
│   ├── seed-graduations.ts              # Legacy additive graduation data
│   └── assign-graduate.ts               # Graduate single student by email
├── nginx/nginx.conf                     # Reverse proxy (HTTP→HTTPS, TLS termination, proxy to app:3000)
├── Dockerfile                           # 3-stage build → standalone server (Node 22 alpine, non-root)
├── docker-compose.yml                   # nginx + app + MongoDB 7 + RustFS + mongo-express
├── .dockerignore
├── .env.example                         # Environment template
├── .env.docker                          # Compose env template
├── next.config.ts                       # Next.js config (standalone output, proxyClientMaxBodySize)
├── proxy.ts                             # NextAuth middleware (protects authenticated routes)
├── postcss.config.mjs                   # Tailwind v4 PostCSS config
├── tsconfig.json                        # TypeScript config (strict, @/* alias)
├── eslint.config.mjs                    # ESLint flat config (eslint-config-next)
├── package.json
├── README.md
├── AGENTS.md
├── DESIGN.md
├── CLAUDE.md
├── LICENSE
└── Prompt.md
```

## Data Models

### User
`name`, `email`, `phone`, `password` (hashed), `avatar`, `role` (admin|instructor|student)

### Course
`title`, `description`, `coverImage`, `price`, `active`, `durationInMonths`, `totalSessions`, `category`, `content` (modules → chapters → lessons/checkpoints/workshops)

### Guild
Cohort of students assigned to a course with an instructor. `name`, `courseId`, `instructorId`, `studentIds`, `currentSession`, `skillsTotal`, `skillsAchieved`

### LabPhase
`title`, `description`, `instructions`, `duration`, `image`, `category`, `status` (pending|approved|rejected), `createdBy`, `rejectionReason`

### ProjectApplication
Links a student's project submission to a lab phase. 3-step pipeline: presentation URL → git repo → deployment. Each step scored 0–10; `finalGrade` auto-calculated.

### SessionLog
Per-session attendance: `guildId`, `sessionNumber`, `date`, `records[]` (studentId + status)

### Certificate
Graduation record generated automatically when a student completes a course (all guild sessions) and a lab phase project (status `completed`). `studentName`, `studentEmail`, `courseId`, `courseTitle`, `instructorId`, `instructorName`, `academyName`, `durationF`, `formationDate`, `certificateId` (e.g. `CERT-2026-0001`), `graduatedAt`

### Category
Taxonomy for courses and lab phases. `name` (unique)

### Message
Support chat: `name`, `email`, `message`, `isAdmin`, `read`, timestamps

### AIConversation
Chat history for AI Learning Assistant: `userId`, `courseId`, `contentId`, `messages[]` (role, content, confidence, createdAt)

### AIQuizDraft
Quiz drafts for instructor review: `createdBy`, `courseId`, `title`, `description`, `questions[]`, `difficulty`, `status` (draft|approved|rejected), `aiModel`, `aiGenerationTime`

## API Overview

| Endpoint | Methods | Access |
|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | Public |
| `/api/dashboard` | GET | Authenticated (role-based) |
| `/api/user/profile` | GET, PUT | Authenticated |
| `/api/projects` | GET, POST | Authenticated |
| `/api/projects/[id]` | PUT | Student/Instructor |
| `/api/students` | GET | Admin/Instructor |
| `/api/instructors` | GET | Admin |
| `/api/support/messages` | GET, POST, PATCH | Authenticated |
| `/api/admin/dashboard` | GET | Admin |
| `/api/admin/users` | GET, POST | Admin |
| `/api/admin/users/[id]` | PUT, DELETE | Admin |
| `/api/admin/courses` | GET, POST | Admin |
| `/api/admin/courses/[id]` | GET, PUT, DELETE | Admin |
| `/api/admin/guilds` | GET, POST | Admin |
| `/api/admin/guilds/[id]` | PUT, DELETE | Admin |
| `/api/admin/categories` | GET, POST | Admin |
| `/api/admin/categories/[id]` | DELETE | Admin |
| `/api/admin/labphases` | GET, POST | Admin/Instructor |
| `/api/admin/labphases/[id]` | PUT, DELETE | Owner/Admin |
| `/api/admin/labphases/[id]/approve` | PUT | Admin |
| `/api/certificates` | GET | Admin (lists + backfills graduation records) |
| `/api/certificates/mine` | GET | Authenticated (current user's certificates) |
| `/api/certificates/generate` | POST | Admin/Instructor/Student (renders certificate PDF) |
| `/api/upload` | POST | Authenticated (base64 image → RustFS, returns `/uploads/...` URL) |
| `/api/ai/assistant` | POST | Student (AI learning assistant) |
| `/api/ai/quiz` | POST | Instructor/Admin (AI quiz generation) |
| `/api/ai/quiz/drafts` | GET, POST | Instructor/Admin (quiz draft management) |
| `/api/ai/project-review` | POST | Instructor/Admin (AI project feedback) |
| `/api/ai/health` | GET | Public (AI service health check) |
| `/uploads/[...path]` | GET | Public (streams stored RustFS objects to the browser) |

## Features

### Admin Portal (`/admin`)
- **User Management** — Create, edit, delete users with role assignment
- **Course Creator** — Full course builder with module/chapter/lesson tree, rich text editor, image upload
- **Guild Assignment** — Assign courses and instructors to student cohorts
- **Categories** — Taxonomy management for courses and lab phases
- **Support Messages** — Conversation inbox with reply capability

### Course Management
- Nested curriculum: modules → chapters → lessons (with checkpoint/workshop types)
- Rich text content with WYSIWYG editor (bold, italic, underline, font size, color, lists, image/video embed)
- Cover image upload
- SEO metadata, JSON-LD structured data, Open Graph cards

### Guild / Cohort System
- Students organized into guilds with assigned instructor
- Session-by-session progression tracking
- Skills tracking with achievement percentage

### Lab Phases & Projects
- Instructors create lab phases (pending admin approval)
- Students apply when all course sessions completed
- 3-step submission pipeline: presentation URL, git repo, deployment URL
- Instructor validation per step (score 0–10)
- Automatic final grade calculation (average of validated steps)

### Graduation & Certificates
- **Auto-detection** — `ensureGraduation()` in `lib/graduation.ts` registers a graduation when a student has ≥1 fully completed course (all guild sessions done) AND ≥1 completed lab phase project
- **Certificate records** — one per completed project, with unique sequential IDs (`CERT-YYYY-####`) and a formatted graduation date
- **PDF generation** — official certificate rendered from a branded template (`public/certificates/PDF/certificate.pdf`) using pdf-lib; placeholders erased and replaced with student/course/instructor data
- **Admin** — `/graduations` page lists all graduates with stats (total, this year), search, and one-click certificate export
- **Student** — a "Congratulations" certificate card on the dashboard with a **View & Download** button that generates the PDF
- **Backfill** — the admin certificates API retro-registers any eligible student who graduated before the feature existed

### Attendance Tracking
- Per-session attendance with present/absent/late statuses
- Historical session log storage

### Role-Based Dashboards
- **Admin**: User distribution pie chart, courses by category bar chart, course active/inactive status donut, guilds by course horizontal bar chart, stat cards
- **Instructor**: Guild list with session/skill progress bars
- **Student**: Enrolled guilds with progress tracking + elegant certificate card (with download) once graduated

### Support Chat
- Fixed bottom-right intercom-style widget
- Conversations grouped by email
- Admin reply with read/unread tracking

### AI Features

#### AI Learning Assistant
Students can ask questions about their course material. The assistant receives relevant course context and responds based on the provided content. Features include:
- Context-aware responses grounded in course material
- Confidence ratings (high/medium/low)
- Suggested follow-up questions
- Clear AI-generated labeling

**Location:** Course detail page → "AI Assistant" tab

#### AI Quiz Generator
Instructors generate quiz questions from course content. The AI produces structured quiz data that instructors can review, edit, and approve before publishing. Features include:
- Configurable question count (1-20)
- Difficulty levels (easy/medium/hard)
- Editable questions and answers
- Draft saving for review
- Human-in-the-loop approval

**Location:** Teach → AI Quiz Generator

#### AI Project Feedback
Instructors get AI-powered analysis of student project submissions. The feedback is advisory — instructors make final evaluation decisions. Features include:
- Completeness and structure analysis
- Strengths and issues identification
- Actionable recommendations
- Score with reasoning (0-100)
- Clear AI-generated labeling

**Location:** LabPhase → Student Projects → Expand project → "Generate AI Feedback"

### Public Pages
- Program listing with course cards (cover, title, description, duration, sessions, modules, price)
- Course detail with full curriculum tree, hero section, instructor info, WhatsApp enrollment link
- SEO-optimized with sitemap and robots.txt

## Seed Scripts

The seed script (`scripts/seed.ts`) drops the database and populates it with:
- 1 admin, 3 instructors, 30 students
- 3 categories, 3 courses with full module/chapter/lesson content
- 5 guilds with assigned students and instructors
- Session logs and 4 lab phases
- **6 graduates at 100% completion** (completed guilds + validated lab projects + certificates via `ensureGraduation()`), used to test certificate PDF generation

Run with:

```bash
npm run seed
```

**Legacy additive scripts** (no longer required — the main seed covers graduation data):

```bash
npm run seed:grad     # Additive demo graduation data (idempotent)
npm run assign:grad   # Graduate a single student by email, e.g. npm run assign:grad mourad@elearning.msc
```

The `assign:grad` script assigns the given student to an instructor, creates a fully completed guild + completed lab phase project, and registers their graduation (generates a certificate record).

**Demo graduates** created by `npm run seed` (password `password123`):

`lina.benali@fake.msc`, `youssef.elamrani@fake.msc`, `sara.mansouri@fake.msc`, `omar.haddad@fake.msc`, `nora.fassi@fake.msc`, `karim.berrada@fake.msc`

## Scripts

```bash
npm run dev            # Development server
npm run build          # Production build
npm run start          # Start production server
npm run lint           # ESLint
npm run seed           # Full demo data (courses + 6 graduates with certificates)
npm run seed:grad      # Legacy additive graduation demo data
npm run assign:grad    # Assign one student graduate data by email
```

## Documentation

| Document | Description |
|----------|-------------|
| [Final Product Review](docs/final-product-review.md) | Problem solved, features, challenges, future improvements |
| [Architecture](docs/architecture.md) | System diagram, request flow, data flow |
| [Portfolio Case Study](docs/portfolio-case-study.md) | Full case study for portfolio presentation |
| [AI Architecture](docs/ai-architecture.md) | AI system design and request lifecycle |
| [Prompt Engineering](docs/prompt-engineering.md) | Prompt design and injection defense |
| [API Reference](docs/api.md) | API endpoint documentation |
| [AI Testing](docs/ai-testing.md) | AI testing strategy |
| [Demo Script](docs/demo-script.md) | 3-5 minute presentation script |
| [Interview Questions](docs/interview-questions.md) | 15 interview Q&A pairs |
| [LinkedIn Post](docs/linkedin-post.md) | LinkedIn project post draft |
| [Release Checklist](docs/final-release-checklist.md) | Final release audit |

## Authentication

- **Credentials**: Email + password with bcrypt hashing
- **OAuth**: Google and GitHub (optional)
- **Session strategy**: JWT (1-hour max age)
- **Middleware**: Protects all authenticated routes, redirects to `/login`

## HTTPS / SSL Configuration

The production deployment runs on **Oracle Cloud Infrastructure** using an **Oracle Linux 9.8 (ARM/AArch64)** VM.

### Domain & DNS

- `e-teaching.tech`
- `www.e-teaching.tech`

Both domains point to the Oracle Cloud VM public IP address via `A` records.

### Firewall & Network

- **Oracle Cloud VCN Security List** — inbound rules allow **TCP 80 (HTTP)** and **TCP 443 (HTTPS)** from `0.0.0.0/0`.
- **Server firewalld** — the same ports are opened permanently:
  ```bash
  sudo firewall-cmd --permanent --add-service=http
  sudo firewall-cmd --permanent --add-service=https
  sudo firewall-cmd --reload
  ```

### Certbot Installation

The `certbot` package was **not available** in the configured Oracle Linux 9 repositories, so it was installed manually under `/opt/certbot`:

```bash
cd /opt
sudo wget https://github.com/certbot/certbot/archive/refs/tags/v4.2.0.tar.gz
sudo tar -xzf v4.2.0.tar.gz
cd certbot-4.2.0
sudo pip3 install .
```

The executable is available at `/opt/certbot/bin/certbot`.

### Certificate Generation

The certificate was obtained using the **standalone HTTP-01 challenge** (no web server running on port 80 during issuance). The successful command:

```bash
sudo /opt/certbot/bin/certbot certonly \
  --standalone \
  --http-01-port 80 \
  --non-interactive \
  --agree-tos \
  --email mohamed20rida@gmail.com \
  --preferred-challenges http \
  -d e-teaching.tech \
  -d www.e-teaching.tech \
  -v
```

- `--standalone` spins up a temporary HTTP server on port 80 for the challenge.
- `--http-01-port 80` ensures the challenge listens on the standard HTTP port.

### Certificate Files & Expiration

The issued certificate and private key are located at:

```
/etc/letsencrypt/live/e-teaching.tech/fullchain.pem
/etc/letsencrypt/live/e-teaching.tech/privkey.pem
```

**Current expiration:** `2026-11-19` — renewal must be configured before this date.

### Verification Commands

Use these commands to verify the setup:

```bash
# List certificates managed by Certbot
sudo /opt/certbot/bin/certbot certificates

# Check firewalld allowed services/ports
sudo firewall-cmd --list-all

# Verify port 80 is listening (HTTP)
sudo ss -lntp | grep ':80'

# Verify port 443 is listening (HTTPS)
sudo ss -lntp | grep ':443'
```

### Nginx Reverse Proxy Configuration

The `nginx/nginx.conf` reverse proxy terminates TLS and forwards traffic to the Next.js application running on port 3000 (inside the Docker network). The required server blocks:

```nginx
# HTTP → HTTPS redirect
server {
    listen 80;
    server_name e-teaching.tech www.e-teaching.tech;

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS termination & proxy to Next.js
server {
    listen 443 ssl http2;
    server_name e-teaching.tech www.e-teaching.tech;

    ssl_certificate     /etc/letsencrypt/live/e-teaching.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/e-teaching.tech/privkey.pem;

    # TLS hardening (recommended)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Key points:
- **Port 80** redirects all HTTP traffic to HTTPS.
- **Port 443** terminates TLS using the Let's Encrypt certificate/key.
- Requests are proxied to `http://app:3000` (the Next.js container name in Docker Compose).
- Standard proxy headers (`X-Forwarded-*`, `Host`) are forwarded so the application knows the original client IP and protocol.

### Certificate Renewal

Certbot should be tested with a dry run before relying on automated renewal:

```bash
sudo /opt/certbot/bin/certbot renew --dry-run
```

If the dry run succeeds, configure automated renewal via cron or systemd timer:

```bash
# /etc/cron.d/certbot-renew
0 */12 * * * root /opt/certbot/bin/certbot renew --quiet --post-hook "docker exec nginx nginx -s reload"
```

- Runs twice daily (at minute 0 of every 12th hour).
- `--quiet` suppresses output unless there's an error.
- `--post-hook` reloads nginx inside the container so the renewed certificate is picked up without downtime.