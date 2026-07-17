## Overview

e-learning-msc is a three-role (admin, instructor, student) learning management system built with Next.js 16 App Router. The visual identity is high-contrast and academic: a white canvas for content surfaces, a black canvas for header/footer storytelling bands, and a single Sunlight Yellow accent (`#ffed00`) reserved for primary actions, badges, and the avatar fallback. Square corners dominate, elevation is expressed through colour blocking rather than shadow, and the typography is monolithic — Inter Tight everywhere, with display weights at 700 and body at 400.

The page rhythm cycles between two surface modes: a **white catalogue mode** for content grids, forms, and dashboards (`canvas` with `hairline` dividers), and a **black storytelling mode** for hero sections, the footer, and program headers (`surface-dark` with `on-dark` text). Yellow accent moments (primary CTAs, "NEW" badges) punctuate the otherwise neutral palette.

**Key Characteristics:**

- Two-tone canvas system — `canvas` (white) for browsing, `surface-dark` (black) for storytelling bands — switched in full-bleed sections rather than subtle gradations.
- A single brand accent — `primary` Sunlight Yellow — used sparingly on primary CTAs, "NEW" badges, avatar initials, and progress bars.
- **Inter Tight everywhere**, with `display-xl` headlines at 56px / weight 700 / `line-height: 0.95` so condensed multi-line headlines stack cleanly.
- Square geometry: `radius-xs` (2px) on buttons, `radius-none` on cards and tiles, `radius-pill` reserved exclusively for badges and sub-nav pills.
- Role-aware navigation: the navbar adapts links based on the authenticated user's role (admin sees Admin + Instructors; non-admin sees Teach dropdown).
- Dark mode via `next-themes` with entirely overridden colour tokens — every surface, text, and border token has a dark variant.

## Colors

### Brand & Accent

- **Sunlight Yellow** (`primary` — `#ffed00`): the brand accent. Reserved for primary CTAs, "NEW" badges, avatar initials, progress bar fills, and the yellow card variant. Never decorative.
- **Sunlight Yellow Pressed** (`primary-deep` — `#e6d200`): the active/pressed state of `primary` buttons (`#cfba00` in dark mode).
- **On-Primary** (`on-primary` — `#000000`): label colour on top of `primary` surfaces. Yellow always pairs with black text — never white.

### Surface

- **Canvas** (`canvas` — `#ffffff` / dark: `#111113`): the default page background and card surface.
- **Surface Soft** (`surface-soft` — `#f7f7f7` / dark: `#1c1c1f`): subtle elevation step for toolbar backgrounds, alert headers, and hover states.
- **Surface Dark** (`surface-dark` — `#000000`): the alternate canvas for hero bands, footer, and full-bleed storytelling sections. Unchanged in dark mode.
- **Surface Deep** (`surface-deep` — `#111111` / dark: `#0a0a0c`): a one-step-up elevation inside `surface-dark` regions for inset cards.
- **Hairline** (`hairline` — `#f2f2f2` / dark: `#26262b`): the soft 1px divider between rows and borders on light surfaces.
- **Hairline Strong** (`hairline-strong` — `#000000` / dark: `#3a3a40`): full-strength dividers and card/button outlines.
- **Divider Dark** (`divider-dark` — `rgba(255,255,255,0.16)` / dark: `rgba(255,255,255,0.08)`): low-contrast divider inside `surface-dark` regions.

### Text

- **Ink** (`ink` — `#000000` / dark: `#e4e4e7`): primary text colour on light surfaces. Black is structural — it also drives icons, logos, and outline borders.
- **Body** (`body` — `#222222` / dark: `#c0c0c6`): secondary body text where pure black feels too heavy in long paragraphs.
- **Charcoal** (`charcoal` — `#333333` / dark: `#a1a1aa`): captions, metadata, and small labels.
- **Mute** (`mute` — `#666666` / dark: `#787885`): supporting text and inactive nav labels.
- **Ash** (`ash` — `#8a8a8a` / dark: `#565661`): placeholder text, disabled labels.
- **Stone** (`stone` — `#c4c4c4` / dark: `#303036`): disabled-state foreground.
- **On-Dark** (`on-dark` — `#ffffff`): primary text on `surface-dark` surfaces.
- **On-Dark Mute** (`on-dark-mute` — `rgba(255,255,255,0.72)` / dark: `rgba(255,255,255,0.6)`): secondary text in dark regions.

