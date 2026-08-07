<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# E-Learning MSC

Full-featured e-learning platform: Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, MongoDB (Mongoose 9), NextAuth v5 (JWT). Three-role architecture (Admin, Instructor, Student) with courses, guilds/cohorts, lab phases, project submission & validation, attendance, automated graduation & certificate PDF generation, and real-time support chat.

## Critical Structural Facts

- **There is NO `src/` directory.** Source folders live at the project root: `app/`, `components/`, `lib/`, `models/`, `types/`, `hooks/`, `scripts/`, `public/`.
- Path alias `@/*` maps to the repo root (`"@/*": ["./*"]` in `tsconfig.json`). Import as `@/lib/auth`, `@/models/User`, etc.
- `tsconfig.json` **excludes `public/certificate`** — do not put imports/source there; the live certificate template is `public/certificates/PDF/certificate.pdf`.

## Commands

```bash
npm run dev            # Turbopack dev server → http://localhost:3000
npm run build          # Production build
npm run lint           # ESLint (eslint-config-next) — run before finishing a task
npm run seed           # Reset demo data (uses scripts/seed.ts, additive)
npm run seed:grad      # Add demo graduation/certificate data
npm run assign:grad    # assign:grad <email> — graduate a single student by email
```

Seed/assign scripts run via `tsx --env-file=.env.local` — a `.env.local` with `MONGODB_URI` is required.

## Environment

Copy the stack from the right side of `.env.example` to `.env.local`. `.env.local` is used for dev and is gitignored (do not commit secrets). Required: `MONGODB_URI`, `AUTH_SECRET`, `AUTH_URL`. OAuth (`AUTH_GOOGLE_ID/SECRET`, `AUTH_GITHUB_ID/SECRET`) is optional — providers are only mounted when both id+secret are set.

## Docker

The project is containerized. `next.config.ts` sets `output: 'standalone'`; the `Dockerfile` is a 3-stage build (deps → builder → runner) on Node 22 alpine, running the minimal standalone `server.js` as a non-root user. MongoDB 7 is the companion service.

```bash
cp .env.docker .env      # template → docker compose reads `.env`
docker compose up --build # app on ${APP_PORT:-3000}, mongo on 27017
docker compose down       # stop (data persists in the mongodb_data volume)
```

- Compose `environment:` passes `AUTH_SECRET`/`AUTH_URL` to the container and hard-fails (`${VAR:?}`) if unset — always set them in `.env` before `up`. OAuth vars fall back to empty.
- `MONGODB_URI` inside compose points at the `mongo` service (`mongodb://mongo:27017/e-learning-msc`), overriding the localhost value in `.env.example`.
- `app` waits for `mongo` via a healthcheck (`depends_on.condition: service_healthy`).
- `.dockerignore` excludes `node_modules`, `.next`, secrets (`.env*` except templates), and the git metadata. The live certificate template `public/certificates/PDF/certificate.pdf` IS copied into the image.

## Tech Stack

- **Next.js 16** App Router, Turbopack, React 19, TypeScript (strict)
- **Tailwind CSS v4** via `@tailwindcss/postcss` (theme tokens in `app/globals.css`) + **Framer Motion**
- **MongoDB** via **Mongoose 9** (connection cached in `lib/db.ts`)
- **NextAuth.js v5 beta** — Credentials (bcrypt) + Google/GitHub OAuth, JWT sessions (1h)
- **pdf-lib** for certificate PDF generation; **Recharts** for dashboard charts; **lucide-react** icons; custom UI primitives in `components/ui/`
- `zod` v4 + `react-hook-form` + `@hookform/resolvers` + `@tanstack/react-table` for forms/tables
- **Custom UI primitives** — Button, Badge, Card, Avatar, Input, Alert, ConfirmDialog, etc. in `components/ui/`. Prefer these over a UI library.

## Codebase Map

