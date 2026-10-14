# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                             │
│  (Student / Instructor / Admin)                          │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/HTTPS
                       ▼
┌──────────────────────────────────────────────────────────┐
│                  Nginx Reverse Proxy                      │
│  (Port 80 → HTTPS redirect, Port 443 → TLS termination) │
└──────────────────────┬──────────────────────────────────┘
                       │ proxy_pass
                       ▼
┌──────────────────────────────────────────────────────────┐
│               Next.js 16 Application                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  App Router   │  │  API Routes   │  │  Middleware     │ │
│  │  (SSR/SSG)   │  │  /api/*       │  │  (NextAuth)    │ │
│  └──────┬──────┘  └──────┬───────┘  └────────────────┘ │
│         │                │                                │
│  ┌──────▼────────────────▼──────────────────────────┐   │
│  │              Service Layer                         │   │
│  └──────┬──────────────────┬───────────────────────┘   │
└─────────┼──────────────────┼───────────────────────────┘
          │                  │
          ▼                  ▼
   ┌────────────┐    ┌────────────┐
   │  MongoDB   │    │   RustFS   │
   │  (27017)   │    │ (S3, 9000) │
   └────────────┘    └────────────┘
```

## Data Flow — Course Content

```
Admin creates course via CourseEditor
    │
    ├─ Modules, Chapters, Lessons stored in Course.content (nested)
    │
    ├─ Rich text content stored as HTML string
    │
    └─ Cover images uploaded to RustFS via /api/upload
        └─ Stored at /uploads/<folder>/<name>
        └─ Served back via app/uploads/[...path]/route.ts

Student views course
    │
    ├─ Course detail page fetches full curriculum tree
    │
    ├─ Lesson content loaded into AI context (truncated to 6000 chars)
    │
    └─ AI Assistant uses content as grounding for responses
```

## Authentication Flow

```
1. User submits email + password (or clicks OAuth)
         │
2. NextAuth.js v5 handles:
   ├─ Credentials provider: bcrypt password comparison
   ├─ Google/Gitini OAuth (optional)
   └─ JWT token creation (1-hour expiry)
         │
3. JWT stored in httpOnly cookie
         │
4. proxy.ts middleware checks every request:
   ├─ Public routes: /login, /programs, /api/auth/*
   └─ Protected routes: redirect to /login if no session
         │
5. API routes call requireRole() for RBAC:
   ├─ 'admin' → full access
   ├─ 'instructor' → guild management, quiz/project review
   └─ 'student' → course viewing, project submission, AI assistant
```

## Graduation & Certificate Flow

```
Student completes all guild sessions
    +
Student's lab phase project validated (all 3 steps)
    │
    ▼
ensureGraduation() called (lib/graduation.ts)
    │
    ├─ Check: student has ≥1 completed course (100% sessions)
    ├─ Check: student has ≥1 completed lab project
    │
    ├─ Create Certificate record with unique ID:
    │   CERT-YYYY-#### (sequential)
    │
    └─ Student sees "Congratulations" card on dashboard
        │
        ▼
    POST /api/certificates/generate
        │
        ├─ Load branded PDF template
        ├─ Fill placeholders with student/course/instructor data
        ├─ Erase template placeholder text
        └─ Return PDF for download
```

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16 | App Router, SSR, API routes in one stack |
| Database | MongoDB + Mongoose | Flexible schema for nested curriculum |
| Auth | NextAuth v5 | JWT sessions, OAuth, role-based |
| Validation | Zod | Type-safe schemas for request input |
| Storage | RustFS (S3) | Self-hosted, compatible with AWS SDK |
| PDF | pdf-lib | Template-based certificate generation |
| UI | Tailwind CSS + Framer Motion | Utility-first + animations |
| Container | Docker Compose | Reproducible multi-service setup |