### Semantic

- **Error** (`error` — `#be6464` / dark: `#d4818c`): muted desaturated red for inline form errors, danger buttons, and destructive actions.
- **Warning** (`warning` — `#f0ad4e` / dark: `#d4a84b`): amber alert for confirmation dialogs.
- **Success** (`success` — `#8dc572` / dark: `#89c47a`): muted green for success states and completion indicators.
- **Info** (`info` — `#337ab7` / dark: `#6aacd9`): desaturated mid-blue for informational chips and badges.
- **Link** (`link` — `#0000ee` / dark: `#82b0f5`): fallback underline colour for inline text links — production links inherit `ink` and rely on underline/weight rather than colour.

## Typography

### Font Family

The entire system is set in **Inter Tight**, a geometric sans-serif with tall x-heights and squared apexes that pair naturally with the platform's high-contrast, academic tone. Inter Tight is loaded via `next/font/google` with `display: swap` and assigned to the `--font-sans` CSS variable.

Suitable open-source substitutes include **Manrope** or **HK Grotesk Semi Condensed** — all share the geometric character. Tighten `lineHeight` on display sizes to 0.95 to maintain the condensed look.

### Hierarchy

| Token            | Size   | Weight | Line Height | Letter Spacing | Use                                            |
| ---------------- | ------ | ------ | ----------- | -------------- | ---------------------------------------------- |
| `display-xl`     | 56px   | 700    | 0.95        | 0              | Hero headlines, landing page titles.           |
| `display-lg`     | 40px   | 700    | 0.95        | 0              | Secondary section titles, program headers.     |
| `display-md`     | 32px   | 700    | 0.95        | 0              | Page-level H1 on sub-pages and course headers. |
| `heading-lg`     | 24px   | 700    | 0.95        | 0              | Section headers, card titles.                  |
| `heading-md`     | 20px   | 700    | 0.95        | 0              | Sub-section headers, prominent labels.         |
| `heading-sm`     | 18px   | 700    | 1.0         | 0              | Tile titles, list group headers, nav logo.     |
| `subtitle`       | 19.2px | 600    | 1.3         | 0              | Lead paragraphs, hero subtitles.               |
| `body-lg`        | 18px   | 400    | 1.5         | 0              | Long-form body.                                |
| `body-md`        | 16px   | 400    | 1.4         | 0              | Default body and form fields.                  |
| `body-sm`        | 14px   | 400    | 1.57        | 0              | Captions, metadata.                            |
| `button-lg`      | 16px   | 700    | 1.0         | 0              | Large CTAs in hero bands.                      |
| `button-md`      | 14.4px | 700    | 1.0         | 0.144px        | Default button label across the system.        |
| `button-sm`      | 13px   | 600    | 1.2         | 0.13px         | Sub-nav pills, small in-card actions.          |
| `caption`        | 12px   | 400    | 1.4         | 0              | Footer disclosure, regulatory text, timestamps.|
| `overline`       | 10px   | 700    | 1.45        | 0              | Short uppercase labels above titles.           |

### Principles

- Display sizes always weight 700, always at `line-height: 0.95`. The tightness is what makes the brand feel confident rather than corporate.
- Body copy stays at weight 400 — never 500. The contrast between body and display is part of the system.
- Button labels carry a tiny positive letter-spacing (`0.144px` on `button-md`) — almost imperceptible, but adds mechanical precision on CTAs.
- No italics, no script, no decorative ligatures.

## Layout

### Spacing System

- **Base unit**: 4px, with the working scale built on multiples of 4 and 8.
- **Tokens**: `xxs` 4px · `xs` 8px · `sm` 12px · `md` 16px · `lg` 20px · `xl` 24px · `xxl` 32px · `xxxl` 40px · `section` 80px.
- Section padding (full-bleed band to next band): `section` (80px) on desktop, collapsing to `xxxl` (40px) on mobile.
- Card internal padding: `xxl` (32px) all sides.
- Navbar height: 64px (`h-16`), sticky at the top.

### Grid & Container

- **Max content width**: 1440px centred. Dark/light bands extend full-bleed beyond the container.
- **Admin tabs, course grids**: responsive columns collapsing 3→2→1 across breakpoints.
- **Sidebar layout** (course detail): fixed left sidebar (~280px) for module/chapter/lesson navigation with right content pane.

