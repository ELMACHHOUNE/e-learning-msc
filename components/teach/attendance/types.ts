export type AttendanceStatus = 'present' | 'absent' | 'late'

export interface SessionRecord {
  studentId: string
  status: AttendanceStatus
}

export interface SessionDTO {
  id: string
  guildId: string
  sessionNumber: number
  title: string
  date: string
  link: string
  records: SessionRecord[]
  hasAttendance: boolean
  myStatus?: AttendanceStatus | null
}

export interface GuildSummary {
  id: string
  name: string
  courseId: string
  courseTitle: string
  instructorName?: string
  totalSessions: number
  currentSession: number
  studentCount: number
}

export interface RosterStudent {
  id: string
  name: string
  avatar?: string
}

export type SessionFormValues = {
  guildId: string
  sessionNumber: number | string
  title: string
  date: string
  time: string
  link: string
}

export function toDayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatSessionTime(date: string): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

export function formatSessionFull(date: string): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const day = toDayKey(d)
  const today = toDayKey(new Date())
  if (day === today) return 'Today'
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (day === toDayKey(tomorrow)) return 'Tomorrow'
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d)
}