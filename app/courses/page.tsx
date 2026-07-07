'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui'
import { ArrowRight } from 'lucide-react'

const courses = [
  {
    id: '1',
    title: '15-Month Software Engineering Program',
    description: 'Comprehensive full-stack development track covering frontend, backend, and DevOps.',
    duration: '15 months',
    sessions: 194,
    guilds: 3,
    students: 128,
    status: 'active' as const,
  },
  {
    id: '2',
    title: 'Data Science Bootcamp',
    description: 'Intensive program covering statistics, ML, and data engineering.',
    duration: '12 months',
    sessions: 150,
    guilds: 2,
    students: 64,
    status: 'active' as const,
  },
  {
    id: '3',
    title: 'UI/UX Design Masterclass',
    description: 'Design thinking, user research, prototyping, and visual design.',
    duration: '6 months',
    sessions: 72,
    guilds: 1,
    students: 32,
    status: 'upcoming' as const,
  },
]

export default function CoursesPage() {
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
                  <Badge variant={course.status === 'active' ? 'success' : 'warning'}>{course.status}</Badge>
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
                <p className="text-display-md text-ink font-700">{course.duration}</p>
                <p className="text-caption text-mute">Duration</p>
              </div>
              <div>
                <p className="text-display-md text-ink font-700">{course.sessions}</p>
                <p className="text-caption text-mute">Sessions</p>
              </div>
              <div>
                <p className="text-display-md text-ink font-700">{course.guilds}</p>
                <p className="text-caption text-mute">Active Guilds</p>
              </div>
              <div>
                <p className="text-display-md text-ink font-700">{course.students}</p>
                <p className="text-caption text-mute">Students</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