### Application Shell

The app uses Next.js route groups to compose layouts:

- **Root layout** (`app/layout.tsx`): Inter Tight font, `ThemeProvider` (next-themes), `SessionProvider`, `AlertContainer`, `ConfirmDialog`.
- **Auth group** (`app/(auth)/layout.tsx`): minimal wrapper — no navbar, no chat — for `/login` and `/forgot-password`.
- **Main group** (`app/(main)/layout.tsx`): `Navbar` + `ChatSupport` wrapping all authenticated pages.

### Whitespace Philosophy

- Whitespace is structural, not decorative. Sections are separated by colour-blocking (white → black) rather than soft padding ramps.
- Inside cards and data tables, padding is generous but never airy — the platform serves dense information, so moderate density is acceptable.
- Hairline `hairline` dividers on white surfaces create catalogue precision; on dark surfaces, `divider-dark` carries the same role.
- Card headers use a `surface-soft` background with an `hairline` bottom border to visually separate the header from content.

## Elevation & Depth

| Level                     | Treatment                                                                               | Use                                                              |
| ------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 0 — flat                  | No shadow, no border                                                                    | Default page surface, full-bleed bands.                          |
| 1 — outline               | 1px solid `hairline-strong` or `hairline`                                               | Cards, buttons, input borders, toolbar groups.                   |
| 2 — colour-blocked        | Surface colour shift (e.g. `surface-soft` toolbar on `canvas` background)               | Rich text editor toolbar, alert headers, dialog headers.         |
| 3 — dark inversion        | Card swaps to `surface-dark` against a `canvas` band                                    | Footer, hero bands, dark promo cards.                            |
| 4 — overlay (modal)       | `shadow-[0_20px_60px_rgba(0,0,0,0.2)]` + scrim `bg-black/45`                           | Toast alerts, confirmation dialogs, dropdown menus.              |

Drop shadows are rare. When they appear, they use a strong 20px blur at 20% opacity on floating elements like toasts, dialogs, and dropdowns — creating a sharp, modern overlay feel rather than a soft card shadow.

## Shapes

### Border Radius Scale

| Token          | Value | Use                                                                   |
| -------------- | ----- | --------------------------------------------------------------------- |
| `radius-none`  | 0px   | Cards, promo tiles, image containers, input fields, navbar.           |
| `radius-xs`    | 2px   | All button variants, image upload borders.                            |
| `radius-sm`    | 3px   | Rich text editor toolbar buttons.                                     |
| `radius-md`    | 4px   | Form labels, inline tags, alert container corners.                    |
| `radius-pill`  | 46px  | Badges (all variants), sub-nav pills.                                 |
| `radius-full`  | 9999px | Avatars, circular colour swatches, loading spinners.                  |

### Photography & Imagery Geometry

- Cover images and program photography are **always square-cornered** (`radius-none`). No rounded hero shots or soft-edged course cards.
- Aspect ratios cluster around **16:9** (hero bands, course covers), **1:1** (avatar thumbnails), and **2:1** (landing page promo bands).
- Avatars use `radius-full` circles to contrast with the otherwise square geometry. Initials fallback on a yellow `primary` background.

## Components

### Buttons

The button system has five variants, all sharing `radius-xs` (2px) and `text-button-md` typography. Three sizes: `default` (h-12), `sm` (h-9), `lg` (h-14).

**`button-primary`** — yellow CTA

- Background `primary`, label `on-primary`, `text-button-md`, padding `14px 24px`, `radius-xs`.
- The single most important action on a page (e.g. "Get Started", "Submit", "Save Changes").
- Hover/active: background `primary-deep`.

**`button-secondary-dark`** — solid black CTA

- Background `surface-dark`, label `on-dark`, `text-button-md`, `radius-xs`.
- Equal-weight secondary action paired with `button-primary`, or the primary action on a yellow tile background.
- Hover: opacity 90%, active: opacity 80%.

**`button-outline-dark`** — outlined CTA on light surfaces

- Background `canvas`, label `ink`, 1px solid `hairline-strong`, `text-button-md`, `radius-xs`.
- Tertiary action; appears alongside primary/secondary for "View Details", "Cancel", etc.
- Hover: background `surface-soft`.

