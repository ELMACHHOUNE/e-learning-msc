'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Badge } from '@/components/ui'
import { ImageUpload } from '@/components/ui/image-upload'
import LogoSpinner from '@/components/shared/logo-spinner'
import {
  Plus, Trash2, Save, ArrowLeft, FileText, BookOpen,
  CheckSquare, Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/alert'
import RichTextEditor from '@/components/ui/rich-text-editor'

type LessonType = 'lesson' | 'checkpoint' | 'workshop'

interface Lesson {
  id: string
  title: string
  content: string
  type: LessonType
}

interface Chapter {
  id: string
  title: string
  lessons: Lesson[]
}

interface Module {
  id: string
  title: string
  chapters: Chapter[]
}

interface CourseData {
  id: string
  title: string
  description: string
  coverImage?: string
  price?: number
  active?: boolean
  category?: string
  durationInMonths: number
  totalSessions: number
  content: Module[]
}

function generateId() {
  return Math.random().toString(36).substring(2, 10)
}

function createLesson(type: LessonType = 'lesson'): Lesson {
  return { id: generateId(), title: '', content: '', type }
}

function createChapter(): Chapter {
  return { id: generateId(), title: '', lessons: [createLesson()] }
}

function createModule(): Module {
  return { id: generateId(), title: '', chapters: [createChapter()] }
}

function deserializeModules(encoded: string): Module[] {
  try {
    const raw = decodeURIComponent(escape(atob(encoded)))
    return JSON.parse(raw)
  } catch { return [] }
}

function normalizeContent(raw: Record<string, unknown>[]): Module[] {
  return raw.map((m: Record<string, unknown>) => ({
    id: (m.id ?? (m._id as string)?.toString?.() ?? generateId()) as string,
    title: m.title as string,
    chapters: ((m.chapters as Record<string, unknown>[]) ?? []).map((ch: Record<string, unknown>) => ({
      id: (ch.id ?? (ch._id as string)?.toString?.() ?? generateId()) as string,
      title: ch.title as string,
      lessons: ((ch.lessons as Record<string, unknown>[]) ?? []).map((l: Record<string, unknown>) => ({
        id: (l.id ?? (l._id as string)?.toString?.() ?? generateId()) as string,
        title: l.title as string,
        content: (l.content as string) ?? '',
        type: (l.type as LessonType) ?? 'lesson',
      })),
    })),
  }))
}

const lessonTypeIcons: Record<LessonType, typeof FileText> = {
  lesson: FileText,
  checkpoint: CheckSquare,
  workshop: Wrench,
}

const lessonTypeLabels: Record<LessonType, string> = {
  lesson: 'Lesson',
  checkpoint: 'Checkpoint',
  workshop: 'Workshop',
}

export default function CourseEditor({ courseId }: { courseId: string }) {
  const router = useRouter()
  const isNew = courseId === 'new'

  const [course, setCourse] = useState<CourseData>({
    id: '',
    title: '',
    description: '',
    price: 0,
    category: '',
    durationInMonths: 0,
    totalSessions: 0,
    content: [createModule()],
  })
  const [selectedModule, setSelectedModule] = useState(0)
  const [selectedChapter, setSelectedChapter] = useState(0)
  const [selectedLesson, setSelectedLesson] = useState(0)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [categoryOptions, setCategoryOptions] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((data) => setCategoryOptions(data.categories ?? []))
      .catch(() => {})
    if (!isNew) {
      fetch(`/api/admin/courses/${courseId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            router.replace('/admin')
            return
          }
          const parsedContent = typeof data.content === 'string'
            ? deserializeModules(data.content as string)
            : normalizeContent(data.content ?? [])
          setCourse({
            id: data.id ?? data._id?.toString(),
            title: data.title ?? '',
            description: data.description ?? '',
            coverImage: data.coverImage ?? '',
            price: data.price ?? 0,
            active: data.active ?? true,
            category: data.category ?? '',
            durationInMonths: data.durationInMonths ?? 0,
            totalSessions: data.totalSessions ?? 0,
            content: parsedContent.length > 0 ? parsedContent : [createModule()],
          })
        })
        .finally(() => setLoading(false))
    }
  }, [courseId, isNew, router])

  const currentLesson = course.content[selectedModule]?.chapters[selectedChapter]?.lessons[selectedLesson]

  if (loading) return <LogoSpinner />

  async function saveCourse() {
    if (!course.title.trim() || !course.description.trim() || course.durationInMonths == null || course.totalSessions == null) {
      toast({ variant: 'error', title: 'Missing required fields', message: 'Title, description, duration, and sessions are required.' })
      return
    }
    setSaving(true)
    const payload = {
      title: course.title,
      description: course.description,
      coverImage: course.coverImage ?? '',
      price: course.price,
      active: course.active,
      category: course.category || undefined,
      durationInMonths: course.durationInMonths,
      totalSessions: course.totalSessions,
      content: serializeContent(course.content),
    }

    try {
      if (isNew) {
        const res = await fetch('/api/admin/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to create course' }))
          toast({ variant: 'error', title: 'Failed to create course', message: err.error })
          return
        }
        toast({ variant: 'success', title: 'Course created' })
        const data = await res.json()
        if (data.id) router.replace(`/admin/courses/${data.id}`)
      } else {
        const res = await fetch(`/api/admin/courses/${courseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to save course' }))
          toast({ variant: 'error', title: 'Failed to save course', message: err.error })
          return
        }
        const saved = await res.json()
        setCourse((prev) => ({
          ...prev,
          id: saved.id,
          title: saved.title,
          description: saved.description ?? prev.description,
          coverImage: saved.coverImage ?? prev.coverImage,
          price: saved.price ?? prev.price,
          active: saved.active ?? true,
          category: saved.category ?? prev.category,
          durationInMonths: saved.durationInMonths ?? prev.durationInMonths,
          totalSessions: saved.totalSessions ?? prev.totalSessions,
          content: typeof saved.content === 'string'
            ? deserializeModules(saved.content)
            : normalizeContent(saved.content ?? prev.content),
        }))
        toast({ variant: 'success', title: 'Course saved' })
      }
    } catch (e) {
      toast({ variant: 'error', title: 'Something went wrong', message: String(e) })
    } finally {
      setSaving(false)
    }
  }

  function serializeContent(modules: Module[]): Module[] {
    return modules.map((m) => ({
      id: m.id,
      title: m.title,
      chapters: m.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        lessons: ch.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          content: l.content,
          type: l.type,
        })),
      })),
    }))
  }

  function updateCourse(updater: (prev: CourseData) => CourseData) {
    setCourse(updater)
  }

  const modules = course.content

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-hairline bg-surface-soft sticky top-16 z-40">
        <div className="max-w-[1440px] mx-auto px-xl h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-mute hover:text-ink"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <input
                type="text"
                value={course.title}
                onChange={(e) => updateCourse((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Course Title"
                required
                className="bg-transparent border-none text-heading-xs text-ink font-700 uppercase focus:outline-none w-72 placeholder:text-mute"
              />
            </div>
            <Badge variant="new">{isNew ? 'New' : 'Draft'}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-button-md text-mute hover:text-ink no-underline">Cancel</Link>
            <Button variant="primary" size="sm" onClick={saveCourse} disabled={saving}>
              <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save Course'}
            </Button>
          </div>
        </div>
      </header>

      <div className="border-b border-hairline bg-canvas">
        <div className="max-w-[1440px] mx-auto px-xl py-3 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-caption text-mute uppercase tracking-[0.1em]">Duration</label>
            <input type="number" value={String(course.durationInMonths ?? '')} onChange={(e) => updateCourse((prev) => ({ ...prev, durationInMonths: Number(e.target.value) }))} className="w-16 border border-hairline bg-canvas text-ink text-body-sm px-2 py-1 rounded-[2px] focus:outline-none focus:border-ink" />
            <span className="text-caption text-mute">months</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-caption text-mute uppercase tracking-[0.1em]">Sessions</label>
            <input type="number" value={String(course.totalSessions ?? '')} onChange={(e) => updateCourse((prev) => ({ ...prev, totalSessions: Number(e.target.value) }))} className="w-16 border border-hairline bg-canvas text-ink text-body-sm px-2 py-1 rounded-[2px] focus:outline-none focus:border-ink" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-caption text-mute uppercase tracking-[0.1em]">Category</label>
            <select
              value={course.category ?? ''}
              onChange={(e) => updateCourse((prev) => ({ ...prev, category: e.target.value }))}
              className="border border-hairline bg-canvas text-ink text-body-sm px-2 py-1 rounded-[2px] focus:outline-none focus:border-ink"
            >
              <option value="">Select...</option>
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-caption text-mute uppercase tracking-[0.1em]">Price (MAD)</label>
            <input type="number" value={String(course.price ?? '')} onChange={(e) => updateCourse((prev) => ({ ...prev, price: Number(e.target.value) }))} className="w-24 border border-hairline bg-canvas text-ink text-body-sm px-2 py-1 rounded-[2px] focus:outline-none focus:border-ink" />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => updateCourse((prev) => ({ ...prev, active: !prev.active }))}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-caption uppercase font-bold tracking-[0.1em] border cursor-pointer transition-colors rounded-none bg-transparent',
                course.active !== false
                  ? 'border-success text-success hover:bg-success/10'
                  : 'border-error text-error hover:bg-error/10'
              )}
            >
              <span className={cn(
                'w-2 h-2 rounded-full',
                course.active !== false ? 'bg-success' : 'bg-error'
              )} />
              {course.active !== false ? 'Active' : 'Inactive'}
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-hairline bg-canvas">
        <div className="max-w-[600px] mx-auto px-xl py-3">
          <label className="text-caption text-mute uppercase tracking-[0.1em] block mb-2">Description</label>
          <textarea
            value={course.description}
            onChange={(e) => updateCourse((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Course description"
            required
            rows={3}
            className="w-full border border-hairline bg-canvas text-ink text-body-sm px-3 py-2 rounded-[2px] focus:outline-none focus:border-ink resize-vertical placeholder:text-mute"
          />
        </div>
      </div>

      <div className="border-b border-hairline bg-canvas">
        <div className="max-w-[600px] mx-auto px-xl py-3">
          <ImageUpload
            value={course.coverImage ?? ''}
            onChange={(url) => updateCourse((prev) => ({ ...prev, coverImage: url }))}
          />
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-xl py-xxl flex gap-xxl" style={{ minHeight: 'calc(100vh - 180px)' }}>
        <div className="w-80 shrink-0 border border-hairline bg-canvas overflow-y-auto" style={{ height: 'fit-content', maxHeight: 'calc(100vh - 200px)' }}>
          <div className="p-lg border-b border-hairline bg-surface-soft flex items-center justify-between">
            <h3 className="text-caption text-ink font-700 uppercase tracking-[0.1em]">Content Structure</h3>
            <button
              onClick={() => updateCourse((prev) => ({ ...prev, content: [...prev.content, createModule()] }))}
              className="flex items-center gap-1 text-caption text-mute hover:text-ink bg-transparent border-none cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Module
            </button>
          </div>

          <div className="p-lg space-y-4">
            {modules.map((mod, mi) => (
              <div key={mod.id}>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-mute shrink-0" />
                  <input
                    type="text"
                    value={mod.title}
                    onChange={(e) => {
                      const updated = { ...course }
                      updated.content[mi].title = e.target.value
                      setCourse(updated)
                    }}
                    placeholder="Module title"
                    className="flex-1 bg-transparent border-none text-body-sm text-ink font-600 focus:outline-none placeholder:text-mute/50"
                  />
                  <button onClick={() => {
                    const updated = { ...course }
                    updated.content[mi].chapters.push(createChapter())
                    setCourse(updated)
                    setSelectedModule(mi)
                    setSelectedChapter(updated.content[mi].chapters.length - 1)
                    setSelectedLesson(0)
                  }} className="text-mute hover:text-ink bg-transparent border-none cursor-pointer p-0.5">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  {modules.length > 1 && (
                    <button onClick={() => {
                      const updated = { ...course }
                      updated.content.splice(mi, 1)
                      setCourse(updated)
                      if (selectedModule >= updated.content.length) setSelectedModule(Math.max(0, updated.content.length - 1))
                      setSelectedChapter(0)
                      setSelectedLesson(0)
                    }} className="text-mute hover:text-error bg-transparent border-none cursor-pointer p-0.5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="ml-6 space-y-1 border-l border-hairline pl-3">
                  {mod.chapters.map((chap, ci) => (
                    <div key={ci}>
                      <div className="flex items-center gap-2 py-1">
                        <BookOpen className="w-3.5 h-3.5 text-mute shrink-0" />
                        <input
                          type="text"
                          value={chap.title}
                          onChange={(e) => {
                            const updated = { ...course }
                            updated.content[mi].chapters[ci].title = e.target.value
                            setCourse(updated)
                          }}
                          placeholder="Chapter title"
                          className="flex-1 bg-transparent border-none text-caption text-ink focus:outline-none placeholder:text-mute/50 text-[13px]"
                        />
                        <button onClick={() => {
                          const updated = { ...course }
                          updated.content[mi].chapters[ci].lessons.push(createLesson())
                          setCourse(updated)
                          setSelectedModule(mi)
                          setSelectedChapter(ci)
                          setSelectedLesson(updated.content[mi].chapters[ci].lessons.length - 1)
                        }} className="text-mute hover:text-ink bg-transparent border-none cursor-pointer p-0.5">
                          <Plus className="w-3 h-3" />
                        </button>
                        {mod.chapters.length > 1 && (
                          <button onClick={() => {
                            const updated = { ...course }
                            updated.content[mi].chapters.splice(ci, 1)
                            setCourse(updated)
                            if (selectedChapter >= updated.content[mi].chapters.length) setSelectedChapter(Math.max(0, updated.content[mi].chapters.length - 1))
                            setSelectedLesson(0)
                          }} className="text-mute hover:text-error bg-transparent border-none cursor-pointer p-0.5">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="ml-5 space-y-0.5 border-l border-hairline pl-3">
                        {chap.lessons.map((les, li) => {
                          const LIcon = lessonTypeIcons[les.type]
                          return (
                            <div
                              key={les.id ?? li}
                              onClick={() => { setSelectedModule(mi); setSelectedChapter(ci); setSelectedLesson(li) }}
                              className={cn(
                                'w-full flex items-center gap-2 py-1.5 px-2 text-left text-body-sm hover:bg-surface-soft transition-colors cursor-pointer rounded-none',
                                selectedModule === mi && selectedChapter === ci && selectedLesson === li && 'bg-surface-soft'
                              )}
                            >
                              <LIcon className={cn('w-3 h-3 shrink-0', les.type === 'checkpoint' ? 'text-warning' : les.type === 'workshop' ? 'text-info' : 'text-mute')} />
                              <span className="truncate flex-1 text-[13px] text-charcoal">{les.title || 'Untitled'}</span>
                              {chap.lessons.length > 1 && (
                                <button onClick={(e) => {
                                  e.stopPropagation()
                                  const updated = { ...course }
                                  updated.content[mi].chapters[ci].lessons.splice(li, 1)
                                  setCourse(updated)
                                  if (selectedLesson >= updated.content[mi].chapters[ci].lessons.length) setSelectedLesson(Math.max(0, updated.content[mi].chapters[ci].lessons.length - 1))
                                }} className="text-mute hover:text-error bg-transparent border-none cursor-pointer p-0 shrink-0">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {currentLesson ? (
            <div className="border border-hairline bg-canvas">
              <div className="border-b border-hairline bg-surface-soft px-6 py-3 flex items-center gap-4">
                <input
                  type="text"
                  value={currentLesson.title}
                  onChange={(e) => {
                    const updated = { ...course }
                    updated.content[selectedModule].chapters[selectedChapter].lessons[selectedLesson].title = e.target.value
                    setCourse(updated)
                  }}
                  placeholder="Lesson title"
                  className="flex-1 bg-transparent border-none text-heading-xs text-ink font-700 focus:outline-none placeholder:text-mute/50"
                />
                <div className="flex gap-1">
                  {(Object.keys(lessonTypeLabels) as LessonType[]).map((t) => {
                    const TIcon = lessonTypeIcons[t]
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          const updated = { ...course }
                          updated.content[selectedModule].chapters[selectedChapter].lessons[selectedLesson].type = t
                          setCourse(updated)
                        }}
                        className={cn(
                          'flex items-center gap-1 px-3 py-1.5 text-caption uppercase font-bold tracking-[0.1em] border border-hairline rounded-none bg-transparent cursor-pointer transition-colors',
                          currentLesson.type === t ? 'bg-primary text-on-primary border-primary' : 'text-mute hover:text-ink'
                        )}
                      >
                        <TIcon className="w-3 h-3" />
                        {lessonTypeLabels[t]}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="p-6">
                <RichTextEditor
                  value={currentLesson.content}
                  onChange={(html) => {
                    const updated = { ...course }
                    const lesson = updated.content[selectedModule]?.chapters[selectedChapter]?.lessons[selectedLesson]
                    if (lesson) {
                      lesson.content = html
                      setCourse(updated)
                    }
                  }}
                  placeholder="Type your lesson content here..."
                />
              </div>
            </div>
          ) : (
            <div className="border border-hairline p-xxl text-center">
              <BookOpen className="w-12 h-12 text-mute mx-auto mb-lg" />
              <p className="text-body-md text-mute">No lesson selected</p>
              <p className="text-caption text-charcoal mt-sm">Click on a lesson in the content structure to start editing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
