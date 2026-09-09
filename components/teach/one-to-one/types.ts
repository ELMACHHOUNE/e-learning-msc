import type { OneToOneStatus } from '@/types'

export type OneToOneDTO = {
  id: string
  guildId: string
  instructorId: string
  instructorName: string
  studentId: string | null
  studentName: string | null
  title: string
  date: string
  duration: number
  status: OneToOneStatus
}

export type GuildBrief = {
  id: string
  name: string
  courseTitle: string
  studentCount?: number
  instructorId?: string
  instructorName?: string
}

export function formatSlotDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso))
}

export function formatSlotTime(iso: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

export function formatSlotDuration(duration: number) {
  if (duration >= 60) {
    const h = (duration / 60).toFixed(duration % 60 === 0 ? 0 : 1)
    return `${h}h`
  }
  return `${duration}m`
}