**`button-outline-light`** — outlined CTA on dark surfaces

- Background `surface-dark`, label `on-dark`, 1px solid `on-dark`, `text-button-md`, `radius-xs`.
- The dark-canvas counterpart to `button-outline-dark`.

**`button-pill`** — sub-nav chip

- Background `canvas`, label `ink`, 1px solid `hairline-strong`, `text-button-sm`, `radius-pill`, height 36px.
- The only place the system uses a pill shape — for filter chips and tab switches.

**`button-icon-square`** — small icon button

- Background `canvas`, 1px solid `hairline-strong`, `radius-xs`, 40×40px square.
- Carousel arrows, close buttons, utility icon triggers.

### Cards & Containers

Three card variants share `radius-none` and `xxl` (32px) internal padding.

**`card-light`** — default card

- Background `canvas`, text `ink`.
- Used for: dashboard stat cards, course cards, admin data panels, form containers.
- Sub-components: `CardHeader` (with `surface-soft` background + `hairline` bottom border + `xxl` horizontal / no bottom padding), `CardContent` (`xxl` padding all sides).

**`card-dark`** — dark card

- Background `surface-dark`, text `on-dark`.
- Used for: dark promo tiles, footer content cards, storytelling panels.

**`card-yellow`** — accent card

- Background `primary`, text `on-primary`.
- Used sparingly for: one accent tile per page, featured callout sections.
- Yellow always pairs with black text — never white.

### Badges

Six variants, all using `radius-pill`, `text-button-md`, padding `3.5px 14px`.

| Variant    | Style                                    | Use                                           |
| ---------- | ---------------------------------------- | --------------------------------------------- |
| `new`      | `bg-primary text-on-primary`             | "NEW" badges, featured labels.                |
| `default`  | `bg-surface-soft text-charcoal`          | Role indicators, status labels.               |
| `success`  | `bg-success/10 text-success`             | "Completed", "Approved" statuses.             |
| `warning`  | `bg-warning/10 text-warning`             | "Pending", "In Progress" statuses.            |
| `error`    | `bg-error/10 text-error`                 | "Rejected", "Failed" statuses.                |
| `info`     | `bg-info/10 text-info`                   | Informational chips.                          |

### Avatar

- Sizes: `sm` (32px), `md` (40px), `lg` (48px).
- Always `radius-full` (circle).
- If `src` provided: image with `object-cover`. If not: initials extraction (max 2 characters) on `primary` background with `on-primary` text, weight 700.
- Used in navbar profile trigger, student/instructor lists, chat messages.

### Progress

- Track: `h-2`, `bg-surface-soft`, `radius-none`.
- Fill: `h-full`, `bg-primary`, animated `duration-300`.
- Optional label below showing `value/max (percentage%)` in `caption`/`mute`.

### Alerts (Toast)

Portal-based notification system via `toast()` function. Renders into `document.body` with `framer-motion` animations.

- Position: fixed top-right, max-width 384px, gap 8px.
- Animation: slide in from right (opacity + x + scale).
- Auto-dismiss after 4 seconds.
- Structure: header row (icon + uppercase bold title + close button) on `surface-soft` background, optional body message below.
- Icons per variant: `success` → CheckCircle (text-success), `error` → AlertCircle (text-error), `warning` → AlertCircle (text-warning), `info` → Info (text-info).
- Shadow: `shadow-[0_20px_60px_rgba(0,0,0,0.2)]` for strong overlay presence.

### ConfirmDialog

Portal-based confirmation modal via `confirm()` function. Renders into `document.body`.

- Scrim: `bg-black/45`, centred grid.
- Dialog: `canvas` background, `hairline` border, `shadow-[0_20px_60px_rgba(0,0,0,0.2)]`, max-width 28rem.
- Header: `surface-soft` background, `hairline` bottom border, uppercase title + close button.
- Body: icon container (40×40px, `hairline-strong` border, `surface-soft` background) + title + optional message.
  - Danger variant: Trash2 icon in `error` colour, confirm button `bg-error text-white`.
  - Default variant: AlertTriangle icon in `warning`, confirm button `bg-ink text-canvas`.
- Footer: `hairline` top border, cancel (outline) + confirm (solid) buttons.
- Loading state: spinner inside confirm button, disabled during async execution.
- Body scroll locked while open.

### ImageUpload

