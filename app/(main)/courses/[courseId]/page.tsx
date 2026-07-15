'use client'

import { useState } from 'react'
import { SidebarNavigation } from '@/components/shared/sidebar-navigation'
import { Badge } from '@/components/ui'
import { BookOpen, FileText, ChevronLeft, ChevronRight } from 'lucide-react'

type ContentTab = 'courses' | 'assessment' | 'resources'

export default function CourseDetailPage() {
  const [activeTab, setActiveTab] = useState<ContentTab>('courses')

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <SidebarNavigation />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-4 px-xxl py-lg border-b border-hairline bg-canvas">
          {[
            { id: 'courses' as const, label: 'Courses', icon: BookOpen },
            { id: 'assessment' as const, label: 'Assessment', icon: FileText },
            { id: 'resources' as const, label: 'These Resources Can Help You', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-lg py-sm text-button-sm bg-transparent border-none cursor-pointer transition-colors rounded-pill ${
                  isActive ? 'bg-surface-dark text-on-dark' : 'text-charcoal hover:text-ink'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-xxl py-xxl">
          <div className="max-w-3xl mx-auto">
            <Badge variant="new" className="mb-lg">Module 1</Badge>
            <h1 className="text-display-lg text-ink font-700 leading-[0.95] mb-lg">
              Introduction to Problem Solving
            </h1>

            <div className="prose prose-sm max-w-none">
              <p className="text-body-lg text-body leading-relaxed mb-lg">
                Welcome to the first module of your software engineering journey. In this module,
                we will explore the fundamental concepts of problem-solving and algorithmic
                thinking that form the bedrock of all software development.
              </p>

              <h2 className="text-heading-md text-ink font-700 mt-xxl mb-md">What is Problem Solving?</h2>
              <p className="text-body-md text-body mb-lg">
                Problem solving is the process of identifying a problem, developing a strategy
                to address it, and implementing that strategy effectively. In software engineering,
                this translates to understanding requirements, designing solutions, and writing code.
              </p>

              <div className="bg-primary/10 border-l-4 border-primary p-lg mb-lg">
                <p className="text-body-md text-ink font-600">Key Insight</p>
                <p className="text-body-sm text-body mt-xs">
                  The best engineers don&rsquo;t just write code — they solve problems. Focus on
                  understanding the problem before jumping to implementation.
                </p>
              </div>

              <h2 className="text-heading-md text-ink font-700 mt-xxl mb-md">Algorithmic Thinking</h2>
              <p className="text-body-md text-body mb-lg">
                Algorithms are step-by-step procedures for solving problems. Developing strong
                algorithmic thinking means you can break down complex problems into manageable
                steps and express them clearly.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-xxl py-lg border-t border-hairline bg-canvas">
          <button className="flex items-center gap-2 text-button-md text-mute hover:text-ink bg-transparent border-none cursor-pointer transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <button className="flex items-center gap-2 text-button-md text-ink bg-transparent border-none cursor-pointer hover:underline">
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
