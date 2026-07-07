'use client'

import { motion } from 'framer-motion'
import { Progress, Badge, Avatar } from '@/components/ui'
import { ArrowUpRight, Target, Calendar } from 'lucide-react'

const metrics = [
  { label: 'Performance Score', value: '88/100', change: '+12%' },
  { label: 'Graduated Students', value: '1,247', change: '+8.2%' },
  { label: 'Active Students', value: '3,841', change: '+5.4%' },
  { label: 'Managed Guilds', value: '7', change: '+2' },
  { label: 'Attendance Rate', value: '94.2%', change: '+1.3%' },
]

const students = [
  { name: 'Alice Johnson', program: 'Software Engineering', progress: 100, status: 'green' as const },
  { name: 'Bob Smith', program: 'Data Science', progress: 72, status: 'blue' as const },
  { name: 'Carol White', program: 'Software Engineering', progress: 45, status: 'orange' as const },
  { name: 'David Brown', program: 'UI/UX Design', progress: 28, status: 'red' as const },
  { name: 'Eve Davis', program: 'Data Science', progress: 91, status: 'green' as const },
]

const statusColors = {
  green: 'bg-success',
  blue: 'bg-info',
  orange: 'bg-warning',
  red: 'bg-error',
}

export default function DashboardPage() {
  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <h1 className="text-display-md text-ink font-700 leading-[0.95]">Dashboard</h1>
        <Badge variant="new">Instructor View</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-lg mb-xxl">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-canvas border border-hairline p-xl"
          >
            <p className="text-body-sm text-mute mb-sm">{metric.label}</p>
            <p className="text-display-lg text-ink font-700 leading-[0.95] mb-xs">{metric.value}</p>
            <p className="text-caption text-success">{metric.change} this month</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xxl">
        <div className="lg:col-span-2 space-y-xxl">
          <section>
            <h2 className="text-heading-md text-ink font-700 mb-lg">Active Programs</h2>
            <div className="bg-canvas border border-hairline p-xxl">
              <div className="flex items-start justify-between mb-lg">
                <div>
                  <h3 className="text-heading-sm text-ink font-700">15-Month Software Engineering Program</h3>
                  <p className="text-body-sm text-mute mt-xs">Full-stack development track</p>
                </div>
                <button className="flex items-center gap-1 text-button-md text-ink underline bg-transparent border-none cursor-pointer">
                  Track Details <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-lg">
                <div>
                  <p className="text-display-md text-ink font-700">3</p>
                  <p className="text-caption text-mute">Active Guilds</p>
                </div>
                <div>
                  <p className="text-display-md text-ink font-700">128</p>
                  <p className="text-caption text-mute">Students Trained</p>
                </div>
                <div>
                  <p className="text-display-md text-ink font-700">94%</p>
                  <p className="text-caption text-mute">Completion Rate</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-heading-md text-ink font-700 mb-lg">Live Cohort Tracker</h2>
            <div className="bg-canvas border border-hairline p-xxl">
              <div className="flex items-center justify-between mb-lg">
                <h3 className="text-heading-sm text-ink font-700">Achilles Vengeance</h3>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="mb-lg">
                <div className="flex items-center justify-between mb-sm">
                  <span className="text-body-sm text-charcoal">Session 54/194</span>
                  <span className="text-body-sm text-charcoal">27.8%</span>
                </div>
                <Progress value={54} max={194} />
              </div>
              <div className="mb-lg">
                <div className="flex items-center justify-between mb-sm">
                  <span className="text-body-sm text-charcoal">Skills: 5,583 of 9,210</span>
                  <span className="text-body-sm text-charcoal">60.6%</span>
                </div>
                <Progress value={5583} max={9210} barClassName="bg-success" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Avatar key={i} name={`Student ${i}`} size="sm" />
                  ))}
                  <div className="w-8 h-8 rounded-full bg-surface-soft text-caption text-charcoal flex items-center justify-center font-600">+12</div>
                </div>
                <span className="text-heading-sm text-success font-700">60%</span>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-xxl">
          <div className="bg-canvas border border-hairline p-xxl">
            <h3 className="text-heading-sm text-ink font-700 mb-lg">Session Scheduler</h3>
            <div className="flex items-center gap-lg mb-lg">
              <div className="w-12 h-12 bg-primary text-on-primary flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-body-sm text-ink font-600">Today at 2:00 PM</p>
                <p className="text-caption text-mute">Software Engineering - Module 3</p>
              </div>
            </div>
            <button className="w-full bg-primary text-on-primary text-button-md h-12 rounded-xs font-700 hover:bg-primary-deep transition-colors border-none cursor-pointer">
              Join Session
            </button>
          </div>

          <div className="bg-canvas border border-hairline p-xxl">
            <h3 className="text-heading-sm text-ink font-700 mb-lg">Tasks Board</h3>
            <div className="flex flex-col items-center justify-center py-xxl text-center">
              <Target className="w-12 h-12 text-stone mb-md" />
              <p className="text-body-sm text-mute">No tasks yet</p>
              <p className="text-caption text-ash">Create your first task to get started</p>
            </div>
          </div>

          <div className="bg-canvas border border-hairline p-xxl">
            <h3 className="text-heading-sm text-ink font-700 mb-lg">My Students</h3>
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.name} className="flex items-center gap-md">
                  <Avatar name={student.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm text-ink truncate">{student.name}</p>
                    <p className="text-caption text-mute truncate">{student.program}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${statusColors[student.status]}`} />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
