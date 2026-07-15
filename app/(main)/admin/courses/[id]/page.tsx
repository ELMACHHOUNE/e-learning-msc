'use client'

import { useParams } from 'next/navigation'
import CourseEditor from '@/components/admin/course-editor'

export default function CourseContentEditor() {
  const params = useParams()
  const courseId = params?.id as string

  return <CourseEditor courseId={courseId} />
}