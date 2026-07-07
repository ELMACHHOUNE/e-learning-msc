'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button, Input, Badge, Avatar } from '@/components/ui'
import { Search, Plus, Users, BookOpen, Layers } from 'lucide-react'

type Tab = 'users' | 'courses' | 'guilds'

const mockUsers = [
  { id: '1', name: 'John Admin', email: 'john@example.com', role: 'admin' as const, status: 'active' as const },
  { id: '2', name: 'Sarah Instructor', email: 'sarah@example.com', role: 'instructor' as const, status: 'active' as const },
  { id: '3', name: 'Mike Student', email: 'mike@example.com', role: 'student' as const, status: 'active' as const },
  { id: '4', name: 'Lisa Student', email: 'lisa@example.com', role: 'student' as const, status: 'inactive' as const },
]

const mockCourses = [
  { id: '1', title: '15-Month Software Engineering', duration: 15, sessions: 194, modules: 12 },
  { id: '2', title: 'Data Science Bootcamp', duration: 12, sessions: 150, modules: 10 },
  { id: '3', title: 'UI/UX Design Masterclass', duration: 6, sessions: 72, modules: 8 },
]

const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'courses', label: 'Course Creator', icon: BookOpen },
  { id: 'guilds', label: 'Guild Assignment', icon: Layers },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [searchQuery, setSearchQuery] = useState('')

  const TabIcon = tabs.find((t) => t.id === activeTab)?.icon

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <h1 className="text-display-md text-ink font-700 leading-[0.95]">Admin Portal</h1>
        <Badge variant="new">Admin Access</Badge>
      </div>

      <div className="flex gap-lg mb-xxl border-b border-hairline">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-lg py-md text-button-md bg-transparent border-none cursor-pointer transition-colors ${
                isActive
                  ? 'text-ink border-b-2 border-ink -mb-px'
                  : 'text-mute hover:text-charcoal'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-lg">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full h-10 pl-10 pr-md bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none"
              />
            </div>
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add User
            </Button>
          </div>

          <div className="bg-canvas border border-hairline overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft">
                  <th className="text-left px-lg py-md text-caption text-charcoal font-600">User</th>
                  <th className="text-left px-lg py-md text-caption text-charcoal font-600">Email</th>
                  <th className="text-left px-lg py-md text-caption text-charcoal font-600">Role</th>
                  <th className="text-left px-lg py-md text-caption text-charcoal font-600">Status</th>
                  <th className="text-right px-lg py-md text-caption text-charcoal font-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((user) => (
                  <tr key={user.id} className="border-b border-hairline hover:bg-surface-soft/50">
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-md">
                        <Avatar name={user.name} size="sm" />
                        <span className="text-body-sm text-ink">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-lg py-md text-body-sm text-mute">{user.email}</td>
                    <td className="px-lg py-md">
                      <Badge variant={user.role === 'admin' ? 'new' : user.role === 'instructor' ? 'info' : 'default'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-lg py-md">
                      <span className={`inline-flex items-center gap-1 text-caption ${user.status === 'active' ? 'text-success' : 'text-error'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-success' : 'bg-error'}`} />
                        {user.status}
                      </span>
                    </td>
                    <td className="px-lg py-md text-right">
                      <Button variant="outline-dark" size="sm">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'courses' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-lg">
            <h2 className="text-heading-sm text-ink font-700">All Courses</h2>
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Create Course
            </Button>
          </div>
          <div className="grid gap-lg">
            {mockCourses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-canvas border border-hairline p-xxl flex items-center justify-between"
              >
                <div>
                  <h3 className="text-heading-sm text-ink font-700">{course.title}</h3>
                  <p className="text-body-sm text-mute mt-xs">
                    {course.duration} months &middot; {course.sessions} sessions &middot; {course.modules} modules
                  </p>
                </div>
                <Button variant="outline-dark" size="sm">Edit</Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'guilds' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-lg">
            <h2 className="text-heading-sm text-ink font-700">Guild Assignment</h2>
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Create Guild
            </Button>
          </div>
          <div className="bg-canvas border border-hairline p-xxl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-xxl">
              <div className="lg:col-span-1 border-r border-hairline pr-xxl">
                <h3 className="text-body-sm text-ink font-600 mb-lg">Available Students</h3>
                <div className="space-y-3">
                  {['Alice Johnson', 'Bob Smith', 'Carol White', 'David Brown'].map((name) => (
                    <div key={name} className="flex items-center gap-md p-md bg-surface-soft cursor-move">
                      <Avatar name={name} size="sm" />
                      <span className="text-body-sm text-ink">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2">
                <h3 className="text-body-sm text-ink font-600 mb-lg">Guild: Achilles Vengeance</h3>
                <div className="border-2 border-dashed border-hairline-strong p-xxl min-h-[200px] flex flex-wrap gap-md content-start">
                  {['Eve Davis', 'Frank Miller'].map((name) => (
                    <div key={name} className="flex items-center gap-md p-md bg-primary/10">
                      <Avatar name={name} size="sm" />
                      <span className="text-body-sm text-ink">{name}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-center w-full h-20 text-body-sm text-mute">
                    Drag & drop students here
                  </div>
                </div>
                <div className="mt-lg flex justify-end gap-md">
                  <Button variant="outline-dark">Assign Course</Button>
                  <Button variant="primary">Save Guild</Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
