export type Role = 'admin' | 'instructor' | 'student'
export type AttendanceStatus = 'present' | 'absent' | 'late'

export interface IUser {
  _id: string
  name: string
  email: string
  phone?: string
  password?: string
  avatar?: string
  role: Role
  createdAt: Date | string
}

export interface ICourse {
  _id: string
  title: string
  description: string
  coverImage?: string
  price?: number
  active?: boolean
  durationInMonths: number
  totalSessions: number
  content: IModule[]
  createdAt: Date | string
}

export interface IModule {
  title: string
  chapters: IChapter[]
}

export interface IChapter {
  title: string
  lessons: ILesson[]
}

export interface ILesson {
  title: string
  content: string
  type: 'lesson' | 'checkpoint' | 'workshop'
}

export interface IGuild {
  _id: string
  name: string
  courseId: string
  instructorId: string
  studentIds: string[]
  currentSession: number
  skillsTotal: number
  skillsAchieved: number
  createdAt: Date | string
}

export interface IAttendanceRecord {
  studentId: string
  status: AttendanceStatus
}

export interface ISessionLog {
  _id: string
  guildId: string
  sessionNumber: number
  date: Date | string
  records: IAttendanceRecord[]
}
