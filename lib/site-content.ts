import { connectToDatabase } from '@/lib/db'
import SiteContent from '@/models/SiteContent'
import type { ITechStackCard, ITechStackSection } from '@/types'

export const SITE_CONTENT_KEYS = {
  techStack: 'home.tech_stack',
} as const

export type SiteContentKey = (typeof SITE_CONTENT_KEYS)[keyof typeof SITE_CONTENT_KEYS]

export interface SiteSectionMeta {
  key: SiteContentKey | string
  label: string
  description: string
}

export const SITE_SECTIONS: SiteSectionMeta[] = [
  {
    key: SITE_CONTENT_KEYS.techStack,
    label: 'Home · Built with Modern Technologies',
    description:
      'The eyebrow, heading, and expandable technology cards shown in the dark section of the landing page.',
  },
]

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

export function sanitizeTechStack(raw: unknown): ITechStackSection {
  const source = (raw ?? {}) as Record<string, unknown>
  const rawCards = Array.isArray(source.cards) ? source.cards : []

  const cards: ITechStackCard[] = rawCards
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
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
    case SITE_CONTENT_KEYS.techStack:
      return sanitizeTechStack(raw) as unknown as Record<string, unknown>
    default:
      throw new Error(`Unknown site content key: ${key}`)
  }
}

async function getStored(key: SiteContentKey): Promise<Record<string, unknown> | null> {
  await connectToDatabase()
  const doc = await SiteContent.findOne({ key }).lean()
  if (!doc) return null
  return (doc.content ?? {}) as Record<string, unknown>
}

export async function getTechStackSection(): Promise<ITechStackSection> {
  const stored = await getStored(SITE_CONTENT_KEYS.techStack)
  return sanitizeTechStack(stored)
}

export async function getSection<T>(key: SiteContentKey, sanitize: (raw: unknown) => T): Promise<T> {
  const stored = await getStored(key)
  return sanitize(stored)
}

export async function getAllSiteContent(): Promise<Array<{ key: string; content: Record<string, unknown> }>> {
  await connectToDatabase()
  const docs = await SiteContent.find().sort({ key: 1 }).lean()
  return docs.map((d) => ({
    key: d.key,
    content: (d.content ?? {}) as Record<string, unknown>,
  }))
}