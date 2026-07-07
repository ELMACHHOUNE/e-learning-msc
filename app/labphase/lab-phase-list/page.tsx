'use client'

import { motion } from 'framer-motion'
import { Button, Badge, Progress } from '@/components/ui'
import { FlaskConical, ArrowRight } from 'lucide-react'

const labPhases = [
  { id: '1', title: 'Phase 1: Foundations', description: 'HTML, CSS, JavaScript basics', duration: '4 weeks', progress: 100, status: 'completed' as const },
  { id: '2', title: 'Phase 2: Frontend Development', description: 'React, State Management, Routing', duration: '6 weeks', progress: 72, status: 'in-progress' as const },
  { id: '3', title: 'Phase 3: Backend Development', description: 'Node.js, Express, Databases', duration: '6 weeks', progress: 0, status: 'upcoming' as const },
  { id: '4', title: 'Phase 4: Full-Stack Project', description: 'Capstone project with full CI/CD', duration: '8 weeks', progress: 0, status: 'upcoming' as const },
]

const statusConfig = {
  completed: { variant: 'success' as const, label: 'Completed' },
  'in-progress': { variant: 'info' as const, label: 'In Progress' },
  upcoming: { variant: 'default' as const, label: 'Upcoming' },
}

export default function LabPhaseListPage() {
  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <h1 className="text-display-md text-ink font-700 leading-[0.95]">Lab Phase List</h1>
      </div>

      <div className="grid gap-lg">
        {labPhases.map((phase, i) => {
          const config = statusConfig[phase.status]
          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-canvas border border-hairline p-xxl"
            >
              <div className="flex items-start justify-between mb-lg">
                <div className="flex items-start gap-lg">
                  <div className="w-12 h-12 bg-surface-soft flex items-center justify-center shrink-0">
                    <FlaskConical className="w-6 h-6 text-charcoal" />
                  </div>
                  <div>
                    <div className="flex items-center gap-md mb-xs">
                      <h2 className="text-heading-sm text-ink font-700">{phase.title}</h2>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                    <p className="text-body-sm text-mute">{phase.description}</p>
                    <p className="text-caption text-charcoal mt-xs">{phase.duration}</p>
                  </div>
                </div>
                <Button variant="outline-dark" size="sm">
                  View Details <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <Progress value={phase.progress} showLabel />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
