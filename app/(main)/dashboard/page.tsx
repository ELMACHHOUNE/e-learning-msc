'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Badge, Progress } from '@/components/ui'
import LogoSpinner from '@/components/shared/logo-spinner'
import { Users, BookOpen, Layers, ArrowUpRight, GraduationCap, UserPlus, Shield } from 'lucide-react'

interface DashboardData {
  role: string
  stats: Record<string, number>
  recentUsers?: { id: string; name: string; email: string; role: string }[]
  recentGuilds?: { id: string; name: string; courseTitle: string; instructorName: string; studentCount: number }[]
  guilds?: { id: string; name: string; courseTitle: string; currentSession: number; totalSessions: number; skillsTotal: number; skillsAchieved: number; studentCount?: number; instructorName?: string }[]
}

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const forceStudent = searchParams.get('view') === 'student'
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LogoSpinner />

  if (forceStudent || data?.role === 'student') return <StudentDashboard data={data!} />
  if (data?.role === 'admin') return <AdminDashboard data={data} />
  if (data?.role === 'instructor') return <InstructorDashboard data={data} />
  return <StudentDashboard data={data!} />
}

function AdminDashboard({ data }: { data: DashboardData }) {
  const statCards = [
    { label: 'Total Users', value: data.stats.totalUsers, icon: Users, href: '/admin', color: 'bg-primary' },
    { label: 'Instructors', value: data.stats.totalInstructors, icon: GraduationCap, href: '/admin', color: 'bg-info' },
    { label: 'Students', value: data.stats.totalStudents, icon: Users, href: '/admin', color: 'bg-success' },
    { label: 'Courses', value: data.stats.totalCourses, icon: BookOpen, href: '/admin', color: 'bg-warning' },
    { label: 'Guilds', value: data.stats.totalGuilds, icon: Layers, href: '/admin', color: 'bg-error' },
  ]

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <div>
          <h1 className="text-display-md text-ink font-700 leading-[0.95]">Admin Dashboard</h1>
          <p className="text-body-md text-mute mt-sm">Manage users, courses, and guild assignments</p>
        </div>
        <Badge variant="new">Admin Access</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-lg mb-xxl">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href} className="no-underline">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-canvas border border-hairline p-xl hover:border-ink transition-colors"
              >
                <div className={`w-10 h-10 ${stat.color} text-on-primary flex items-center justify-center mb-md`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-display-lg text-ink font-700 leading-[0.95] mb-xs">{stat.value}</p>
                <p className="text-body-sm text-mute">{stat.label}</p>
              </motion.div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl">
        <section>
          <div className="flex items-center justify-between mb-lg">
            <h2 className="text-heading-sm text-ink font-700">Recent Users</h2>
            <Link href="/admin" className="flex items-center gap-1 text-button-md text-ink underline no-underline">
              Manage Users <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-canvas border border-hairline overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft">
                  <th className="text-left px-lg py-md text-caption text-charcoal font-600">Name</th>
                  <th className="text-left px-lg py-md text-caption text-charcoal font-600">Email</th>
                  <th className="text-right px-lg py-md text-caption text-charcoal font-600">Role</th>
                </tr>
              </thead>
              <tbody>
                {(data.recentUsers ?? []).map((u) => (
                  <tr key={u.id} className="border-b border-hairline hover:bg-surface-soft/50">
                    <td className="px-lg py-md text-body-sm text-ink">{u.name}</td>
                    <td className="px-lg py-md text-body-sm text-mute">{u.email}</td>
                    <td className="px-lg py-md text-right">
                      <Badge variant={u.role === 'admin' ? 'new' : u.role === 'instructor' ? 'info' : 'default'}>{u.role}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-lg">
            <h2 className="text-heading-sm text-ink font-700">Recent Guilds</h2>
            <Link href="/admin" className="flex items-center gap-1 text-button-md text-ink underline no-underline">
              Manage Guilds <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-lg">
            {(data.recentGuilds ?? []).map((g) => (
              <div key={g.id} className="bg-canvas border border-hairline p-xl">
                <h3 className="text-heading-xs text-ink font-700 mb-sm">{g.name}</h3>
                <p className="text-body-sm text-mute">{g.courseTitle} &middot; {g.instructorName} &middot; {g.studentCount} students</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mt-xxl">
        <Link href="/admin" className="no-underline">
          <div className="bg-canvas border border-hairline p-xl flex items-center gap-lg hover:border-ink transition-colors">
            <div className="w-12 h-12 bg-primary text-on-primary flex items-center justify-center shrink-0"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-heading-xs text-ink font-700">User Management</p>
              <p className="text-caption text-mute">Create, edit, and manage all accounts</p>
            </div>
          </div>
        </Link>
        <Link href="/admin" className="no-underline">
          <div className="bg-canvas border border-hairline p-xl flex items-center gap-lg hover:border-ink transition-colors">
            <div className="w-12 h-12 bg-primary text-on-primary flex items-center justify-center shrink-0"><BookOpen className="w-6 h-6" /></div>
            <div>
              <p className="text-heading-xs text-ink font-700">Course Creator</p>
              <p className="text-caption text-mute">Design and manage course content</p>
            </div>
          </div>
        </Link>
        <Link href="/admin" className="no-underline">
          <div className="bg-canvas border border-hairline p-xl flex items-center gap-lg hover:border-ink transition-colors">
            <div className="w-12 h-12 bg-success text-on-primary flex items-center justify-center shrink-0"><Layers className="w-6 h-6" /></div>
            <div>
              <p className="text-heading-xs text-ink font-700">Guild Assignment</p>
              <p className="text-caption text-mute">Assign courses &amp; instructors to guilds</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

function InstructorDashboard({ data }: { data: DashboardData }) {
  const statCards = [
    { label: 'My Guilds', value: data.stats.totalGuilds, icon: Layers },
    { label: 'My Students', value: data.stats.totalStudents, icon: Users },
    { label: 'Total Sessions', value: data.stats.totalSessions, icon: BookOpen },
    { label: 'Courses', value: data.stats.totalCourses, icon: GraduationCap },
  ]

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <div>
          <h1 className="text-display-md text-ink font-700 leading-[0.95]">Instructor Dashboard</h1>
          <p className="text-body-sm text-mute mt-sm">Track your guilds, students, and sessions</p>
        </div>
        <Badge variant="info">Instructor View</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-xxl">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-canvas border border-hairline p-xl">
              <div className="flex items-center justify-between mb-md">
                <Icon className="w-5 h-5 text-mute" />
              </div>
              <p className="text-display-lg text-ink font-700 leading-[0.95] mb-xs">{stat.value}</p>
              <p className="text-body-sm text-mute">{stat.label}</p>
            </motion.div>
          )
        })}
      </div>

      <section>
        <div className="flex items-center justify-between mb-lg">
          <h2 className="text-heading-sm text-ink font-700">My Guilds</h2>
          <Link href="/courses" className="flex items-center gap-1 text-button-md text-ink underline no-underline">
            View Courses <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid gap-lg">
          {(data.guilds ?? []).map((guild, i) => (
            <motion.div key={guild.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-canvas border border-hairline p-xxl">
              <div className="flex items-center justify-between mb-lg">
                <h3 className="text-heading-sm text-ink font-700">{guild.name}</h3>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-body-sm text-mute mb-lg">{guild.courseTitle} &middot; {guild.studentCount} students</p>
              <div className="mb-lg">
                <div className="flex items-center justify-between mb-sm">
                  <span className="text-body-sm text-charcoal">Session {guild.currentSession}/{guild.totalSessions}</span>
                  <span className="text-body-sm text-charcoal">{guild.totalSessions > 0 ? Math.round((guild.currentSession / guild.totalSessions) * 100) : 0}%</span>
                </div>
                <div className="h-2 bg-surface-soft rounded-none"><div className="h-full bg-primary transition-all" style={{ width: `${guild.totalSessions > 0 ? (guild.currentSession / guild.totalSessions) * 100 : 0}%` }} /></div>
              </div>
              {guild.skillsTotal > 0 && (
                <div className="mb-lg">
                  <div className="flex items-center justify-between mb-sm">
                    <span className="text-body-sm text-charcoal">Skills: {guild.skillsAchieved} of {guild.skillsTotal}</span>
                    <span className="text-body-sm text-success">{Math.round((guild.skillsAchieved / guild.skillsTotal) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-surface-soft rounded-none"><div className="h-full bg-success transition-all" style={{ width: `${(guild.skillsAchieved / guild.skillsTotal) * 100}%` }} /></div>
                </div>
              )}
              <Link href={`/courses/${guild.id}`} className="text-button-md text-ink underline no-underline hover:opacity-70 transition-opacity">View Details</Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}

function StudentDashboard({ data }: { data: DashboardData }) {
  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <div>
          <h1 className="text-display-md text-ink font-700 leading-[0.95]">My Dashboard</h1>
          <p className="text-body-sm text-mute mt-sm">Track your progress and guilds</p>
        </div>
        <Badge variant="default">Student View</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mb-xxl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="bg-canvas border border-hairline p-xl">
          <p className="text-display-lg text-ink font-700 leading-[0.95] mb-xs">{data.stats.totalGuilds}</p>
          <p className="text-body-sm text-mute">My Guilds</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-canvas border border-hairline p-xl">
          <p className="text-display-lg text-ink font-700 leading-[0.95] mb-xs">{data.stats.totalCourses}</p>
          <p className="text-body-sm text-mute">Active Courses</p>
        </motion.div>
      </div>

      <section>
        <h2 className="text-heading-sm text-ink font-700 mb-lg">My Guilds</h2>
        <div className="grid gap-lg">
          {(data.guilds ?? []).map((guild, i) => (
            <motion.div key={guild.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-canvas border border-hairline p-xxl">
              <h3 className="font-heading-sm text-ink font-700 mb-sm">{guild.name}</h3>
              <p className="text-body-sm text-mute mb-sm">{guild.courseTitle} &middot; {guild.instructorName}</p>
              <div className="mb-lg">
                <div className="flex items-center justify-between mb-sm">
                  <span className="text-body-sm text-charcoal">Session {guild.currentSession}/{guild.totalSessions}</span>
                  <span className="text-body-sm text-charcoal">{guild.totalSessions > 0 ? Math.round((guild.currentSession / guild.totalSessions) * 100) : 0}%</span>
                </div>
                <div className="h-2 bg-surface-soft rounded-none"><div className="h-full bg-primary transition-all" style={{ width: `${guild.totalSessions > 0 ? (guild.currentSession / guild.totalSessions) * 100 : 0}%` }} /></div>
              </div>
              {guild.skillsTotal > 0 && (
                <div className="mb-lg">
                  <div className="flex items-center justify-between mb-sm">
                    <span className="text-body-sm text-charcoal">Skills: {guild.skillsAchieved} of {guild.skillsTotal}</span>
                    <span className="text-body-sm text-success">{Math.round((guild.skillsAchieved / guild.skillsTotal) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-surface-soft rounded-none"><div className="h-full bg-success transition-all" style={{ width: `${(guild.skillsAchieved / guild.skillsTotal) * 100}%` }} /></div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}