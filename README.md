<div align="center">
  <img src="./public/images/icon.png" alt="E-Learning MSC Logo" width="80" height="80" />
</div>

# E-Learning MSC

A full-featured e-learning platform built with Next.js, MongoDB, and Tailwind CSS. Three-role architecture (Admin, Instructor, Student) with course management, guild/cohort system, lab phases, project submission & validation, attendance tracking, and real-time support chat.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Framer Motion |
| Database | MongoDB via Mongoose 9 |
| Auth | NextAuth.js v5 (beta) — Credentials + Google/GitHub OAuth |
| Charts | Recharts |
| Icons | Lucide React |
| UI Primitives | Custom components (Button, Badge, Card, Avatar, Progress, etc.) |

## Architecture

### Roles

- **Admin** — Full access to users, courses, guilds, categories, lab phases, support messages
- **Instructor** — Manages assigned guilds, logs attendance, creates lab phases, validates project submissions
- **Student** — Enrolled in guilds, views courses, submits lab phase projects, tracks progress

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
```

### Install & Run

```bash
npm install
npm run seed        # Populate DB with demo data
npm run dev         # http://localhost:3000
```

Login credentials after seeding: check `scripts/seed.ts` for default admin/instructor/student accounts.

## Project Structure

```
src/
├── app/
│   ├── (auth)/                    # Login, forgot-password
│   ├── (main)/
│   │   ├── admin/                 # Admin portal, course editor
│   │   ├── courses/               # Course listing & detail viewer
│   │   ├── dashboard/             # Role-based analytics dashboard
│   │   ├── labphase/              # Lab phase CRUD & project submissions
│   │   ├── profile/               # Account settings
│   │   ├── students/              # Student directory
│   │   ├── instructors/           # Instructor directory (admin)
│   │   └── teach/                 # Attendance, earnings, sessions, one-to-one
│   ├── api/                       # 22 REST endpoints
│   ├── programs/                  # Public course catalog
│   └── globals.css                # Tailwind v4 theme tokens
├── components/
│   ├── admin/course-editor.tsx    # Full course content builder
│   ├── dashboard/admin-charts.tsx # Recharts analytics components
│   ├── shared/                    # Navbar, sidebar, chat support, session provider, spinner
│   └── ui/                        # Button, Badge, Card, Avatar, Input, Alert, ConfirmDialog, etc.
├── lib/
│   ├── auth.ts                    # NextAuth config, getCurrentUser(), requireRole()
│   ├── db.ts                      # Cached MongoDB connection
│   └── utils.ts                   # cn(), formatDate(), truncate()
├── models/                        # 8 Mongoose models
├── types/                         # TypeScript interfaces & auth type augmentation
├── scripts/seed.ts                # Database seeder
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

### Attendance Tracking
- Per-session attendance with present/absent/late statuses
- Historical session log storage

### Role-Based Dashboards
- **Admin**: User distribution pie chart, courses by category bar chart, course active/inactive status donut, guilds by course horizontal bar chart, stat cards
- **Instructor**: Guild list with session/skill progress bars
- **Student**: Enrolled guilds with progress tracking

### Support Chat
- Fixed bottom-right intercom-style widget
- Conversations grouped by email
- Admin reply with read/unread tracking

### Public Pages
- Program listing with course cards (cover, title, description, duration, sessions, modules, price)
- Course detail with full curriculum tree, hero section, instructor info, WhatsApp enrollment link
- SEO-optimized with sitemap and robots.txt

## Seed Script

The seed script (`scripts/seed.ts`) populates the database with:
- 1 admin, 3 instructors, 30 students
- 3 categories, 3 courses with full module/chapter/lesson content
- 5 guilds with assigned students and instructors
- Session logs and 4 lab phases

Run with:

```bash
npm run seed
```

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
npm run seed     # Seed database with demo data
```

## Authentication

- **Credentials**: Email + password with bcrypt hashing
- **OAuth**: Google and GitHub (optional)
- **Session strategy**: JWT (1-hour max age)
- **Middleware**: Protects all authenticated routes, redirects to `/login`
