import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  classifyReferrer,
  isExcludedPath,
  normalizePath,
  sanitizeReferrerHost,
  sanitizeTitle,
  stripSensitiveQuery,
} from '@/lib/analytics/paths'

describe('normalizePath', () => {
  it('strips fragments', () => {
    assert.equal(normalizePath('/programs/full-stack#pricing'), '/programs/full-stack')
  })

  it('drops sensitive query parameters', () => {
    assert.equal(
      stripSensitiveQuery('/login?token=abc&email=a@b.co&page=2'),
      '/login?page=2',
    )
  })

  it('never keeps search or credential parameters', () => {
    const cleaned = stripSensitiveQuery('/search?q=grade+list&password=hunter2&code=xyz')
    assert.equal(cleaned.includes('grade'), false)
    assert.equal(cleaned.includes('hunter2'), false)
    assert.equal(cleaned.includes('xyz'), false)
  })

  it('rejects relative, traversing and empty paths', () => {
    assert.equal(normalizePath('programs/x'), null)
    assert.equal(normalizePath('/programs/../../etc/passwd'), null)
    assert.equal(normalizePath(''), null)
    assert.equal(normalizePath(null), null)
    assert.equal(normalizePath('x'.repeat(5000)), null)
  })

  it('collapses dynamic segments so ids do not explode cardinality', () => {
    assert.equal(normalizePath('/courses/6512ab90f1c2a3b4c5d6e7f8'), '/courses/{courseId}')
    assert.equal(normalizePath('/courses/6512ab90f1c2a3b4c5d6e7f8/lessons/12'), '/courses/{courseId}/lessons/{id}')
    assert.equal(normalizePath('/students/42'), '/students/{studentId}')
    assert.equal(normalizePath('/teach/attendance'), '/teach/{section}')
  })

  it('keeps published program slugs because they are bounded', () => {
    assert.equal(normalizePath('/programs/nodejs-mastery'), '/programs/nodejs-mastery')
  })

  it('bounds the stored path length', () => {
    const long = `/${'segment/'.repeat(80)}`
    assert.ok((normalizePath(long) ?? '').length <= 300)
  })

  it('normalizes the root', () => {
    assert.equal(normalizePath('/'), '/')
  })
})

describe('isExcludedPath', () => {
  it('excludes infrastructure, asset and self-referential routes', () => {
    for (const path of ['/api/analytics/collect', '/_next/static/x.js', '/uploads/course/a.png', '/admin/analytics']) {
      assert.equal(isExcludedPath(path), true, path)
    }
  })

  it('keeps real content routes', () => {
    assert.equal(isExcludedPath('/programs/intro'), false)
    assert.equal(isExcludedPath('/dashboard'), false)
  })
})

describe('sanitizeTitle', () => {
  it('collapses whitespace and bounds length', () => {
    assert.equal(sanitizeTitle('  e-Teaching   Home  '), 'e-Teaching Home')
    assert.equal(sanitizeTitle('a'.repeat(500))?.length, 180)
    assert.equal(sanitizeTitle(''), undefined)
    assert.equal(sanitizeTitle(undefined), undefined)
  })
})

describe('sanitizeReferrerHost', () => {
  it('keeps only the hostname', () => {
    assert.equal(sanitizeReferrerHost('https://www.google.com/search?q=x'), 'google.com')
  })

  it('rejects garbage', () => {
    assert.equal(sanitizeReferrerHost('not a host'), undefined)
    assert.equal(sanitizeReferrerHost(undefined), undefined)
  })
})

describe('classifyReferrer', () => {
  it('separates internal, external and unknown', () => {
    assert.equal(classifyReferrer('e-teaching.tech', 'e-teaching.tech'), 'internal')
    assert.equal(classifyReferrer('www.e-teaching.tech', 'e-teaching.tech'), 'internal')
    assert.equal(classifyReferrer('google.com', 'e-teaching.tech'), 'external')
    assert.equal(classifyReferrer(undefined, 'e-teaching.tech'), 'direct_or_unknown')
  })
})