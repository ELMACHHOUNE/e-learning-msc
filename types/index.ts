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

export type Category = string

export interface ICategory {
  _id: string
  name: string
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
  category?: Category
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

export interface IMessage {
  _id: string
  name: string
  email: string
  userId?: string
  message: string
  isAdmin?: boolean
  read?: boolean
  createdAt: Date | string
}

export type LabPhaseStatus = 'pending' | 'approved' | 'rejected'

export interface ILabPhase {
  _id: string
  title: string
  description: string
  instructions: string
  duration: string
  image?: string
  category?: Category
  status: LabPhaseStatus
  createdBy: string
  rejectionReason?: string
  createdAt: Date | string
}

export type ProjectStep = 'presentation' | 'gitRepo' | 'deployment'

export interface IStepValidation {
  url: string
  score?: number
  validated: boolean
}

export type ProjectStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected'

export interface IProjectApplication {
  _id: string
  studentId: string
  labPhaseId: string
  guildId?: string
  status: ProjectStatus
  presentation: IStepValidation
  gitRepo: IStepValidation
  deployment: IStepValidation
  finalGrade?: number
  createdAt: Date | string
}
