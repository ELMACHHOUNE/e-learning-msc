'use client'

import { useState } from 'react'
import { ChevronDown, Search, CheckCircle, FileText, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface LessonNode {
  title: string
  type: 'lesson' | 'checkpoint' | 'workshop'
  completed?: boolean
}

interface ChapterNode {
  title: string
  lessons: LessonNode[]
}

interface ModuleNode {
  title: string
  chapters: ChapterNode[]
}

interface SidebarNavigationProps {
  modules?: ModuleNode[]
  courseId?: string
}

const defaultModules: ModuleNode[] = [
  {
    title: 'Introduction to Problem Solving',
    chapters: [
      {
        title: 'Chapter 1: Foundations',
        lessons: [
          { title: 'What is Problem Solving?', type: 'lesson' },
          { title: 'Algorithmic Thinking', type: 'lesson' },
          { title: 'Checkpoint 1', type: 'checkpoint', completed: true },
        ],
      },
    ],
  },
  {
    title: 'Practical Software Engineering',
    chapters: [
      {
        title: 'Chapter 1: SDLC',
        lessons: [
          { title: 'Waterfall vs Agile', type: 'lesson' },
          { title: 'Scrum Fundamentals', type: 'lesson' },
        ],
      },
    ],
  },
  {
    title: 'Front End UI UX Development',
    chapters: [
      {
        title: 'Chapter 1: Design Principles',
        lessons: [
          { title: 'Color Theory', type: 'lesson' },
          { title: 'Typography Basics', type: 'lesson' },
        ],
      },
    ],
  },
]

const typeIcons = {
  lesson: FileText,
  checkpoint: CheckCircle,
  workshop: Video,
}

export function SidebarNavigation({ modules = defaultModules }: SidebarNavigationProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>([modules[0]?.title])
  const [expandedChapters, setExpandedChapters] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const toggleModule = (title: string) => {
    setExpandedModules((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    )
  }

  const toggleChapter = (title: string) => {
    setExpandedChapters((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    )
  }

  return (
    <div className="w-72 border-r border-hairline h-full flex flex-col bg-canvas">
      <div className="p-lg border-b border-hairline">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SuperSkill name..."
            className="w-full h-10 pl-10 pr-md bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {modules.map((mod) => {
          const isModOpen = expandedModules.includes(mod.title)
          return (
            <div key={mod.title} className="border-b border-hairline">
              <button
                onClick={() => toggleModule(mod.title)}
                className="w-full flex items-center justify-between px-lg py-md text-body-sm text-ink font-600 hover:bg-surface-soft transition-colors bg-transparent border-none cursor-pointer"
              >
                {mod.title}
                <ChevronDown
                  className={cn('w-4 h-4 transition-transform', isModOpen && 'rotate-180')}
                />
              </button>
              <AnimatePresence>
                {isModOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {mod.chapters.map((ch) => {
                      const isChOpen = expandedChapters.includes(ch.title)
                      return (
                        <div key={ch.title}>
                          <button
                            onClick={() => toggleChapter(ch.title)}
                            className="w-full flex items-center justify-between pl-xl pr-lg py-sm text-caption text-charcoal hover:bg-surface-soft bg-transparent border-none cursor-pointer"
                          >
                            {ch.title}
                            <ChevronDown
                              className={cn('w-3 h-3 transition-transform', isChOpen && 'rotate-180')}
                            />
                          </button>
                          <AnimatePresence>
                            {isChOpen && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                {ch.lessons.map((lesson) => {
                                  const Icon = typeIcons[lesson.type]
                                  return (
                                    <button
                                      key={lesson.title}
                                      className="w-full flex items-center gap-md pl-xxl pr-lg py-xs text-caption text-mute hover:text-charcoal hover:bg-surface-soft bg-transparent border-none cursor-pointer text-left"
                                    >
                                      <Icon className="w-3 h-3 shrink-0" />
                                      <span className={cn(lesson.completed && 'text-success line-through')}>
                                        {lesson.title}
                                      </span>
                                    </button>
                                  )
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
