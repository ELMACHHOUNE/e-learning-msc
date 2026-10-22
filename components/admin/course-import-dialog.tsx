'use client'

import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  X, FileUp, FileText, BookOpen, CheckSquare, Wrench, ListTree,
  Sparkles, ChevronDown, CircleAlert, CircleCheckBig, Trash2,
} from 'lucide-react'
import {
  parseCourseMarkdown,
  COURSE_MARKDOWN_TEMPLATE,
  type ParsedCourseMarkdown,
  type CourseLessonType,
} from '@/lib/course-markdown'

export interface CourseImportOptions {
  applyMeta: boolean
  replace: boolean
}

interface CourseImportDialogProps {
  open: boolean
  onClose: () => void
  onImport: (result: ParsedCourseMarkdown, options: CourseImportOptions) => void
  hasContent: boolean
}

const lessonTypeIcons: Record<CourseLessonType, typeof FileText> = {
  lesson: FileText,
  checkpoint: CheckSquare,
  workshop: Wrench,
}

const lessonTypeColors: Record<CourseLessonType, string> = {
  lesson: 'text-mute',
  checkpoint: 'text-warning',
  workshop: 'text-info',
}

function countContent(result: ParsedCourseMarkdown) {
  let chapters = 0
  let lessons = 0
  for (const mod of result.modules) {
    chapters += mod.chapters.length
    for (const chapter of mod.chapters) lessons += chapter.lessons.length
  }
  return { modules: result.modules.length, chapters, lessons }
}

