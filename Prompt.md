# e-learning-msc — Full-Stack Next.js E-Learning Platform

## 1. Project Overview

A premium three-role (admin, instructor, student) learning management system built with **Next.js 16 (App Router)**. The platform handles cohort-based education with modules, guilds, attendance tracking, lab phase project workflows, and role-aware dashboards.

### Core Tech Stack

| Layer          | Technology                                     |
| -------------- | ---------------------------------------------- |
| Framework      | Next.js 16 (App Router, API Routes, Middleware) |
| Styling        | Tailwind CSS v4 (`@import "tailwindcss"`)       |
| UI Components  | Custom-built primitives in `components/ui/`     |
| Icons          | lucide-react                                   |
| Database / ORM | MongoDB with Mongoose                          |
| Authentication | NextAuth v5 (Credentials + Google + GitHub)    |
| Forms          | react-hook-form + @hookform/resolvers + zod    |
| Tables         | @tanstack/react-table                          |
| Charts         | recharts                                       |
| Animation      | framer-motion                                  |
| Themes         | next-themes (dark/light)                       |
| Font           | Inter Tight (next/font)                        |

### Design System

The visual identity is defined in `Design.md` and implemented via Tailwind v4 `@theme` tokens in `globals.css`. Key characteristics:

- **High-contrast, academic tone**: white canvas (`canvas`) for content, black canvas (`surface-dark`) for storytelling bands.
- **Single accent colour**: Sunlight Yellow (`primary` #ffed00) reserved for CTAs, badges, avatar initials, progress bars.
- **Typography**: Inter Tight exclusively — display weights at 700 (`line-height: 0.95`), body at 400.
- **Geometry**: Square corners (`radius-none`) on cards, `radius-xs` (2px) on buttons, `radius-pill` only on badges.
- **Dark mode**: Every colour token overridden via `.dark` class CSS custom properties.

## 2. Architecture

### Route Groups

```
app/
├── layout.tsx              # Root: Inter Tight font, ThemeProvider, SessionProvider, AlertContainer, ConfirmDialog
├── globals.css             # Tailwind v4 + design tokens + dark mode overrides
├── page.tsx                # Landing page (server component)
├── loading.tsx             # Root loading state
├── not-found.tsx           # 404 page
├── sitemap.ts / robots.ts  # SEO
│
├── loader/page.tsx         # Splash/loader screen
├── programs/page.tsx       # Public program listing
├── programs/[courseId]/page.tsx  # Public program detail
│
├── (auth)/                 # Minimal layout (no navbar/chat)
│   ├── layout.tsx
│   ├── login/page.tsx
│   └── forgot-password/page.tsx
│
├── (main)/                 # Authenticated layout (Navbar + ChatSupport)
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── profile/page.tsx
│   ├── courses/page.tsx
│   ├── courses/[courseId]/page.tsx
│   ├── admin/page.tsx
│   ├── admin/courses/new/page.tsx
│   ├── admin/courses/[id]/page.tsx
│   ├── students/page.tsx
│   ├── instructors/page.tsx
│   ├── teach/attendance/page.tsx
│   ├── teach/one-to-one/page.tsx
│   ├── teach/earnings/page.tsx
│   ├── teach/online-sessions/page.tsx
│   ├── labphase/lab-phase-list/page.tsx
│   └── labphase/student-projects/page.tsx
│
└── api/                    # API routes
    ├── auth/[...nextauth]/route.ts
    ├── dashboard/route.ts
    ├── students/route.ts
    ├── instructors/route.ts
    ├── projects/route.ts
    ├── projects/[id]/route.ts
    ├── user/profile/route.ts
    ├── support/messages/route.ts
    └── admin/
        ├── dashboard/route.ts
        ├── users/route.ts
        ├── users/[id]/route.ts
        ├── courses/route.ts
        ├── courses/[id]/route.ts
        ├── guilds/route.ts
        ├── guilds/[id]/route.ts
        ├── categories/route.ts
        ├── categories/[id]/route.ts
        ├── labphases/route.ts
        ├── labphases/[id]/route.ts
        └── labphases/[id]/approve/route.ts
```

### Data Flow

- **Server Components** (landing, programs): Direct Mongoose queries via `connectToDatabase()`.
- **Client Components** (dashboard, admin, courses): Fetch via API routes (`fetch('/api/...')`) + React state.
- **API Routes**: Server-only, use `auth()` + `requireRole()` for authorization.
- **Middleware** (`proxy.ts`): Protects authenticated routes; redirects unauthenticated users to `/login`.

### Authentication & Authorization

- NextAuth v5 (JWT strategy, 60-min session max age).
- Providers: credentials (email/password), Google OAuth, GitHub OAuth.
- Custom JWT/session callbacks inject `id` and `role` into the token.
- `requireRole(...)` helper enforces role-based access on API routes.
- Three roles: `admin`, `instructor`, `student`.
- Navbar adapts links based on role.

## 3. Database Models (Mongoose)

All models use the singleton pattern (`mongoose.models.X ?? mongoose.model<X>('X', Schema)`).

### User
- `name`, `email` (unique, lowercase), `phone`, `password` (select: false), `avatar`, `role` (enum: admin/instructor/student)
- Indexes: `createdAt`, `role + createdAt`
- Timestamps: true

### Course
- `title`, `description`, `coverImage`, `price`, `active` (default: true), `durationInMonths`, `totalSessions`, `category`, `content` (nested array)
- Content structure: `Module[]` → each Module has `title` + `Chapter[]` → each Chapter has `title` + `Lesson[]` → each Lesson has `title`, `content` (rich HTML), `type` (lesson/checkpoint/workshop)
- Index: `createdAt`

### Category
- `name` (unique, trimmed)
- Timestamps: true

### Guild
- `name`, `courseId` (ref Course), `instructorId` (ref User), `studentIds[]` (ref User), `currentSession`, `skillsTotal`, `skillsAchieved`
- Indexes: `createdAt`, `instructorId + createdAt`, `studentIds`

### SessionLog
- `guildId` (ref Guild), `sessionNumber`, `date`, `records[]` (embedded: `studentId`, `status`: present/absent/late)
- Timestamps: true

### LabPhase
- `title`, `description`, `instructions`, `duration`, `image`, `category`, `status` (pending/approved/rejected), `createdBy` (ref User), `rejectionReason`
- Indexes: `createdAt`, `status + createdAt`, `createdBy + createdAt`

### ProjectApplication
- `studentId` (ref User), `labPhaseId` (ref LabPhase), `guildId` (ref Guild), `status` (pending/approved/in_progress/completed/rejected)
- Step validation sub-documents: `presentation` (url, score, validated), `gitRepo`, `deployment`, `finalGrade`
- Indexes: `studentId + createdAt`, `labPhaseId`

### Message
- `name`, `email`, `userId`, `message`, `isAdmin` (boolean), `read` (boolean)
- Indexes: `createdAt`, `email + createdAt`

## 4. Key Pages & Features

### Public Pages
- **Landing** (`/`): Hero, e-learning section, capabilities grid, featured courses, footer.
- **Programs** (`/programs`): Full-bleed video hero, program cards.
- **Program Detail** (`/programs/[courseId]`): Curriculum outline.
- **Login** (`/login`): Credentials form + OAuth providers. Minimal auth layout.
- **Forgot Password** (`/forgot-password`): Password reset request form.

### Authenticated Pages (all under `(main)` layout)

#### Dashboard (`/dashboard`)
Role-based rendering:
- **Admin**: User distribution chart (PieChart), courses by category (BarChart), course status, guilds per course.
- **Instructor**: Guild progress cards, attendance overview, student count.
- **Student**: Enrolled courses, guild progress, session tracking.

#### Admin Portal (`/admin`)
Five-tab interface: Users, Courses, Guilds, Messages, Categories.
- **Users tab**: Full CRUD table for all users.
- **Courses tab**: Course listing with create/edit links.
- **Guilds tab**: Guild CRUD with course/instructor assignment.
- **Messages tab**: Support conversations grouped by email.
- **Categories tab**: Category management.

#### Course Management
- **My Courses** (`/courses`): Enrolled courses listing.
- **Course Detail** (`/courses/[courseId]`): Sidebar navigation (modules → chapters → lessons) + content tabs.
- **Course Editor** (`/admin/courses/new`, `/admin/courses/[id]`): Hierarchical content builder with RichTextEditor.
- **Public Program Listing** (`/programs`): All courses with video hero.
- **Public Program Detail** (`/programs/[courseId]`): Course curriculum overview.

#### Teach Section
- **Attendance** (`/teach/attendance`): Session attendance grid per guild.
- **One-to-One** (`/teach/one-to-one`): Session booking interface.
- **Earnings** (`/teach/earnings`): Earnings analytics with bar chart.
- **Online Sessions** (`/teach/online-sessions`): Session listing.

#### Lab Phase Section
- **Lab Phase List** (`/labphase/lab-phase-list`): CRUD + approval workflow for lab phases.
- **Student Projects** (`/labphase/student-projects`): Project applications with step validation (presentation → git repo → deployment → final grade).

#### Support
- **Chat Widget**: Fixed bottom-right, message history, unread badge.
- **Admin Messages Tab**: Conversation management in admin portal.

#### Profile (`/profile`)
Account settings: name, phone, avatar, password change.

## 5. UI Component Library

All custom-built — no external UI libraries.

| Component     | Location                  | Variants / Features                                             |
| ------------- | ------------------------- | --------------------------------------------------------------- |
| Button        | `components/ui/button.tsx` | primary, secondary-dark, outline-dark, outline-light, pill, icon-square; sizes: default/sm/lg |
| Input         | `components/ui/input.tsx` | Label, error state, bottom-border style                          |
| Badge         | `components/ui/badge.tsx` | new, default, success, warning, error, info                     |
| Card          | `components/ui/card.tsx`  | light, dark, yellow; CardHeader + CardContent sub-components     |
| Avatar        | `components/ui/avatar.tsx` | Image or initials fallback; sizes: sm/md/lg                     |
| Progress      | `components/ui/progress.tsx` | Animated bar with optional label                                 |
| Alert (Toast) | `components/ui/alert.tsx` | Portal-based `toast()`; success/error/warning/info; auto-dismiss |
| ConfirmDialog | `components/ui/confirm-dialog.tsx` | Portal-based `confirm()`; danger/default variants         |
| ImageUpload   | `components/ui/image-upload.tsx` | Drag-and-drop + file picker + URL paste; configurable aspect ratio |
| RichTextEditor| `components/ui/rich-text-editor.tsx` | contentEditable WYSIWYG; bold/italic/underline, alignment, lists, images, videos |
| Navbar        | `components/shared/navbar.tsx` | Role-aware links, theme toggle, avatar dropdown, mobile hamburger |
| ChatSupport   | `components/shared/chat-support.tsx` | Floating widget, message history, unread badge          |
| SidebarNavigation | `components/shared/sidebar-navigation.tsx` | Course content tree (modules → chapters → lessons) |
| SessionProvider| `components/shared/session-provider.tsx` | NextAuth SessionProvider wrapper                      |
| LogoSpinner   | `components/shared/logo-spinner.tsx` | Animated loading indicator                               |

## 6. Design Conventions

- All components use `'use client'` (except landing, programs, and loader pages which are server components with some client sub-components).
- Class composition via `cn()` utility (`clsx` + `tailwind-merge`) from `@/lib/utils`.
- Icons from `lucide-react`, animations from `framer-motion`.
- Portal-based modals (`Alert`, `ConfirmDialog`) via `createPortal` into `document.body`.
- Barrel exports in `components/ui/index.ts` and `components/shared/index.ts`.
- Path alias `@/*` maps to project root.
- All interactive elements use `cursor-pointer` explicitly.
- Dark mode via `next-themes` with CSS custom property overrides.

## 7. Coding Directives

- **TypeScript**: Strict typing throughout. No `any`. All props interfaces exported.
- **No external UI libraries**: No Shadcn, Radix, Aceternity, or Magic UI. Build everything from the custom primitives.
- **Design tokens**: Use Tailwind utility classes from the `@theme` block in `globals.css` (e.g. `bg-primary`, `text-body`, `rounded-xs`, `p-xxl`).
- **API routes**: Always use `auth()` + `requireRole()` for protected endpoints.
- **Server data fetching**: Use `connectToDatabase()` singleton for Mongoose connections.
- **Client data fetching**: Use standard `fetch('/api/...')` with error handling.
- **New pages** requiring auth: Add path to middleware matcher in `proxy.ts`.