Combined drag-and-drop + file picker + URL paste for cover images.

- Aspect ratio configurable (default `aspect-[16/9]`).
- Upload zone: 2px dashed border, `border-hairline-strong` idle → `border-ink` on drag.
- Preview mode: fill container with hover overlay (Change / Remove buttons).
- URL input section with hairline "or paste URL" divider.
- Encodes files to Base64 data URIs.
- Supports both `onChange` (value string) and `onFile` (base64) callbacks.

### RichTextEditor

Full WYSIWYG editor using `contentEditable` + `document.execCommand`. Designed for course lesson content creation.

- Toolbar (on `surface-soft`): Bold, Italic, Underline; Font Size selector; Text Color picker; Alignment (left/center/right); Lists (bullet/numbered); Image insert; Video insert.
- Editor area: min-h-[300px], max-h-[600px], scrollable, `text-body-md`, `text-ink`, placeholder via `data-placeholder` attribute.
- Image insert: inline modal with file upload preview + URL paste. Inserts centered `<img>` with `max-width:100%`.
- Video insert: YouTube URL detection (auto-embeds as responsive iframe) or direct `<video>` source.
- Paste handling: strips formatting, inserts as plain text.

### Input

- Height: 48px (`h-12`). Border: single bottom hairline (`border-b border-hairline-strong`, `radius-none`).
- Focus: bottom border thickens to 2px (`focus-visible:border-b-2`) and switches to `ink`.
- Error: bottom border + caption text in `error` colour.
- Placeholder: `text-ash`.
- Optional label above in `text-body-sm text-charcoal`.
- Disabled: cursor not-allowed, opacity 50%.

### Navigation

**`navbar`** — top navigation bar

- Background `canvas`, `hairline` bottom border, height 64px (`h-16`), sticky at top (`sticky top-0 z-50`).
- Left: app icon (28×28px) + "e-learning-msc" in `heading-sm` uppercase.
- Centre: role-aware desktop nav links (hidden below `lg` breakpoint):
  - Admin sees: Dashboard, Admin, Instructors, Students, LabPhase dropdown, My Courses.
  - Non-admin sees: Dashboard, Teach dropdown, Students/My Students, LabPhase dropdown, My Courses.
  - Teach dropdown: Attendance, One-to-One, Earnings, Online Sessions.
  - LabPhase dropdown: Lab Phase List, Student Projects.
