import { connectToDatabase } from '@/lib/db'
import SiteContent from '@/models/SiteContent'
import type {
  IHeroSection,
  IOverviewSection,
  IRoleCard,
  IRolesSection,
  IOverviewStat,
  ITechStackCard,
  ITechStackSection,
  INavbarSection,
  IFooterSection,
  IContactSection,
  IFeaturedCoursesSection,
  INavLink,
  ILoginSection,
  IForgotPasswordSection,
} from '@/types'

export const SITE_CONTENT_KEYS = {
  hero: 'home.hero',
  overview: 'home.overview',
  roles: 'home.roles',
  techStack: 'home.tech_stack',
  navbar: 'home.navbar',
  footer: 'home.footer',
  contact: 'home.contact',
  featuredCourses: 'home.featured_courses',
  login: 'auth.login',
  forgotPassword: 'auth.forgot_password',
} as const

export type SiteContentKey = (typeof SITE_CONTENT_KEYS)[keyof typeof SITE_CONTENT_KEYS]

export interface SiteSectionMeta {
  key: SiteContentKey | string
  label: string
  description: string
}

export const SITE_SECTIONS: SiteSectionMeta[] = [
  {
    key: SITE_CONTENT_KEYS.hero,
    label: 'Home · Hero',
    description:
      'Full-screen banner at the top of the landing page: background image, optional headline, and the primary call-to-action.',
  },
  {
    key: SITE_CONTENT_KEYS.overview,
    label: 'Home · Platform Overview',
    description:
      'The "PLATFORM OVERVIEW" section: eyebrow, heading, description, illustration, and the key stat figures.',
  },
  {
    key: SITE_CONTENT_KEYS.roles,
    label: 'Home · Role Configurator & Management',
    description:
      'The dark two-column section describing the Admin Layer and Instructor Console.',
  },
  {
    key: SITE_CONTENT_KEYS.techStack,
    label: 'Home · Built with Modern Technologies',
    description:
      'The eyebrow, heading, and expandable technology cards shown in the dark section of the landing page.',
  },
  {
    key: SITE_CONTENT_KEYS.navbar,
    label: 'Home · Navbar',
    description:
      'The top navigation bar: brand name, brand image, and the navigation links shown on the landing page.',
  },
  {
    key: SITE_CONTENT_KEYS.footer,
    label: 'Home · Footer',
    description:
      'The footer: brand, tagline, portal links, legal links, copyright, and credit line.',
  },
  {
    key: SITE_CONTENT_KEYS.contact,
    label: 'Home · Contact Section',
    description:
      'The "GET IN TOUCH / CONTACT US" block: heading, description, WhatsApp number, and email.',
  },
  {
    key: SITE_CONTENT_KEYS.featuredCourses,
    label: 'Home · Featured Courses',
    description:
      'The "EXPLORE OUR PROGRAMS" section: eyebrow, heading, and the selection of up to 3 courses to feature.',
  },
  {
    key: SITE_CONTENT_KEYS.login,
    label: 'Login page',
    description:
      'The sign-in page: left panel eyebrow, tagline, background image, and the form heading + subtitle.',
  },
  {
    key: SITE_CONTENT_KEYS.forgotPassword,
    label: 'Forgot Password page',
    description:
      'The reset-password page: left panel title, heading, description, and the success state text.',
  },
]

export const DEFAULT_HERO_SECTION: IHeroSection = {
  image: '/images/cover.png',
  heading: '',
  subtitle: '',
  ctaText: 'Explore the Platform',
  ctaLink: '#elearning',
}

export const DEFAULT_OVERVIEW_SECTION: IOverviewSection = {
  eyebrow: 'PLATFORM OVERVIEW',
  title: 'STRUCTURED LEARNING. MEASURABLE OUTCOMES.',
  description:
    'e-Teaching delivers a disciplined, three-role architecture for technical education. Administrators define programs with precision. Instructors execute curriculum through live cohort tracking, attendance logging, and milestone validation. Students progress through modular pathways with clear metrics at every stage.',
  image: '/images/icon.png',
  stats: [
    { value: '3', label: 'Platform Roles' },
    { value: '194', label: 'Sessions' },
    { value: '12', label: 'Modules' },
  ],
}

