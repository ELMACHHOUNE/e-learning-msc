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
npm run seed           # Reset demo data (scripts/seed.ts) — now ALSO creates 6 graduates
npm run seed:grad      # Extra additive graduation data (legacy — main seed covers this)
npm run assign:grad    # assign:grad <email> — graduate a single student by email
```

Seed/assign scripts run via `tsx --env-file=.env.local` — a `.env.local` with `MONGODB_URI` is required.

**Note for Docker:** `.env.local` points at MongoDB Atlas, NOT the compose `mongo` service. To seed the container DB, run the script directly against `localhost:27017` with `SEED_PASSWORD` set (the container maps 27017→27017):

```powershell
$env:MONGODB_URI='mongodb://localhost:27017/e-learning-msc'
$env:SEED_PASSWORD='password123'
npx tsx scripts/seed.ts
```

`seed.ts` drops the DB, then seeds 1 admin, 3 instructors, 30 students, 3 courses, 5 guilds, session logs, 4 lab phases, **and 6 graduates** (100% completion) whose certificates are registered via `ensureGraduation()` (`CERT-YYYY-####`). Graduates: `lina.benali@fake.msc`, `youssef.elamrani@fake.msc`, `sara.mansouri@fake.msc`, `omar.haddad@fake.msc`, `nora.fassi@fake.msc`, `karim.berrada@fake.msc` — password `password123`, used to test certificate PDF generation.

## Environment

Copy the stack from the right side of `.env.example` to `.env.local`. `.env.local` is used for dev and is gitignored (do not commit secrets). Required: `MONGODB_URI`, `AUTH_SECRET`, `AUTH_URL`. OAuth (`AUTH_GOOGLE_ID/SECRET`, `AUTH_GITHUB_ID/SECRET`) is optional — providers are only mounted when both id+secret are set. RustFS vars (`RUSTFS_ENDPOINT`, `RUSTFS_BUCKET`, `RUSTFS_ACCESS_KEY`, `RUSTFS_SECRET_KEY`, `RUSTFS_REGION`) fall back to the `.env.example` values (localhost:9000, bucket `e-learning-msc`, `elearningfsadmin`/`elearningfsadmin-secret`).

## Docker

The project is containerized. `next.config.ts` sets `output: 'standalone'`; the `Dockerfile` is a 3-stage build (deps → builder → runner) on Node 22 alpine, running the minimal standalone `server.js` as a non-root user. Nginx (`nginx/nginx.conf`) is the front-door reverse proxy on port 80 → `app:3000`. MongoDB 7 and RustFS (S3-compatible object storage) are the companion services.

```bash
cp .env.docker .env      # template → docker compose reads `.env`
docker compose up --build # nginx on ${HTTP_PORT:-80}, app direct on ${APP_PORT:-3000}, mongo on 27017, rustfs S3 on 9000 + console 9001, mongo-express on ${ME_PORT:-8585}
docker compose down       # stop (data persists in the mongodb_data / rustfs_data volumes)
```

- Browse the app through nginx at `http://localhost`; `AUTH_URL` must be the nginx-facing URL (`http://localhost` in `.env.docker`). The app also stays reachable on `${APP_PORT:-3000}`.
- `AUTH_TRUST_HOST=true` is set so NextAuth works behind the proxy. Next 16 has NO `experimental.trustHostHeader` (removed) — it reads `x-forwarded-*` headers natively; nginx sets `X-Forwarded-Proto`/`X-Forwarded-For`/`Host`.
- Compose `environment:` passes `AUTH_SECRET`/`AUTH_URL` to the container and hard-fails (`${VAR:?}`) if unset — always set them in `.env` before `up`. OAuth vars fall back to empty.
- `MONGODB_URI` inside compose points at the `mongo` service (`mongodb://mongo:27017/e-learning-msc`), overriding the localhost value in `.env.example`.
- `RUSTFS_*` vars configure the app (S3 client) and the `rustfs` service. **RustFS refuses its default `rustfsadmin` creds on non-loopback listeners** — the compose defaults use `elearningfsadmin` / `elearningfsadmin-secret`; override via `.env`.
- `app` waits for `mongo` via a healthcheck (`depends_on.condition: service_healthy`); it depends on `rustfs` only by `service_started` (bucket is created lazily on first upload). `app` itself has a healthcheck (node fetch on `:3000`) and `nginx` waits for it via `service_healthy`.
- `mongo-express` gives a web UI on `${ME_PORT:-8585}` (login `ME_USER`/`ME_PASSWORD`, defaults `admin`/`admin`). It uses `ME_CONFIG_BASICAUTH_*` (note: `BASICAUTH`, not `BASIC_AUTH`) and `ME_CONFIG_MONGODB_ENABLE_ADMIN=true` so all databases (incl. `e-learning-msc`) are browsable. **Default is `8585`, not `8081`** — Windows Docker Desktop reserves the 8054–8353 port band.
- `.dockerignore` excludes `node_modules`, `.next`, secrets (`.env*` except templates), and the git metadata. The live certificate template `public/certificates/PDF/certificate.pdf` IS copied into the image.

## Tech Stack

- **Next.js 16** App Router, Turbopack, React 19, TypeScript (strict)
- **Tailwind CSS v4** via `@tailwindcss/postcss` (theme tokens in `app/globals.css`) + **Framer Motion**
- **MongoDB** via **Mongoose 9** (connection cached in `lib/db.ts`)
- **NextAuth.js v5 beta** — Credentials (bcrypt) + Google/GitHub OAuth, JWT sessions (1h)
- **RustFS** (self-hosted S3 object storage) via `@aws-sdk/client-s3` — the single source for images/media
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
| `app/api/upload/` | File/image upload endpoint (stores in RustFS) |
| `app/uploads/[...path]/` | Streams stored RustFS objects back to the browser (signed S3 GET, `/uploads/<folder>/<name>` URLs) |
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
| `lib/rustfs.ts` | S3 client (RUSTFS_*), bucket init, `uploadObject()`/`getObject()` helpers |
| `lib/certificate.ts` | Client helper for generating/downloading certificate PDFs |
| `lib/utils.ts` | `cn()`, `formatDate()`, `truncate()`, `safeUrl()`, `safeMailto()`, `safePhoneUrl()` |
| `models/` | 10 Mongoose models (incl. CourseContent, Certificate) |
| `types/` | TS interfaces (`index.ts`), `certificate.ts`, NextAuth augmentation `next-auth.d.ts` |
| `hooks/` | `use-outside-click.tsx` |
| `proxy.ts` | Auth middleware (`export default auth(...)`) |
| `nginx/nginx.conf` | Reverse-proxy front door (port 80 → `app:3000`, sets `X-Forwarded-*`) |
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
- **Media storage**: all files/images go to RustFS via `lib/rustfs.ts`. Clients POST base64 to `/api/upload` which stores objects under `uploads/<folder>/<name>`; the stored URL is `/uploads/<folder>/<name>` kept relative. `app/uploads/[...path]/route.ts` streams them back with a signed S3 GET — never write media to `public/`.
- **Style utilities** come from `@/lib/utils` (`cn`, `formatDate`, `truncate`, `safeUrl`, etc.) — reuse rather than reimplement.

## Verification

Before finishing a task run `npm run lint`. For type changes also ensure `npx tsc --noEmit` stays clean. Changes touching the DB, auth, or certificates should be exercised against a local MongoDB with `npm run seed` first.