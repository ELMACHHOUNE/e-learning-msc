Master Developer Prompt: Full-Stack Next.js E-Learning Platform (e-learning-msc)

1. Project Overview & Context
   You are building a premium, modern, full-stack B2B/B2C E-Learning management system named e-learning-msc using Next.js 14+ (App Router). The application handles multi-tenant-like role spaces for three primary roles: Admin, Instructor, and Student.

The design architecture must strictly adhere to the premium design system guidelines specified in the root Design.md file (inspired by the clean, high-end corporate identity found in https://getdesign.md/renault/design-md).

Core Tech Stack:
Framework: Next.js (App Router, Server Actions, API Routes where necessary).

Styling: Tailwind CSS, Shadcn UI / Radix UI primitives, Aceternity UI, and Magic UI for high-fidelity animations and premium micro-interactions.

Icons: lucide-react.

Database / ORM: MongoDB with Mongoose (or Prisma configured for MongoDB).

Authentication: NextAuth.js / Auth.js supporting Email/Password credentials and OAuth (Google/GitHub), implementing role-based routing guards.

Tables: @tanstack/react-table for highly performant, filterable, and paginated data grids.

2. Architecture & Database Schema
   Generate the database schemas (MongoDB/Mongoose models) ensuring strict TypeScript typing across these core entities:

User: id, name, email, password (hashed), avatar, role ('admin' | 'instructor' | 'student'), createdAt.

Course: id, title, description, durationInMonths (Number), totalSessions (Number), content (Array of Modules containing Chapters, Lessons, and MDX/Rich Text content).

Guild / Group: id, name (e.g., "Achilles Vengeance"), courseId (Ref to Course), instructorId (Ref to User), studentIds (Array of Refs to User), currentSession (Number), skillsTotal (Number), skillsAchieved (Number).

Attendance / Session Log: id, guildId, sessionNumber, date, records (Array of { studentId, status: 'present' | 'absent' | 'late' }).

3. Global Navigation, Layout & Common Components
   Global Navigation Bar (Top Navbar)
   Left Section: App Branding (e-learning-msc) + Navigation Links:

Dashboard (/dashboard)

Teach (Dropdown Menu): Attendance, One-to-One, Earnings, Online Sessions.

My Students (/students)

LabPhase (Dropdown Menu): Lab Phase List, Student Projects.

My Courses (/courses)

Right Section: Dark mode toggle widget + User Profile Avatar Component.

Profile Dropdown Menu: Clicking the avatar opens a Shadcn drop-menu displaying user summary metadata, an "Account Settings" button, a "Switch Hackespace" selection tier, and a "Logout" option featuring a clean LogOut icon.

Global Intercom-Style Chat Support Button
Fixed at the bottom right corner across all authenticated routes.

Triggers an expanding premium slide-over or micro-modal component for live customer support, mimicking the GOMYCODE assistant layout.

4. UI Page Specifications & Feature Breakdown
   A. Authentication Pages (/login, /forgot-password)
   Visuals: Premium minimalist split screen. Left side features an organic Magic UI/Aceternity grid animation or abstract geometric shape highlighting the platform's focus; right side contains the clean login block.

Inputs: Credentials block with field validation for Email and Password. Include a "Forgot Password?" hyperlink.

OAuth Integration: A clean horizontal divider leading to Google and GitHub authentication buttons using Radix primitives.

B. Main Dashboard (/dashboard)
Replicate the exact modular structure from the provided reference dashboard image:

Metric Grid Area:

Card 1 (Personal Performance Tracker): Left side displays standard percentage scores (e.g., Detractors, Passive, Promoters); right side features a high-end circular progress/radial rating badge displaying a composite score (e.g., 88/100).

Card 2: Graduated Students Count.

Card 3: Active Total Students Count.

Card 4: Total Managed Guilds.

Card 5: Average Presence/Attendance Percentage Rate.

Active Programs / Cohorts Section:

A full-width structured container displaying active courses (e.g., "15-Month Software Engineering program"). Shows key stats: active guilds, total students trained, and a "Preview Course" or "Track Details" link.

Live Cohort Tracker Card (e.g., "Achilles Vengeance"):

Displays current progress bar ("Session 54/194"), total skills tracking metrics ("5583 of 9210 Skills"), progress completion badge percentage, and stacked profile avatar indicators for enrolled members.

Sidebar Quick Elements (Right Column):

Session Scheduler Widget: Highlighting current/upcoming active sessions with a prominent, styled "Join Session" primary button action.

Tasks Board Widget: Zero-state placeholder tracker or checklist interface.

My Students High-Performance List: A vertical stack listing student names, avatar thumbnails, current programs, and dynamic color-coded percentage status indicators (e.g., Green = 100%, Orange/Blue = Mid-tier, Red = Critical Risk).

C. Dropdown Routes & Specialty Pages
Teach Menu Pages:

/teach/attendance: Interface leveraging TanStack Table to log student attendance records per session dynamically.

/teach/one-to-one: Session booking calendar UI for individual student-instructor syncs.

/teach/earnings & /teach/online-sessions: Financial trackers and virtual room entry links.

LabPhase Menu Pages:

/labphase/lab-phase-list & /labphase/student-projects: Project submission boards and milestone tracking views.

D. Deep-Dive Course Experience View (/courses/[courseId])
Replicate the comprehensive multi-layered documentation and learning workspace layout from the course reference image:

Main Navigation Sidebar (Far Left): Thin iconic app drawer displaying: Overview, Course, Saved, Resources, One to One, Checkpoint, Workshop, Report Content.

Sub-Navigation Sidebar (Secondary Left Panel): Collapsible panel containing a top dynamic search input bar (Search SuperSkill name...). Below, a fully hierarchical, interactive Accordion/Tree system displaying Course Modules (e.g., Introduction to Problem Solving, Practical Software Engineering, Front End UI UX Development). Modules expand to expose specific lesson nodes, checkpoint logs, and icon badges.

Central Content Stage Canvas:

Top Tab Navigation Bar toggling between Courses, Assessment, and These Resources Can Help You.

Clean Rich-Text/MDX workspace displaying structural headers, typography blocks, bold highlight spans, inline links, and high-fidelity callout elements.

Bottom Navigation Controls: A clean, sticky footer boundary containing clear Previous and Next navigation action buttons.

E. Admin Portal & User Management /admin (Crucial Backend Mechanics)
User Management Control Room: Built entirely using @tanstack/react-table with multi-tier sorting, global search queries, and filter badges. Allows full CRUD capabilities for creating and managing Student and Instructor accounts.

Course Creator Engine: Multi-step wizard panel to design new training paths, establish explicit durations in months, dictate the exact required session volume, and compose nested module schemas.

Guild Assignment Console: A drag-and-drop workspace where admins can bundle batches of student nodes into defined Guild groupings, map them cleanly onto an established target Course framework, and designate a primary Instructor handler.

5. Coding Instructions & Code Quality Directives
   Directory Layout: Follow standard Next.js clean App Router architectures (/app, /components/ui for primitives, /components/shared for compound business components, /models for database layer).

Styling Rules: Ensure component token patterns cleanly synchronize with the aesthetic patterns dictated in Design.md. Use premium animations (framer-motion) responsibly for transitions, drop menus, and interactive triggers.

TypeScript Execution: Zero use of any. Explicitly type all React functional components (React.FC or standard typed arguments), Server Action payloads, and API returns.

Hydration & State Protection: Secure structural checkpoints ensuring layout uniformity between server render sequences and client-side component execution hydration points.

Generate the initial structural setup, core components, and state management files based on these comprehensive instructions.