- Right: role badge, theme toggle (Sun/Moon), avatar profile dropdown (Account Settings, Logout).
- Mobile: `< `lg` breakpoint (1024px) collapses centre nav into hamburger menu; logo and right controls remain visible.
- Dropdowns: `framer-motion` slide-down animation, `canvas` background, `hairline` border, minimum 180px width.
- Outside click closes profile dropdown.

**`sidebar-navigation`** — course content sidebar

- Course content tree: modules → chapters → lessons.
- Each lesson shows its type icon (FileText for lesson, CheckCircle for checkpoint, Video for workshop).
- Search/filter capability.
- Expandable/collapsible sections with `framer-motion` layout animations.

**`chat-support`** — floating support widget

- Fixed position bottom-right.
- Unread message counter badge.
- Slide in/out animation via `framer-motion`.
- Message history with mark-as-read functionality.

### Signature Components

**`logo-spinner`** — loading indicator

- Animated spinning app logo with "Loading..." text.
- Used in the splash/loader page.

**`footer`** — landing page footer

- Background `surface-dark`, text `on-dark` and `on-dark-mute`, padding `xxl` or `section`.
- Column layout for links, copyright line at bottom with `divider-dark` separator.

## Layout Patterns

### Route Groups

```
app/
├── layout.tsx           # Root: ThemeProvider + SessionProvider + Alert + Confirm
├── (auth)/layout.tsx    # Minimal layout (no navbar)
└── (main)/layout.tsx    # Navbar + ChatSupport wrapper
```

### Page Structure

- **Landing page** (`/`): Server component. Hero section, e-learning description, capabilities grid, featured courses, footer.
- **Program listing** (`/programs`): Server component. Full-bleed video hero, program cards.
- **Program detail** (`/programs/[courseId]`): Server component. Curriculum outline, course info.
- **Login** (`/login`): Client component. Credentials form + OAuth providers (Google, GitHub). Minimal auth layout.
- **Dashboard** (`/dashboard`): Client component. Role-based: admin sees charts + management widgets; instructor sees guilds + attendance; student sees enrolled courses.
- **Admin portal** (`/admin`): Client component. Five-tab interface: Users, Courses, Guilds, Messages, Categories. Each tab has its own CRUD table.
- **Course editor** (`/admin/courses/new`, `/admin/courses/[id]`): Client component. Full hierarchical content builder with RichTextEditor.
- **Course detail** (`/courses/[courseId]`): Client component. Sidebar navigation + content tabs (modules/chapters/lessons).

### Responsive Breakpoints

| Breakpoint   | Width     | Key Changes                                                                    |
| ------------ | --------- | ------------------------------------------------------------------------------ |
| Desktop      | ≥ 1280px  | Full layout, multi-column grids, side-by-side sidebars.                        |
| Tablet       | 768–1279px | Reduced columns, sub-nav pills become horizontal scroll.                       |
| Mobile       | ≤ 767px   | Nav collapses to hamburger, all grids 1-up, section padding reduces to 40px.  |

## Data Flow

- **Server Components** (landing, programs): Direct Mongoose queries via `connectToDatabase()`.
- **Client Components** (dashboard, admin, courses): Fetch via API routes (`fetch('/api/...')`) + React state.
- **API Routes**: Server-only, use `auth()` + `requireRole()` for authorization.
- **Authentication**: NextAuth v5 (JWT strategy, 60-min max age). Custom callbacks inject `id` and `role` into token/session.
- **Middleware**: Protects authenticated routes; redirects unauthenticated users to `/login`.

## Design Tokens Reference

All tokens are defined in `app/globals.css` using Tailwind v4 `@theme` directive. Use Tailwind utility classes directly (e.g. `bg-primary`, `text-body`, `rounded-xs`, `p-xxl`). The `cn()` utility from `@/lib/utils` composes `clsx` + `tailwind-merge` for conditional class merging.

## Do's and Don'ts

### Do

- Reserve `primary` (yellow) exclusively for primary CTAs, "NEW" badges, avatar initials, and progress bars.
- Pair `primary` only with `on-primary` text. Yellow + white is forbidden.
- Set everything in **Inter Tight** (via the `font-sans` class) — no secondary serif, no script, no decorative italic.
- Hold display headlines at weight 700 with `line-height: 0.95` so they stack tightly on multi-line wraps.
- Use `radius-xs` (2px) on every standard button — the near-flat corner is part of the brand identity.
- Switch full bands between `canvas` and `surface-dark` for storytelling rhythm. Avoid mid-greys as section backgrounds.
- Use `radius-pill` only for badges and sub-nav pills — never for primary CTAs.
- Use uppercase + bold for card headers, dialog titles, and alert titles to maintain consistent hierarchy.
- Prefix the root layout with Tailwind v4 `@import "tailwindcss"` syntax (no `@tailwind` directives).

### Don't

- Don't introduce a secondary accent colour. Yellow is the only brand accent; semantic colours (error, success, warning, info) are functional, not decorative.
- Don't round cards or promo tiles. Square corners are core to the brand expression.
- Don't soften body weights to 500 or 600 — the system relies on the 400 / 700 contrast.
- Don't apply `primary` to body text or large surfaces beyond CTAs, badges, and the yellow card variant.
- Don't pair light grey text on white. Body text steps through `body`, `charcoal`, `mute` — `ash` and `stone` are reserved for placeholders and disabled states.
- Don't add drop shadows to cards or tiles — the system is shadow-free at the surface level; use colour blocking instead.

## Iteration Guide

1. Focus on ONE component at a time. Most components share `radius-xs`, `canvas`/`surface-dark`, and Inter Tight — only the role-specific tokens (`primary`, card variants) shift.
2. When adding new components, follow the existing patterns: use `cn()` for class composition, `framer-motion` for animations, Tailwind utility tokens from the `@theme` block.
3. Default body type to `text-body-md`; reach for `text-subtitle` only on hero subtitles and lead paragraphs.
4. Keep `primary` scarce — if more than one yellow element appears per viewport, ask whether one should drop to `surface-dark` or `canvas`.
5. When adding a new page, place it in the appropriate route group (auth/main). If it needs auth protection, add its path to the middleware matcher in `proxy.ts`.