export default function CourseImportDialog({ open, onClose, onImport, hasContent }: CourseImportDialogProps) {
  const [mounted, setMounted] = useState(false)
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [dragging, setDragging] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [mode, setMode] = useState<'replace' | 'append'>('replace')
  const [applyMeta, setApplyMeta] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const parsed = useMemo(() => (text.trim() ? parseCourseMarkdown(text) : null), [text])
  const counts = parsed ? countContent(parsed) : null

  const metaEntries = parsed
    ? ([
        ['Title', parsed.title],
        ['Description', parsed.description],
        ['Category', parsed.category],
        ['Duration', parsed.durationInMonths != null ? `${parsed.durationInMonths} months` : undefined],
        ['Sessions', parsed.totalSessions != null ? String(parsed.totalSessions) : undefined],
        ['Price', parsed.price != null ? `${parsed.price} MAD` : undefined],
      ].filter(([, value]) => value) as [string, string][])
    : []
  const hasMeta = metaEntries.length > 0

  function readFile(file: File) {
    setFileName(file.name)
    file.text().then(setText).catch(() => setText(''))
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) readFile(file)
  }

  function reset() {
    setText('')
    setFileName('')
    setDragging(false)
    setMode('replace')
    setApplyMeta(true)
  }

  function handleClose() {
    onClose()
  }

  function handleImport() {
    if (!parsed || counts?.modules === 0) return
    onImport(parsed, {
      applyMeta: hasMeta && applyMeta,
      replace: !hasContent || mode === 'replace',
    })
    reset()
    onClose()
  }

  if (!mounted || typeof document === 'undefined' || !open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/50 grid place-items-center px-4 py-8"
      onClick={handleClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="bg-canvas border border-hairline shadow-[0_20px_60px_rgba(0,0,0,0.25)] w-full flex flex-col"
        style={{ maxWidth: '68rem', maxHeight: '90vh' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-surface-soft">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 flex items-center justify-center border border-hairline-strong bg-canvas">
              <FileUp className="w-4 h-4 text-ink" />
            </div>
            <div className="min-w-0">
              <h2 className="text-heading-sm text-ink font-bold uppercase">Import Course from Markdown</h2>
              <p className="text-caption text-mute mt-0.5">
                Turn a Markdown outline into modules, chapters and lessons automatically.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-mute hover:text-ink bg-transparent border-none cursor-pointer p-1 shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden flex-1">
          <div className="border-b md:border-b-0 md:border-r border-hairline flex flex-col overflow-hidden">
            <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
              <button
                onClick={() => setShowGuide((value) => !value)}
                className="flex items-center justify-between text-caption text-mute uppercase tracking-[0.1em] font-bold bg-transparent border-none cursor-pointer p-0 w-full"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-ink" /> Format guide
                </span>
                <ChevronDown className={cn('w-4 h-4 transition-transform', showGuide && 'rotate-180')} />
              </button>

              {showGuide && (
                <div className="border border-hairline bg-surface-soft p-3 space-y-2">
                  <p className="text-body-sm text-charcoal">
                    Use <span className="font-700">#</span> for modules, <span className="font-700">##</span> for
                    chapters and <span className="font-700">###</span> for lessons. Add optional frontmatter for
                    course details. Titles containing <span className="font-700">quiz</span> or{' '}
                    <span className="font-700">checkpoint</span> become checkpoints;{' '}
                    <span className="font-700">workshop</span> or <span className="font-700">lab</span> become
                    workshops.
                  </p>
                  <Button
                    variant="outline-dark"
                    size="sm"
                    onClick={() => { setText(COURSE_MARKDOWN_TEMPLATE); setFileName('sample-course.md') }}
                  >
                    <ListTree className="w-3.5 h-3.5 mr-1" /> Load sample
                  </Button>
                </div>
              )}

              <div
                onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer py-8 transition-colors',
                  dragging ? 'border-ink bg-surface-soft' : 'border-hairline-strong bg-canvas hover:bg-surface-soft',
                )}
              >
                <FileUp className="w-8 h-8 text-mute" />
                <p className="text-body-sm text-mute">
                  {fileName ? fileName : 'Drag & drop or click to upload a .md file'}
                </p>
                <p className="text-caption text-charcoal">Markdown · .md, .markdown, .txt</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".md,.markdown,.txt,text/markdown,text/plain"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) readFile(file)
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-hairline" />
                <span className="text-caption text-ash uppercase tracking-[0.1em]">or paste markdown</span>
                <div className="flex-1 h-px bg-hairline" />
              </div>

              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="# Module 1&#10;## Chapter 1&#10;### Lesson: Getting started&#10;..."
                spellCheck={false}
                className="w-full border border-hairline bg-canvas text-ink text-body-sm px-3 py-2 rounded-none focus:outline-none focus:border-ink resize-vertical min-h-[180px] font-mono"
              />

              {text && (
                <button
                  onClick={reset}
                  className="self-start flex items-center gap-1 text-caption text-mute hover:text-error bg-transparent border-none cursor-pointer uppercase tracking-[0.1em]"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col overflow-hidden">
            <div className="p-4 border-b border-hairline bg-surface-soft flex items-center justify-between">
              <h3 className="text-caption text-ink font-bold uppercase tracking-[0.1em]">Preview</h3>
              {counts && (
                <span className="text-caption text-mute">
                  {counts.modules} modules · {counts.chapters} chapters · {counts.lessons} lessons
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!parsed ? (
                <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center gap-2">
                  <FileText className="w-10 h-10 text-mute" />
                  <p className="text-body-sm text-mute">Upload or paste a Markdown file to see the parsed structure.</p>
                </div>
              ) : (
                <>
                  {hasMeta && (
                    <div className="border border-hairline">
                      <div className="px-3 py-2 border-b border-hairline bg-surface-soft text-caption uppercase tracking-[0.1em] font-bold text-ink">
                        Course details
                      </div>
                      <dl className="divide-y divide-hairline">
                        {metaEntries.map(([label, value]) => (
                          <div key={label} className="grid grid-cols-[110px_1fr] gap-2 px-3 py-1.5">
                            <dt className="text-caption text-mute uppercase tracking-[0.1em]">{label}</dt>
                            <dd className="text-body-sm text-ink break-words">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  <div className="space-y-3">
                    {parsed.modules.map((mod, mi) => (
                      <div key={mod.id} className="border border-hairline">
                        <div className="flex items-center gap-2 px-3 py-2 bg-surface-soft border-b border-hairline">
                          <BookOpen className="w-4 h-4 text-ink shrink-0" />
                          <span className="text-body-sm text-ink font-700">
                            {mi + 1}. {mod.title}
                          </span>
                        </div>
                        <div className="p-3 space-y-2">
                          {mod.chapters.map((chapter, ci) => (
                            <div key={chapter.id} className="border-l border-hairline pl-3">
                              <div className="flex items-center gap-2 py-1">
                                <span className="text-caption text-charcoal font-600">
                                  {mi + 1}.{ci + 1} {chapter.title}
                                </span>
                              </div>
                              <div className="ml-2 border-l border-hairline pl-3 space-y-0.5">
                                {chapter.lessons.map((lesson) => {
                                  const Icon = lessonTypeIcons[lesson.type]
                                  return (
                                    <div key={lesson.id} className="flex items-center gap-2 py-0.5">
                                      <Icon className={cn('w-3 h-3 shrink-0', lessonTypeColors[lesson.type])} />
                                      <span className="text-body-sm text-charcoal truncate">{lesson.title}</span>
                                      {lesson.type !== 'lesson' && (
                                        <span className="text-caption text-mute uppercase">{lesson.type}</span>
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
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-hairline px-6 py-4 flex flex-col gap-3">
          {parsed && hasMeta && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={applyMeta}
                onChange={(event) => setApplyMeta(event.target.checked)}
                className="w-4 h-4 accent-ink cursor-pointer"
              />
              <span className="text-body-sm text-charcoal">
                Apply course details from the file (title, description, duration, sessions, price, category)
              </span>
            </label>
          )}

          {parsed && hasContent && (
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="import-mode"
                  checked={mode === 'replace'}
                  onChange={() => setMode('replace')}
                  className="accent-ink cursor-pointer"
                />
                <span className="text-body-sm text-charcoal">Replace existing content</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="import-mode"
                  checked={mode === 'append'}
                  onChange={() => setMode('append')}
                  className="accent-ink cursor-pointer"
                />
                <span className="text-body-sm text-charcoal">Append to existing content</span>
              </label>
            </div>
          )}

          {parsed && counts && counts.modules > 0 && counts.lessons === 0 && (
            <p className="flex items-center gap-2 text-caption text-warning">
              <CircleAlert className="w-3.5 h-3.5" /> No lessons were detected. Check your headings.
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-caption text-mute min-w-0">
              {parsed && counts && counts.modules > 0 && (
                <span className="flex items-center gap-2">
                  <CircleCheckBig className="w-3.5 h-3.5 text-success shrink-0" />
                  Ready to import {counts.modules} modules and {counts.lessons} lessons.
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleClose}
                className="border border-hairline-strong bg-canvas text-ink text-button-sm font-bold uppercase px-4 py-2 cursor-pointer hover:bg-surface-soft transition-colors"
              >
                Cancel
              </button>
              <Button variant="primary" size="sm" onClick={handleImport} disabled={!parsed || counts?.modules === 0}>
                <FileUp className="w-4 h-4 mr-1" /> Import Course
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
