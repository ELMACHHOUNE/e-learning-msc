import { markdownToHtml } from '@/lib/markdown/to-html'

export type CourseLessonType = 'lesson' | 'checkpoint' | 'workshop'

export interface ParsedLesson {
  id: string
  title: string
  content: string
  type: CourseLessonType
}

export interface ParsedChapter {
  id: string
  title: string
  lessons: ParsedLesson[]
}

export interface ParsedModule {
  id: string
  title: string
  chapters: ParsedChapter[]
}

export interface ParsedCourseDetails {
  title?: string
  description?: string
  price?: number
  durationInMonths?: number
  totalSessions?: number
  category?: string
  coverImage?: string
}

export interface ParsedCourseMarkdown extends ParsedCourseDetails {
  modules: ParsedModule[]
}

interface HeadingNode {
  level: number
  title: string
  contentLines: string[]
  children: HeadingNode[]
}

const HEADING_RE = /^(#{1,6})\s+(.*?)\s*#*\s*$/
const FENCE_RE = /^\s*(`{3,}|~{3,})/

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

function cleanTitle(title: string): string {
  return title.replace(/^[\s*_]+|[\s*_]+$/g, '').trim()
}

function hasContent(lines: string[] | undefined): boolean {
  return (lines ?? []).join('\n').trim().length > 0
}

export function detectLessonType(title: string): CourseLessonType {
  const value = title.toLowerCase()
  if (/(checkpoint|quiz|assessment|assignment|exercise|evaluation|exam|test)/.test(value)) return 'checkpoint'
  if (/(workshop|atelier|hands[- ]?on|practical|\blab\b|\bproject\b)/.test(value)) return 'workshop'
  return 'lesson'
}

interface Frontmatter {
  data: Record<string, string>
  body: string
}

function parseFrontmatter(markdown: string): Frontmatter {
  const normalized = markdown.replace(/\r\n?/g, '\n')
  if (!normalized.startsWith('---')) return { data: {}, body: normalized }

  const end = normalized.indexOf('\n---', 3)
  if (end === -1) return { data: {}, body: normalized }

  const block = normalized.slice(3, end).trim()
  const body = normalized.slice(end + 4).replace(/^\n+/, '')
  const data: Record<string, string> = {}

  for (const rawLine of block.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const index = line.indexOf(':')
    if (index === -1) continue
    const key = line.slice(0, index).trim().toLowerCase().replace(/\s+/g, '')
    let value = line.slice(index + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key && value) data[key] = value
  }

  if (Object.keys(data).length === 0) return { data: {}, body: normalized }
  return { data, body }
}

function parseDetails(data: Record<string, string>): ParsedCourseDetails {
  const pick = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      if (data[key]) return data[key]
    }
    return undefined
  }
  const toInt = (value?: string): number | undefined => {
    if (value == null) return undefined
    const parsed = Number.parseInt(value, 10)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  const toNumber = (value?: string): number | undefined => {
    if (value == null) return undefined
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  const details: ParsedCourseDetails = {}
  const title = pick('title', 'name', 'course')
  const description = pick('description', 'summary', 'excerpt', 'about', 'overview')
  const category = pick('category', 'track', 'topic')
  const coverImage = pick('coverimage', 'cover', 'image', 'thumbnail')
  const durationInMonths = toInt(pick('durationinmonths', 'durationinmonth', 'duration_months', 'durationmonths', 'duration', 'months'))
  const totalSessions = toInt(pick('totalsessions', 'total_sessions', 'sessions', 'sessioncount'))
  const price = toNumber(pick('price', 'fee', 'cost'))

  if (title) details.title = title
  if (description) details.description = description
  if (category) details.category = category
  if (coverImage) details.coverImage = coverImage
  if (durationInMonths != null) details.durationInMonths = durationInMonths
  if (totalSessions != null) details.totalSessions = totalSessions
  if (price != null) details.price = price
  return details
}

function extractHeadings(body: string): { nodes: HeadingNode[]; intro: string[] } {
  const root: HeadingNode = { level: 0, title: '', contentLines: [], children: [] }
  const stack: HeadingNode[] = [root]
  let inCode = false
  let fenceMarker = ''

  for (const line of body.split('\n')) {
    const fence = line.match(FENCE_RE)
    if (fence) {
      const marker = fence[1][0]
      if (!inCode) {
        inCode = true
        fenceMarker = marker
      } else if (marker === fenceMarker) {
        inCode = false
        fenceMarker = ''
      }
      stack[stack.length - 1].contentLines.push(line)
      continue
    }

    if (!inCode) {
      const heading = line.match(HEADING_RE)
      if (heading) {
        const node: HeadingNode = {
          level: heading[1].length,
          title: cleanTitle(heading[2]),
          contentLines: [],
          children: [],
        }
        while (stack.length > 1 && stack[stack.length - 1].level >= node.level) stack.pop()
        stack[stack.length - 1].children.push(node)
        stack.push(node)
        continue
      }
    }

    stack[stack.length - 1].contentLines.push(line)
  }

  return { nodes: root.children, intro: root.contentLines }
}

function collectLevels(nodes: HeadingNode[], levels = new Set<number>()): Set<number> {
  for (const node of nodes) {
    levels.add(node.level)
    collectLevels(node.children, levels)
  }
  return levels
}

function countByLevel(nodes: HeadingNode[], counts = new Map<number, number>()): Map<number, number> {
  for (const node of nodes) {
    counts.set(node.level, (counts.get(node.level) ?? 0) + 1)
    countByLevel(node.children, counts)
  }
  return counts
}

function serializeBody(node: HeadingNode): string {
  const lines = [...node.contentLines]
  for (const child of node.children) {
    lines.push('')
    lines.push(`${'#'.repeat(child.level)} ${child.title}`)
    lines.push(...serializeBody(child).split('\n'))
  }
  return lines.join('\n')
}

function buildLesson(node: HeadingNode): ParsedLesson {
  const markdown = serializeBody(node).trim()
  return {
    id: generateId(),
    title: node.title || 'Untitled',
    content: markdown ? markdownToHtml(markdown) : '',
    type: detectLessonType(node.title),
  }
}

function buildSyntheticLesson(title: string, lines: string[]): ParsedLesson {
  const markdown = lines.join('\n').trim()
  return {
    id: generateId(),
    title,
    content: markdown ? markdownToHtml(markdown) : '',
    type: 'lesson',
  }
}

function buildChapter(node: HeadingNode): ParsedChapter {
  const lessons: ParsedLesson[] = []
  if (hasContent(node.contentLines)) lessons.push(buildSyntheticLesson('Overview', node.contentLines))
  for (const child of node.children) lessons.push(buildLesson(child))
  if (lessons.length === 0) lessons.push(buildSyntheticLesson('Overview', node.contentLines))
  return { id: generateId(), title: node.title || 'Chapter', lessons }
}

function buildModule(node: HeadingNode, levelOrder: number[]): ParsedModule {
  const chapters: ParsedChapter[] = []
  const directLessons: HeadingNode[] = []

  for (const child of node.children) {
    if (levelOrder.indexOf(child.level) === 1) chapters.push(buildChapter(child))
    else directLessons.push(child)
  }

  if (directLessons.length > 0 || hasContent(node.contentLines)) {
    const lessons: ParsedLesson[] = []
    if (hasContent(node.contentLines)) lessons.push(buildSyntheticLesson('Overview', node.contentLines))
    for (const lesson of directLessons) lessons.push(buildLesson(lesson))
    chapters.unshift({ id: generateId(), title: 'Overview', lessons })
  }

  if (chapters.length === 0) {
    chapters.push({
      id: generateId(),
      title: 'Overview',
      lessons: [buildSyntheticLesson('Overview', node.contentLines)],
    })
  }

  return { id: generateId(), title: node.title || 'Module', chapters }
}

function appendOrphan(module: ParsedModule, node: HeadingNode, levelOrder: number[]): void {
  if (levelOrder.indexOf(node.level) === 1) {
    module.chapters.push(buildChapter(node))
    return
  }
  let chapter = module.chapters[0]
  if (!chapter) {
    chapter = { id: generateId(), title: 'Overview', lessons: [] }
    module.chapters.push(chapter)
  }
  chapter.lessons.push(buildLesson(node))
}

function buildModules(topNodes: HeadingNode[], intro: string[], levelOrder: number[]): ParsedModule[] {
  const modules: ParsedModule[] = []
  let synthetic: ParsedModule | null = null

  for (const node of topNodes) {
    if (levelOrder.indexOf(node.level) <= 0) {
      modules.push(buildModule(node, levelOrder))
      synthetic = null
    } else {
      if (!synthetic) {
        synthetic = { id: generateId(), title: 'Course Content', chapters: [] }
        modules.push(synthetic)
      }
      appendOrphan(synthetic, node, levelOrder)
    }
  }

  if (hasContent(intro)) {
    modules.unshift({
      id: generateId(),
      title: 'Introduction',
      chapters: [
        {
          id: generateId(),
          title: 'Overview',
          lessons: [buildSyntheticLesson('Overview', intro)],
        },
      ],
    })
  }

  if (modules.length === 0) {
    modules.push({
      id: generateId(),
      title: 'Course Content',
      chapters: [
        {
          id: generateId(),
          title: 'Overview',
          lessons: [{ id: generateId(), title: 'Overview', content: '', type: 'lesson' }],
        },
      ],
    })
  }

  return modules
}

export function parseCourseMarkdown(markdown: string): ParsedCourseMarkdown {
  const { data, body } = parseFrontmatter(markdown)
  const details = parseDetails(data)
  const { nodes, intro } = extractHeadings(body)

  const counts = countByLevel(nodes)
  const levels = [...counts.keys()].sort((a, b) => a - b)
  let topNodes = nodes

  if (levels.length > 1 && counts.get(levels[0]) === 1) {
    const index = topNodes.findIndex((node) => node.level === levels[0])
    if (index !== -1) {
      const docTitle = topNodes[index].title
      if (!details.title && docTitle) details.title = docTitle
      topNodes = [
        ...topNodes.slice(0, index),
        ...topNodes[index].children,
        ...topNodes.slice(index + 1),
      ]
    }
  }

  const introLines = intro.join('\n').trim()
  let introForModules = intro
  if (introLines && !details.description && introLines.length <= 240) {
    details.description = introLines.replace(/\s+/g, ' ')
    introForModules = []
  }

  const levelOrder = [...collectLevels(topNodes)].sort((a, b) => a - b)
  const modules = buildModules(topNodes, introForModules, levelOrder)

  return { ...details, modules }
}

export const COURSE_MARKDOWN_TEMPLATE = `---
title: React Full Course
description: From zero to job-ready, build modern React applications.
category: Web Development
durationInMonths: 4
totalSessions: 32
price: 0
---

# Module 1: Getting Started

## Chapter 1: Environment Setup

### Lesson: Install Node.js and npm
Install the LTS release and verify with \`node -v\`.

### Workshop: Create your first app
Run \`npx create-react-app\` and explore the project structure.

## Chapter 2: JSX Fundamentals

### Lesson: What is JSX?
JSX lets you write **HTML-like** markup inside JavaScript.

### Checkpoint: JSX Quiz
Answer the questions before moving on.

# Module 2: Components & State

## Chapter 1: Building Components

### Lesson: Function Components
A component is a function that returns JSX.
`
