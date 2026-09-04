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
│  │  lib/auth.ts  lib/db.ts  lib/ai/*  lib/rustfs.ts │   │
│  └──────┬──────────┬──────────┬──────────┬──────────┘   │
└─────────┼──────────┼──────────┼──────────┼──────────────┘
          │          │          │          │
          ▼          ▼          ▼          ▼
   ┌──────────┐ ┌────────┐ ┌────────┐ ┌────────┐
   │ MongoDB  │ │ Ollama │ │ RustFS │ │  SSL   │
   │  (27017) │ │(11434) │ │ (9000) │ │ Let's  │
   │          │ │        │ │   S3   │ │Encrypt │
   └──────────┘ └────────┘ └────────┘ └────────┘
```

## Request Flow — AI Learning Assistant

This is the most important AI flow in the system:

```
1. Student types question in LearningAssistant component
         │
2. POST /api/ai/assistant { message, courseId }
         │
3. requireRole('student', 'instructor', 'admin')
   └─ Verifies JWT session via NextAuth
         │
4. Zod validates request body (AssistantRequestSchema)
         │
5. Database lookup:
   ├─ Verify course exists
   └─ Verify student is enrolled (or is instructor/admin)
         │
6. Fetch course content from MongoDB:
   ├─ Course title + description
   └─ Current lesson content (if provided)
         │
7. Build prompt (lib/ai/prompts.ts):
   ├─ System prompt: role, rules, output format
   ├─ Context: course content wrapped in <context> tags
   └─ User question wrapped in <student_question> tags
         │
8. Escape user input: < → [LT], > → [GT], & → [AMP]
         │
9. Call Ollama (lib/ai/client.ts):
   ├─ POST http://ollama:11434/api/generate
   ├─ model: phi4-mini
   ├─ format: "json" (enforces JSON output)
   └─ stream: false
         │
10. Parse JSON response
         │
11. Validate with Zod (AssistantResponseSchema):
    ├─ answer: string (1-4000 chars)
    ├─ confidence: "high" | "medium" | "low"
    ├─ relevantTopics: string[] (max 5)
    └─ suggestedFollowUp: string[] (max 5)
         │
12. Return validated response to client
         │
13. UI renders answer with AI badge, confidence indicator,
    and clickable follow-up questions
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
| AI | Ollama (local) | No API costs, data privacy, Docker integration |
| Model | phi4-mini | 3.8B params, runs on CPU, good JSON output |
| Storage | RustFS (S3) | Self-hosted, compatible with AWS SDK |
| Validation | Zod | Type-safe schemas for input and AI output |
| PDF | pdf-lib | Template-based certificate generation |
| UI | Tailwind CSS + Framer Motion | Utility-first + animations |
| Container | Docker Compose | Reproducible multi-service setup |
```

Return the confirmation message "File created successfully" when done.