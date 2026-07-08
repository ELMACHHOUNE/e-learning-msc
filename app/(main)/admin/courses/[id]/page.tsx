'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button, Badge } from '@/components/ui'
import {
  Plus, Trash2, Save, ArrowLeft, FileText, Layers, BookOpen,
  CheckSquare, Wrench, Image, Video, Type, GripVertical, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

function serializeModules(modules: Module[]): string {
  try {
    const raw = JSON.stringify(modules, null, 2)
    return btoa(unescape(encodeURIComponent(raw)))
  } catch { return '' }
}

function deserializeModules(encoded: string): Module[] {
  try {
    const raw = decodeURIComponent(escape(atob(encoded)))
    return JSON.parse(raw)
  } catch { return [] }
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

function encodeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function CourseContentEditor() {
  const router = useRouter()
  const params = useParams()
  const courseId = params?.id as string
  const isNew = courseId === 'new'

  const [course, setCourse] = useState<CourseData>({
    id: '',
    title: '',
    description: '',
    durationInMonths: 0,
    totalSessions: 0,
    content: [createModule()],
  })
  const [selectedModule, setSelectedModule] = useState(0)
  const [selectedChapter, setSelectedChapter] = useState(0)
  const [selectedLesson, setSelectedLesson] = useState(0)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)

  // Content editor state
  const [contentType, setContentType] = useState<'text' | 'image' | 'video'>('text')
  const [textContent, setTextContent] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')

  useEffect(() => {
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
            : (data.content ?? [createModule()])
          setCourse({
            id: data.id ?? data._id?.toString(),
            title: data.title ?? '',
            description: data.description ?? '',
            durationInMonths: data.durationInMonths ?? 0,
            totalSessions: data.totalSessions ?? 0,
            content: parsedContent.length > 0 ? parsedContent : [createModule()],
          })
        })
        .finally(() => setLoading(false))
    }
  }, [courseId, isNew, router])

  const currentLesson = course.content[selectedModule]?.chapters[selectedChapter]?.lessons[selectedLesson]

  const updateLessonContent = useCallback(() => {
    if (!currentLesson) return
    const updated = { ...course }
    const lesson = updated.content[selectedModule].chapters[selectedChapter].lessons[selectedLesson]

    if (contentType === 'text') {
      lesson.content = textContent
    } else if (contentType === 'image' && imagePreview) {
      lesson.content = `![image](${imagePreview})`
    } else if (contentType === 'video' && videoUrl) {
      lesson.content = `<video src="${videoUrl}" controls></video>\n\n${videoUrl}`
    }

    setCourse(updated)
  }, [course, selectedModule, selectedChapter, selectedLesson, contentType, textContent, imagePreview, videoUrl])

  useEffect(() => {
    if (!currentLesson) return
    const content = currentLesson.content
    if (content.startsWith('![image](') && content.endsWith(')')) {
      setContentType('image')
      setImagePreview(content.slice(8, -1))
      setVideoUrl('')
      setTextContent('')
    } else if (content.includes('<video') || content.startsWith('http') && (content.includes('youtube') || content.includes('vimeo') || content.includes('mp4'))) {
      setContentType('video')
      const match = content.match(/src="([^"]+)"/)
      setVideoUrl(match?.[1] ?? content.split('\n\n')[1] ?? content)
      setTextContent('')
      setImagePreview(null)
    } else {
      setContentType('text')
      setTextContent(content)
      setImagePreview(null)
      setVideoUrl('')
    }
  }, [currentLesson])

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-hairline-strong border-t-ink rounded-full animate-spin" />
      </div>
    )
  }

  async function saveCourse() {
    setSaving(true)
    const payload = {
      title: course.title,
      description: course.description,
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
        const data = await res.json()
        if (data.id) router.replace(`/admin/courses/${data.id}`)
      } else {
        await fetch(`/api/admin/courses/${courseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
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
  const currentMod = modules[selectedModule]
  const currentChap = currentMod?.chapters[selectedChapter]
  const currentLess = currentChap?.lessons[selectedLesson]

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
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

      {/* Course metadata bar */}
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
          <div className="flex-1">
            <input type="text" value={course.description} onChange={(e) => updateCourse((prev) => ({ ...prev, description: e.target.value }))} placeholder="Short description..." className="w-full bg-transparent border-none text-body-sm text-mute focus:outline-none placeholder:text-mute/50" />
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-xl py-xxl flex gap-xxl" style={{ minHeight: 'calc(100vh - 180px)' }}>
        {/* Left: Module/Chapter/Lesson tree */}
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
                            <button
                              key={li}
                              onClick={() => { setSelectedModule(mi); setSelectedChapter(ci); setSelectedLesson(li) }}
                              className={cn(
                                'w-full flex items-center gap-2 py-1.5 px-2 text-left text-body-sm hover:bg-surface-soft transition-colors bg-transparent border-none cursor-pointer rounded-none',
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
                                }} className="text-mute hover:text-error bg-transparent border-none cursor-pointer p-0">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </button>
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

        {/* Right: Lesson editor */}
        <div className="flex-1 min-w-0">
          {currentLess ? (
            <div className="border border-hairline bg-canvas">
              {/* Lesson header */}
              <div className="border-b border-hairline bg-surface-soft px-6 py-3 flex items-center gap-4">
                <input
                  type="text"
                  value={currentLess.title}
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
                          currentLess.type === t ? 'bg-primary text-on-primary border-primary' : 'text-mute hover:text-ink'
                        )}
                      >
                        <TIcon className="w-3 h-3" />
                        {lessonTypeLabels[t]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Content type selector */}
              <div className="border-b border-hairline px-6 py-3 flex items-center gap-3 bg-canvas">
                <span className="text-caption text-mute uppercase tracking-[0.1em] font-600">Content:</span>
                {(['text', 'image', 'video'] as const).map((ct) => (
                  <button
                    key={ct}
                    onClick={() => {
                      commitCurrentBlockContent()
                      setContentType(ct)
                    }}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1 text-caption uppercase font-bold border border-hairline rounded-none bg-transparent cursor-pointer transition-colors',
                      contentType === ct ? 'bg-ink text-canvas border-ink' : 'text-mute hover:text-ink'
                    )}
                  >
                    {ct === 'text' ? <FileText className="w-3 h-3" /> : ct === 'image' ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                    {ct}
                  </button>
                ))}
              </div>

              {/* Content editor area */}
              <div className="p-6">
                {contentType === 'text' && (
                  <div>
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      onBlur={() => {
                        const updated = { ...course }
                        if (updated.content[selectedModule]?.chapters[selectedChapter]?.lessons[selectedLesson]) {
                          updated.content[selectedModule].chapters[selectedChapter].lessons[selectedLesson].content = textContent
                          setCourse(updated)
                        }
                      }}
                      placeholder="Write your lesson content here... You can use Markdown formatting:

# Heading 1
## Heading 2
**Bold text**
*Italic text*

- Bullet list
- Another item

1. Numbered list
2. Second item

![alt text](image-url)

> Blockquote

`inline code`

```code block```"
                      className="w-full min-h-[300px] border border-hairline bg-canvas text-ink text-body-md px-4 py-3 focus:outline-none focus:border-ink transition-colors resize-y font-mono leading-relaxed"
                    />
                    <div className="mt-3 border border-hairline p-4 bg-surface-soft">
                      <p className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-2">Preview</p>
                      <div className="prose prose-sm text-ink whitespace-pre-wrap">{textContent}</div>
                    </div>
                  </div>
                )}

                {contentType === 'image' && (
                  <div>
                    <div className="border-2 border-dashed border-hairline-strong p-8 text-center">
                      {imagePreview ? (
                        <div className="relative inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imagePreview} alt="Preview" className="max-w-full max-h-64 object-contain mx-auto" />
                          <button onClick={() => { setImagePreview(null); setImageFile(null) }} className="mt-2 text-caption text-error hover:underline bg-transparent border-none cursor-pointer">Remove</button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setImageFile(file)
                            const b64 = await encodeImageToBase64(file)
                            setImagePreview(b64)
                          }} />
                          <ImageIcon className="w-10 h-10 text-mute mx-auto mb-2" />
                          <p className="text-body-sm text-mute">Click to upload an image</p>
                          <p className="text-caption text-charcoal mt-1">Supports PNG, JPG, GIF, WebP</p>
                        </label>
                      )}
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button variant="primary" size="sm" onClick={() => {
                        const updated = { ...course }
                        const lesson = updated.content[selectedModule]?.chapters[selectedChapter]?.lessons[selectedLesson]
                        if (lesson && imagePreview) {
                          lesson.content = `![image](${imagePreview})`
                          setCourse(updated)
                        }
                      }} disabled={!imagePreview}>Insert Image</Button>
                    </div>
                  </div>
                )}

                {contentType === 'video' && (
                  <div>
                    <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">Video URL</label>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... or https://example.com/video.mp4"
                      className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink transition-colors mb-3"
                    />
                    {videoUrl && (
                      <div className="aspect-video bg-surface-dark flex items-center justify-center mb-3">
                        {videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? (
                          <iframe
                            src={videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        ) : (
                          <video src={videoUrl} controls className="max-w-full max-h-full" />
                        )}
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button variant="primary" size="sm" onClick={() => {
                        const updated = { ...course }
                        const lesson = updated.content[selectedModule]?.chapters[selectedChapter]?.lessons[selectedLesson]
                        if (lesson && videoUrl) {
                          lesson.content = `<video src="${videoUrl}" controls></video>\n\n${videoUrl}`
                          setCourse(updated)
                        }
                      }} disabled={!videoUrl}>Insert Video</Button>
                    </div>
                  </div>
                )}
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

function ImageIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L9 18"/></svg>
}