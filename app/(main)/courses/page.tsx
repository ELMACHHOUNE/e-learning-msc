'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui'
import { ArrowRight, BookOpen } from 'lucide-react'

interface CourseItem {
  id: string
  title: string
  description: string
  durationInMonths: number
  totalSessions: number
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/courses')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCourses(data)
        else setCourses([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-hairline-strong border-t-ink rounded-full animate-spin" />
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-xl py-xxl">
        <h1 className="text-display-md text-ink font-700 leading-[0.95] mb-xxl">My Courses</h1>
        <div className="bg-canvas border border-hairline p-xxl text-center">
          <BookOpen className="w-12 h-12 text-mute mx-auto mb-lg" />
          <p className="text-body-md text-mute">No courses available yet.</p>
          <p className="text-caption text-charcoal mt-sm">Courses will appear here once they are created and assigned.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <h1 className="text-display-md text-ink font-700 leading-[0.95] mb-xxl">My Courses</h1>

      <div className="grid gap-lg">
        {courses.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-canvas border border-hairline p-xxl"
          >
            <div className="flex items-start justify-between mb-lg">
              <div>
                <div className="flex items-center gap-md mb-sm">
                  <h2 className="text-heading-sm text-ink font-700">{course.title}</h2>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-body-md text-mute">{course.description}</p>
              </div>
              <Link
                href={`/courses/${course.id}`}
                className="flex items-center gap-1 text-button-md text-ink underline no-underline hover:underline shrink-0"
              >
                Preview Course <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex gap-xxl">
              <div>
                <p className="text-display-md text-ink font-700">{course.durationInMonths} months</p>
                <p className="text-caption text-mute">Duration</p>
              </div>
              <div>
                <p className="text-display-md text-ink font-700">{course.totalSessions}</p>
                <p className="text-caption text-mute">Sessions</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}