export const DEFAULT_ROLES_SECTION: IRolesSection = {
  title: 'ROLE CONFIGURATOR & MANAGEMENT',
  cards: [
    {
      title: 'Admin Layer',
      description:
        'Create and manage student and instructor accounts. Craft courses with defined durations, map session volumes, and compose nested module schemas. Assign students into Guild groupings and designate primary instructors — all from a single command surface.',
      icon: 'shield',
    },
    {
      title: 'Instructor Console',
      description:
        'Track students through a high-performance matrix interface. Oversee LabPhase progression, validate project submissions at milestone checkpoints, and run live attendance panels per session. One-to-one booking and earnings analytics complete the command suite.',
      icon: 'terminal',
    },
  ],
}

export const DEFAULT_TECH_STACK_SECTION: ITechStackSection = {
  sectionEyebrow: 'TECHNOLOGY STACK',
  sectionTitle: 'BUILT WITH MODERN TECHNOLOGIES',
  cards: [
    {
      description: 'Full-stack Framework',
      title: 'Next.js 16',
      src: '/images/cover.png',
      ctaText: 'Learn More',
      ctaLink: 'https://nextjs.org',
      content: [
        'Next.js is the leading React framework for production-grade applications. It provides server-side rendering, static site generation, and API routes all in one unified framework.',
        'With the App Router, it offers a powerful paradigm for building modern web applications with React Server Components, streaming, and partial prerendering.',
        'The framework powers this entire platform, handling routing, data fetching, and rendering with precision.',
      ],
    },
    {
      description: 'User Interface Library',
      title: 'React 19',
      src: '/images/cover.png',
      ctaText: 'Learn More',
      ctaLink: 'https://react.dev',
      content: [
        'React is the industry-standard library for building user interfaces. Version 19 introduces enhanced concurrent features, improved server components, and a streamlined hook API.',
        'This platform leverages React\'s component model to create a cohesive, maintainable UI architecture where each piece — from navigation to course cards — is a reusable building block.',
      ],
    },
    {
      description: 'Static Typing',
      title: 'TypeScript 6',
      src: '/images/cover.png',
      ctaText: 'Learn More',
      ctaLink: 'https://typescriptlang.org',
      content: [
        'TypeScript brings static type checking to JavaScript, catching errors at compile time rather than runtime.',
        'This codebase is fully typed, ensuring that data flows predictably between components, models, and API routes. TypeScript 6 offers faster compilation, improved type inference, and richer editor tooling.',
      ],
    },
    {
      description: 'Utility-first CSS',
      title: 'Tailwind CSS v4',
      src: '/images/cover.png',
      ctaText: 'Learn More',
      ctaLink: 'https://tailwindcss.com',
      content: [
        'Tailwind CSS is a utility-first framework that enables rapid UI development without leaving your HTML.',
        'Version 4 introduces a CSS-first configuration model using the @theme directive, eliminating the need for a separate JavaScript config file.',
        'Every component on this platform is styled with Tailwind utilities, ensuring consistency, responsiveness, and a clean, geometric aesthetic.',
      ],
    },
    {
      description: 'Database & ODM',
      title: 'MongoDB & Mongoose',
      src: '/images/cover.png',
      ctaText: 'Learn More',
      ctaLink: 'https://mongoosejs.com',
      content: [
        'MongoDB provides a flexible, document-oriented database that scales naturally with the platform\'s data model.',
        'Mongoose acts as the ODM layer, enforcing schema validation and providing a rich query API.',
        'Together they power the course catalog, user management, attendance tracking, and project submission pipelines that form the backbone of this educational platform.',
      ],
    },
  ],
}

export const DEFAULT_NAVBAR_SECTION: INavbarSection = {
  brandName: 'e-Teaching',
  brandImage: '/images/icon.png',
  navLinks: [{ label: 'Programs', href: '/programs' }],
}