| Path | Purpose |
|---|---|
| `app/(auth)/` | Login, forgot-password (public) |
| `app/(main)/` | All authenticated pages: `admin/`, `courses/`, `dashboard/`, `graduations/`, `instructors/`, `labphase/`, `profile/`, `students/`, `teach/` |
| `app/(main)/layout.tsx` | Authenticated shell (navbar, sidebar, chat widget) |
| `app/public/` → actually `app/programs/` | Public program catalog + detail pages |
| `app/api/` | Route handlers: `admin/`, `auth/[...nextauth]` (NextAuth handlers), `certificates/`, `courses/`, `dashboard/`, `instructors/`, `projects/`, `students/`, `support/`, `upload/`, `user/` |
| `app/api/upload/` | File/image upload endpoint |
| `app/robots.ts`, `app/sitemap.ts` | SEO metadata |
| `app/loader/` | Loading route group |
| `components/admin/` | `course-editor.tsx` and admin tooling |
| `components/certificate/` | CertificateDialog + student certificate cards |
| `components/dashboard/` | Recharts analytics components |
| `components/shared/` | `navbar.tsx`, `sidebar-navigation.tsx`, `chat-support.tsx`, `session-provider.tsx`, `logo-spinner.tsx`, public `index.ts` barrel |
| `components/ui/` | Reusable primitives |
| `lib/auth.ts` | NextAuth config + `getCurrentUser()`, `requireRole(...)` |
| `lib/db.ts` | Cached global Mongoose connection (`connectToDatabase`) |
| `lib/graduation.ts` | `ensureGraduation()` graduation logic + `ACADEMY_NAME` |
| `lib/certificate.ts` | Client helper for generating/downloading certificate PDFs |
| `lib/utils.ts` | `cn()`, `formatDate()`, `truncate()`, `safeUrl()`, `safeMailto()`, `safePhoneUrl()` |
| `models/` | 10 Mongoose models (incl. CourseContent, Certificate) |
| `types/` | TS interfaces (`index.ts`), `certificate.ts`, NextAuth augmentation `next-auth.d.ts` |
| `hooks/` | `use-outside-click.tsx` |
| `proxy.ts` | Auth middleware (`export default auth(...)`) |
| `public/certificates/PDF/` | Branded certificate template |
| `scripts/` | `seed.ts`, `seed-graduations.ts`, `assign-graduate.ts` |

## Data Models (Mongoose)

All in `models/` with the pattern `mongoose.models.X ?? mongoose.model('X', schema)` (guards against model re-compilation in dev hot-reload).

- **User** — `name`, `email`, `phone`, `password` (hashed), `avatar`, `role: admin|instructor|student`
- **Course** — `title`, `description`, `coverImage`, `price`, `active`, `durationInMonths`, `totalSessions`, `category`, `content` (modules → chapters → lessons/checkpoints/workshops)
- **CourseContent** — nested curriculum schema
- **Guild** — cohort: `name`, `courseId`, `instructorId`, `studentIds[]`, `currentSession`, `skillsTotal`, `skillsAchieved`
- **LabPhase** — `title`, `description`, `instructions`, `duration`, `image`, `category`, `status: pending|approved|rejected`, `createdBy`, `rejectionReason`
- **ProjectApplication** — links student → lab phase; 3-step pipeline `presentation`/`gitRepo`/`deployment` (each a `url + score + validated`), `finalGrade` auto-calculated; `status`
- **SessionLog** — per-session attendance: `guildId`, `sessionNumber`, `date`, `records[]` (studentId + status)
- **Certificate** — graduation record with unique sequential `certificateId` (`CERT-YYYY-####`)
- **Category** — unique `name` (shared by courses + lab phases)
- **Message** — support chat: `name`, `email`, `message`, `isAdmin`, `read`, timestamps

## Key Conventions & Patterns

- **Code style**: 2-space indent, **no semicolons**, single quotes. Align existing style; do not add comments unless asked.
- **Auth guard in API routes**: call `await requireRole('admin' | 'instructor' | 'student')` (from `@/lib/auth`) first; it throws `Error('Unauthorized')`/`Error('Forbidden')` on failure. For server components/pages use `getCurrentUser()`.
- **Mongo** must be connected explicitly where used — call `await connectToDatabase()` from `@/lib/db` (it is **not** called automatically).
- **Route handlers** (context `app/api/.../route.ts`) return `NextResponse.json(...)`; use `new URL(req.url).searchParams` for query params.
- **Middleware/protection** is `proxy.ts` (`export default auth(...)` with a `matcher`). This is the Next 16 middleware file.
- **Mongoose models** reference `types/` interfaces; split Domain/Application schema if needed. Always `select('-password')` when leaking user data; never return `_id` raw strings — `.toString()`.
- **Large uploads**: `next.config.ts` sets `experimental.proxyClientMaxBodySize` (50MB) for the upload route.
- **Style utilities** come from `@/lib/utils` (`cn`, `formatDate`, `truncate`, `safeUrl`, etc.) — reuse rather than reimplement.

## Verification

Before finishing a task run `npm run lint`. For type changes also ensure `npx tsc --noEmit` stays clean. Changes touching the DB, auth, or certificates should be exercised against a local MongoDB with `npm run seed` first.