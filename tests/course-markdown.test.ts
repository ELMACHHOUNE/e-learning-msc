import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseCourseMarkdown, detectLessonType } from '@/lib/course-markdown'
import { markdownToHtml } from '@/lib/markdown/to-html'

const THREE_LEVEL = `---
title: React Full Course
description: Build modern UIs with React.
category: Web Development
durationInMonths: 4
totalSessions: 32
price: 0
---

# Module One
## Chapter A
### Lesson: Intro
Welcome to **React**.
### Checkpoint: Quiz
Answer the questions.
# Module Two
## Chapter B
### Workshop: Build an App
Ship something.
`

describe('parseCourseMarkdown frontmatter', () => {
  it('reads course details', () => {
    const result = parseCourseMarkdown(THREE_LEVEL)
    assert.equal(result.title, 'React Full Course')
    assert.equal(result.description, 'Build modern UIs with React.')
    assert.equal(result.category, 'Web Development')
    assert.equal(result.durationInMonths, 4)
    assert.equal(result.totalSessions, 32)
    assert.equal(result.price, 0)
  })

  it('does not treat a plain leading rule as frontmatter', () => {
    const result = parseCourseMarkdown('---\njust some text\n---')
    assert.equal(result.title, undefined)
    assert.ok(result.modules.length >= 1)
  })
})

describe('parseCourseMarkdown structure', () => {
  it('maps H1/H2/H3 to modules, chapters and lessons', () => {
    const result = parseCourseMarkdown(THREE_LEVEL)
    assert.equal(result.modules.length, 2)
    assert.equal(result.modules[0].title, 'Module One')
    assert.equal(result.modules[0].chapters.length, 1)
    assert.equal(result.modules[0].chapters[0].title, 'Chapter A')
    assert.equal(result.modules[0].chapters[0].lessons.length, 2)
    assert.equal(result.modules[1].chapters[0].lessons[0].title, 'Workshop: Build an App')
  })

  it('converts lesson bodies to html', () => {
    const result = parseCourseMarkdown(THREE_LEVEL)
    assert.match(result.modules[0].chapters[0].lessons[0].content, /<strong>React<\/strong>/)
  })

  it('detects lesson types from titles', () => {
    const result = parseCourseMarkdown(THREE_LEVEL)
    const lessons = result.modules[0].chapters[0].lessons
    assert.equal(lessons[0].type, 'lesson')
    assert.equal(lessons[1].type, 'checkpoint')
    assert.equal(result.modules[1].chapters[0].lessons[0].type, 'workshop')
  })

  it('lifts a single leading H1 into the course title', () => {
    const md = `# React Full Course
## Module A
### Chapter A1
#### Lesson one
Body text.
`
    const result = parseCourseMarkdown(md)
    assert.equal(result.title, 'React Full Course')
    assert.equal(result.modules.length, 1)
    assert.equal(result.modules[0].title, 'Module A')
    assert.equal(result.modules[0].chapters[0].lessons[0].title, 'Lesson one')
  })

  it('falls back to a single module when there are no headings', () => {
    const result = parseCourseMarkdown('A short course tagline.')
    assert.equal(result.modules.length, 1)
    assert.equal(result.modules[0].chapters.length, 1)
    assert.ok(result.modules[0].chapters[0].lessons.length >= 1)
  })

  it('ignores headings inside fenced code blocks', () => {
    const md = `# Module
## Chapter
### Lesson
\`\`\`md
# not a module
\`\`\`
`
    const result = parseCourseMarkdown(md)
    assert.equal(result.modules.length, 1)
    assert.match(result.modules[0].chapters[0].lessons[0].content, /not a module/)
  })
})

describe('detectLessonType', () => {
  it('classifies checkpoints and workshops', () => {
    assert.equal(detectLessonType('Checkpoint: Variables'), 'checkpoint')
    assert.equal(detectLessonType('Quiz time'), 'checkpoint')
    assert.equal(detectLessonType('Workshop: Hooks'), 'workshop')
    assert.equal(detectLessonType('Lab 3: Deploy'), 'workshop')
    assert.equal(detectLessonType('Introduction'), 'lesson')
  })
})

describe('markdownToHtml', () => {
  it('renders headings, emphasis, code and lists', () => {
    const html = markdownToHtml('# Title\n\nHello **bold** and `code`.\n\n- one\n- two')
    assert.match(html, /<h3>Title<\/h3>/)
    assert.match(html, /<strong>bold<\/strong>/)
    assert.match(html, /<code>code<\/code>/)
    assert.match(html, /<ul><li>one<\/li><li>two<\/li><\/ul>/)
  })

  it('renders fenced code blocks without interpreting them', () => {
    const html = markdownToHtml('```js\nlet a = 1 < 2\n```')
    assert.match(html, /<pre><code class="language-js">/)
    assert.match(html, /1 &lt; 2/)
  })

  it('sanitizes unsafe link protocols', () => {
    const html = markdownToHtml('[click](javascript:alert(1))')
    assert.equal(html.includes('javascript:'), false)
    assert.match(html, /<p>click<\/p>/)
  })

  it('renders ordered lists and blockquotes', () => {
    const html = markdownToHtml('1. first\n2. second\n\n> quoted line')
    assert.match(html, /<ol><li>first<\/li><li>second<\/li><\/ol>/)
    assert.match(html, /<blockquote><p>quoted line<\/p><\/blockquote>/)
  })
})