export const DEFAULT_FOOTER_SECTION: IFooterSection = {
  brandName: 'e-Teaching',
  brandImage: '/images/icon.png',
  tagline:
    'Geometric precision in technical education. Built for administrators, instructors, and students who demand structure.',
  portalTitle: 'System Portals',
  portals: [
    { label: 'Admin Registry', href: '/admin' },
    { label: 'Instructor Console', href: '/dashboard' },
    { label: 'Student Workspace', href: '/programs' },
  ],
  legalTitle: 'Legal & Compliance',
  legalLinks: ['Privacy Policy', 'Terms of Service', 'Data Processing', 'Cookie Policy'],
  copyright: 'e-Teaching. All rights reserved.',
  credit: 'Built by ELMACHHOUNE',
}

export const DEFAULT_CONTACT_SECTION: IContactSection = {
  eyebrow: 'GET IN TOUCH',
  title: `LET'S CONNECT`,
  heading: 'CONTACT US',
  description:
    'We\x27d love to hear from you. Reach out through any of the channels below and we\x27ll get back to you promptly.',
  image: '/images/world.svg',
  whatsappNumber: '212649455082',
  whatsappDisplay: '+212 649 455 082',
  email: 'business.elmachhoune@gmail.com',
}

export const DEFAULT_FEATURED_COURSES_SECTION: IFeaturedCoursesSection = {
  eyebrow: 'FEATURED COURSES',
  title: 'EXPLORE OUR PROGRAMS',
  courseIds: [],
}

export const DEFAULT_LOGIN_SECTION: ILoginSection = {
  eyebrow: 'E-TEACHING',
  tagline: 'Structured learning. Measurable outcomes.',
  image: '/images/login.png',
  title: 'Welcome back',
  subtitle: 'Sign in to your account',
}

export const DEFAULT_FORGOT_PASSWORD_SECTION: IForgotPasswordSection = {
  leftTitle: 'Reset Password',
  title: 'Forgot password?',
  description:
    'No worries. Enter your email and we\x27ll send you reset instructions.',
  successTitle: 'Check your email',
  successDescription:
    'If an account exists with that email, we\x27ve sent password reset instructions.',
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function asParagraphs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((p) => asString(p))
      .filter(Boolean)
  }
  return asString(value)
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

function asRecords(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
}

export function sanitizeHero(raw: unknown): IHeroSection {
  const source = (raw ?? {}) as Record<string, unknown>
  const fallback = DEFAULT_HERO_SECTION
  return {
    image: asString(source.image) || fallback.image,
    heading: asString(source.heading),
    subtitle: asString(source.subtitle),
    ctaText: asString(source.ctaText) || fallback.ctaText,
    ctaLink: asString(source.ctaLink) || fallback.ctaLink,
  }
}

export function sanitizeOverview(raw: unknown): IOverviewSection {
  const source = (raw ?? {}) as Record<string, unknown>
  const fallback = DEFAULT_OVERVIEW_SECTION

  const stats: IOverviewStat[] = asRecords(source.stats)
    .map((stat) => ({
      value: asString(stat.value),
      label: asString(stat.label),
    }))
    .filter((stat) => stat.value)

  return {
    eyebrow: asString(source.eyebrow) || fallback.eyebrow,
    title: asString(source.title) || fallback.title,
    description: asString(source.description) || fallback.description,
    image: asString(source.image) || fallback.image,
    stats: stats.length > 0 ? stats : fallback.stats,
  }
}

export function sanitizeRoles(raw: unknown): IRolesSection {
  const source = (raw ?? {}) as Record<string, unknown>
  const fallback = DEFAULT_ROLES_SECTION

  const cards: IRoleCard[] = asRecords(source.cards)
    .map((card) => ({
      title: asString(card.title),
      description: asString(card.description),
      icon: asString(card.icon),
    }))
    .filter((card) => card.title)

  return {
    title: asString(source.title) || fallback.title,
    cards: cards.length > 0 ? cards : fallback.cards,
  }
}

