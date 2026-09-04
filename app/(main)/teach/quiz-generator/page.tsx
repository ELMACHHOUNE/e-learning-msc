'use client'

import { useState, useEffect } from 'react'
import { InstructorGuard } from '@/components/shared/instructor-guard'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import QuizGenerator from '@/components/ai/quiz-generator'
import LogoSpinner from '@/components/shared/logo-spinner'

interface CourseData {
  id: string
  title: string
}

interface ContentData {
  id: string
  title: string
  content: Array<{
    title: string
    chapters: Array<{
      title: string
      lessons: Array<{
        title: string
        content: string
        type: string
      }>
    }>
  }>
}

export default function TeachQuizGeneratorPage() {
  const [courses, setCourses] = useState<CourseData[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [courseContent, setCourseContent] = useState<ContentData | null>(null)
  const [selectedContentId, setSelectedContentId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/courses')
        if (res.ok) {
          const data = await res.json()
          setCourses(data.courses ?? [])
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  useEffect(() => {
    if (!selectedCourseId) return

    let cancelled = false
    async function fetchContent() {
      try {
        const res = await fetch(`/api/courses/${selectedCourseId}`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setCourseContent(data)
          setSelectedContentId('')
        }
      } catch {}
    }
    fetchContent()
    return () => { cancelled = true }
  }, [selectedCourseId])

  const selectedCourse = courses.find((c) => c.id === selectedCourseId)
  const allLessons = courseContent?.content.flatMap((mod) =>
    mod.chapters.flatMap((ch) =>
      ch.lessons.map((l) => ({
        id: l.title,
        title: `${mod.title} > ${ch.title} > ${l.title}`,
      }))
    )
  ) ?? []

  if (loading) return <LogoSpinner />

  return (
    <InstructorGuard>
      <div className="max-w-4xl mx-auto px-md sm:px-xl py-xxl">
        <div className="mb-xxl">
          <h1 className="text-display-md text-ink font-700 leading-[0.95]">AI Quiz Generator</h1>
          <p className="text-body-sm text-mute mt-sm">
            Generate quiz questions from course content using AI. Review and edit before publishing.
          </p>
        </div>

        <Card className="mb-lg">
          <CardHeader>
            <h3 className="text-heading-sm text-ink font-700">Select Course & Content</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm mt-1"
              >
                <option value="">Select a course...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {allLessons.length > 0 && (
              <div>
                <label className="text-sm font-medium">Lesson (optional)</label>
                <select
                  value={selectedContentId}
                  onChange={(e) => setSelectedContentId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm mt-1"
                >
                  <option value="">All course content</option>
                  {allLessons.map((l) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedCourseId && (
              <div className="flex items-center gap-2">
                <Badge variant="info">Selected: {selectedCourse?.title}</Badge>
                {selectedContentId && (
                  <Badge variant="default">Lesson: {allLessons.find((l) => l.id === selectedContentId)?.title}</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedCourseId && (
          <QuizGenerator
            courseId={selectedCourseId}
            courseTitle={selectedCourse?.title ?? ''}
            contentId={selectedContentId || undefined}
            contentTitle={allLessons.find((l) => l.id === selectedContentId)?.title}
          />
        )}
      </div>
    </InstructorGuard>
  )
}
