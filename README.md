<div align="center">
  <img src="./public/images/icon.png" alt="E-Learning MSC Logo" width="80" height="80" />
</div>

# E-Learning MSC

A full-featured e-learning platform built with Next.js, MongoDB, and Tailwind CSS. Three-role architecture (Admin, Instructor, Student) with course management, guild/cohort system, lab phases, project submission & validation, attendance tracking, automated graduation & certificate generation, and real-time support chat.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Framer Motion |
| Database | MongoDB via Mongoose 9 |
| Auth | NextAuth.js v5 (beta) — Credentials + Google/GitHub OAuth |
| Certificates | PDF generation via pdf-lib (template-based, placeholder erasure) |
| Charts | Recharts |
| Icons | Lucide React |
| Media storage | RustFS (S3-compatible object storage, self-hosted) via `@aws-sdk/client-s3` |
| UI Primitives | Custom components (Button, Badge, Card, Avatar, Progress, etc.) |

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

### Install & Run

```bash
npm install
npm run seed        # Populate DB with demo data
npm run dev         # http://localhost:3000
```

Login credentials after seeding: check `scripts/seed.ts` for default admin/instructor/student accounts.

### Run with Docker

The project is containerized (`next.config.ts` sets `output: 'standalone'`; a 3-stage `Dockerfile` runs the minimal standalone server as a non-root user). Nginx (`nginx/nginx.conf`) is the front-door reverse proxy on port 80. MongoDB 7 and RustFS (S3-compatible media storage) run as companion services.

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
│   ├── (auth)/                    # Login, forgot-password
│   ├── (main)/
│   │   ├── admin/                 # Admin portal, course editor
│   │   ├── courses/               # Course listing & detail viewer
│   │   ├── dashboard/             # Role-based analytics dashboard
│   │   ├── graduations/           # Graduation records & certificate export (admin)
│   │   ├── labphase/              # Lab phase CRUD & project submissions
│   │   ├── profile/               # Account settings
│   │   ├── students/              # Student directory
│   │   ├── instructors/           # Instructor directory (admin)
│   │   └── teach/                 # Attendance, earnings, sessions, one-to-one
│   ├── api/                       # REST endpoints (see API Overview)
│   ├── uploads/[...path]          # Streams RustFS media back to the browser (signed S3 GET)
│   ├── programs/                  # Public course catalog
│   └── globals.css                # Tailwind v4 theme tokens
├── components/
│   ├── admin/course-editor.tsx    # Full course content builder
│   ├── certificate/               # CertificateDialog + student certificate cards
│   ├── dashboard/admin-charts.tsx # Recharts analytics components
│   ├── shared/                    # Navbar, sidebar, chat support, session provider, spinner
│   └── ui/                        # Button, Badge, Card, Avatar, Input, Alert, ConfirmDialog, etc.
├── lib/
│   ├── auth.ts                    # NextAuth config, getCurrentUser(), requireRole()
│   ├── certificate.ts             # Client helper: generate/download certificate PDFs
│   ├── db.ts                      # Cached MongoDB connection
│   ├── graduation.ts              # ensureGraduation() + academy/certificate config
│   ├── rustfs.ts                  # S3 client + bucket init + upload/get for RustFS
│   └── utils.ts                   # cn(), formatDate(), truncate()
├── models/                        # 10 Mongoose models (incl. Certificate)
├── types/                         # TypeScript interfaces & auth type augmentation
├── public/certificates/PDF/       # Certificate template (placeholder fields erased at runtime)
├── scripts/                       # seed.ts, seed-graduations.ts, assign-graduate.ts
├── nginx/nginx.conf               # Reverse proxy front door (→ app:3000)
├── Dockerfile                     # 3-stage build → standalone server
├── docker-compose.yml             # nginx + app + MongoDB 7 + RustFS + mongo-express
├── .dockerignore
├── .env.docker                    # Compose env template (copy to `.env`)
└── proxy.ts                       # Auth middleware
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

## Authentication

- **Credentials**: Email + password with bcrypt hashing
- **OAuth**: Google and GitHub (optional)
- **Session strategy**: JWT (1-hour max age)
- **Middleware**: Protects all authenticated routes, redirects to `/login`