export function sanitizeTechStack(raw: unknown): ITechStackSection {
  const source = (raw ?? {}) as Record<string, unknown>
  const rawCards = Array.isArray(source.cards) ? source.cards : []

  const cards: ITechStackCard[] = asRecords(rawCards)
    .map((c) => ({
      title: asString(c.title),
      description: asString(c.description),
      src: asString(c.src),
      ctaText: asString(c.ctaText),
      ctaLink: asString(c.ctaLink),
      content: asParagraphs(c.content),
    }))
    .filter((c) => c.title)

  const fallback = DEFAULT_TECH_STACK_SECTION
  const selectedCards = cards.length > 0 ? cards : fallback.cards

  return {
    sectionEyebrow: asString(source.sectionEyebrow) || fallback.sectionEyebrow,
    sectionTitle: asString(source.sectionTitle) || fallback.sectionTitle,
    cards: selectedCards,
  }
}

export function sanitizeSiteContent(
  key: SiteContentKey,
  raw: unknown
): Record<string, unknown> {
  switch (key) {
    case SITE_CONTENT_KEYS.hero:
      return sanitizeHero(raw) as unknown as Record<string, unknown>
    case SITE_CONTENT_KEYS.overview:
      return sanitizeOverview(raw) as unknown as Record<string, unknown>
    case SITE_CONTENT_KEYS.roles:
      return sanitizeRoles(raw) as unknown as Record<string, unknown>
    case SITE_CONTENT_KEYS.techStack:
      return sanitizeTechStack(raw) as unknown as Record<string, unknown>
    case SITE_CONTENT_KEYS.navbar:
      return sanitizeNavbar(raw) as unknown as Record<string, unknown>
    case SITE_CONTENT_KEYS.footer:
      return sanitizeFooter(raw) as unknown as Record<string, unknown>
    case SITE_CONTENT_KEYS.contact:
      return sanitizeContact(raw) as unknown as Record<string, unknown>
    case SITE_CONTENT_KEYS.featuredCourses:
      return sanitizeFeaturedCourses(raw) as unknown as Record<string, unknown>
    case SITE_CONTENT_KEYS.login:
      return sanitizeLogin(raw) as unknown as Record<string, unknown>
    case SITE_CONTENT_KEYS.forgotPassword:
      return sanitizeForgotPassword(raw) as unknown as Record<string, unknown>
    default:
      throw new Error(`Unknown site content key: ${key}`)
  }
}

export function sanitizeNavbar(raw: unknown): INavbarSection {
  const source = (raw ?? {}) as Record<string, unknown>
  const fallback = DEFAULT_NAVBAR_SECTION

  const navLinks: INavLink[] = asRecords(source.navLinks)
    .map((link) => ({
      label: asString(link.label),
      href: asString(link.href),
    }))
    .filter((link) => link.label)

  return {
    brandName: asString(source.brandName) || fallback.brandName,
    brandImage: asString(source.brandImage) || fallback.brandImage,
    navLinks: navLinks.length > 0 ? navLinks : fallback.navLinks,
  }
}

export function sanitizeFooter(raw: unknown): IFooterSection {
  const source = (raw ?? {}) as Record<string, unknown>
  const fallback = DEFAULT_FOOTER_SECTION

  const portals: INavLink[] = asRecords(source.portals)
    .map((link) => ({
      label: asString(link.label),
      href: asString(link.href),
    }))
    .filter((link) => link.label)

  return {
    brandName: asString(source.brandName) || fallback.brandName,
    brandImage: asString(source.brandImage) || fallback.brandImage,
    tagline: asString(source.tagline) || fallback.tagline,
    portalTitle: asString(source.portalTitle) || fallback.portalTitle,
    portals: portals.length > 0 ? portals : fallback.portals,
    legalTitle: asString(source.legalTitle) || fallback.legalTitle,
    legalLinks:
      asParagraphs(source.legalLinks).length > 0
        ? asParagraphs(source.legalLinks)
        : fallback.legalLinks,
    copyright: asString(source.copyright) || fallback.copyright,
    credit: asString(source.credit) || fallback.credit,
  }
}

export function sanitizeContact(raw: unknown): IContactSection {
  const source = (raw ?? {}) as Record<string, unknown>
  const fallback = DEFAULT_CONTACT_SECTION

  return {
    eyebrow: asString(source.eyebrow) || fallback.eyebrow,
    title: asString(source.title) || fallback.title,
    heading: asString(source.heading) || fallback.heading,
    description: asString(source.description) || fallback.description,
    image: asString(source.image) || fallback.image,
    whatsappNumber: asString(source.whatsappNumber) || fallback.whatsappNumber,
    whatsappDisplay: asString(source.whatsappDisplay) || fallback.whatsappDisplay,
    email: asString(source.email) || fallback.email,
  }
}

export function sanitizeFeaturedCourses(raw: unknown): IFeaturedCoursesSection {
  const source = (raw ?? {}) as Record<string, unknown>
  const fallback = DEFAULT_FEATURED_COURSES_SECTION

  const courseIds = Array.isArray(source.courseIds)
    ? source.courseIds.map((id) => asString(id)).filter(Boolean)
    : []

  return {
    eyebrow: asString(source.eyebrow) || fallback.eyebrow,
    title: asString(source.title) || fallback.title,
    courseIds,
  }
}

export function sanitizeLogin(raw: unknown): ILoginSection {
  const source = (raw ?? {}) as Record<string, unknown>
  const fallback = DEFAULT_LOGIN_SECTION

  return {
    eyebrow: asString(source.eyebrow) || fallback.eyebrow,
    tagline: asString(source.tagline) || fallback.tagline,
    image: asString(source.image) || fallback.image,
    title: asString(source.title) || fallback.title,
    subtitle: asString(source.subtitle) || fallback.subtitle,
  }
}

export function sanitizeForgotPassword(raw: unknown): IForgotPasswordSection {
  const source = (raw ?? {}) as Record<string, unknown>
  const fallback = DEFAULT_FORGOT_PASSWORD_SECTION

  return {
    leftTitle: asString(source.leftTitle) || fallback.leftTitle,
    title: asString(source.title) || fallback.title,
    description: asString(source.description) || fallback.description,
    successTitle: asString(source.successTitle) || fallback.successTitle,
    successDescription:
      asString(source.successDescription) || fallback.successDescription,
  }
}

async function getStored(key: SiteContentKey): Promise<Record<string, unknown> | null> {
  await connectToDatabase()
  const doc = await SiteContent.findOne({ key }).lean()
  if (!doc) return null
  return (doc.content ?? {}) as Record<string, unknown>
}

export async function getSection<T>(key: SiteContentKey, sanitize: (raw: unknown) => T): Promise<T> {
  const stored = await getStored(key)
  return sanitize(stored)
}

export async function getHeroSection(): Promise<IHeroSection> {
  return getSection(SITE_CONTENT_KEYS.hero, sanitizeHero)
}

export async function getOverviewSection(): Promise<IOverviewSection> {
  return getSection(SITE_CONTENT_KEYS.overview, sanitizeOverview)
}

export async function getRolesSection(): Promise<IRolesSection> {
  return getSection(SITE_CONTENT_KEYS.roles, sanitizeRoles)
}

export async function getTechStackSection(): Promise<ITechStackSection> {
  return getSection(SITE_CONTENT_KEYS.techStack, sanitizeTechStack)
}

export async function getNavbarSection(): Promise<INavbarSection> {
  return getSection(SITE_CONTENT_KEYS.navbar, sanitizeNavbar)
}

export async function getFooterSection(): Promise<IFooterSection> {
  return getSection(SITE_CONTENT_KEYS.footer, sanitizeFooter)
}

export async function getContactSection(): Promise<IContactSection> {
  return getSection(SITE_CONTENT_KEYS.contact, sanitizeContact)
}

export async function getFeaturedCoursesSection(): Promise<IFeaturedCoursesSection> {
  return getSection(SITE_CONTENT_KEYS.featuredCourses, sanitizeFeaturedCourses)
}

export async function getLoginSection(): Promise<ILoginSection> {
  return getSection(SITE_CONTENT_KEYS.login, sanitizeLogin)
}

export async function getForgotPasswordSection(): Promise<IForgotPasswordSection> {
  return getSection(SITE_CONTENT_KEYS.forgotPassword, sanitizeForgotPassword)
}

export async function getAllSiteContent(): Promise<Array<{ key: string; content: Record<string, unknown> }>> {
  await connectToDatabase()
  const docs = await SiteContent.find().sort({ key: 1 }).lean()
  return docs.map((d) => ({
    key: d.key,
    content: (d.content ?? {}) as Record<string, unknown>,
  }))
}