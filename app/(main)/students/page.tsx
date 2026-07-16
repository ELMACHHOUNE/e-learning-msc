'use client'

import { useState, useEffect, useRef } from 'react'
import LogoSpinner from '@/components/shared/logo-spinner'
import { Badge, Avatar, Progress } from '@/components/ui'
import { Search, MessageCircle, Phone, Send, X } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface StudentGuild {
  id: string
  name: string
  courseTitle: string
  instructorName?: string
}

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  role: string
  createdAt: string
  guilds: StudentGuild[]
}

interface ChatMessage {
  id: string
  name: string
  email: string
  message: string
  isAdmin?: boolean
  read?: boolean
  createdAt: string
}

function getProgressColor(percent: number) {
  if (percent >= 100) return 'bg-success'
  if (percent >= 70) return 'bg-info'
  if (percent >= 40) return 'bg-warning'
  return 'bg-error'
}

function StudentChatModal({
  student,
  onClose,
}: {
  student: Student
  onClose: () => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchConversation() {
      try {
        const res = await fetch(`/api/support/messages?email=${encodeURIComponent(student.email)}`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.conversation?.messages ?? [])
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchConversation()
  }, [student.email])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')
    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, targetEmail: student.email }),
      })
      if (res.ok) {
        const saved = await res.json()
        setMessages((prev) => [...prev, saved])
      }
    } catch {} finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const isOwn = (msg: ChatMessage) => msg.name?.startsWith('Admin (') || msg.name?.startsWith('Instructor (')

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/45 grid place-items-center"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-canvas border border-hairline shadow-lg w-[420px] max-w-[calc(100vw-2rem)] flex flex-col">
        <div className="flex items-center justify-between px-xl py-lg border-b border-hairline">
          <div className="flex items-center gap-md">
            <Avatar name={student.name} size="sm" src={student.avatar} />
            <div>
              <p className="text-body-sm text-ink font-600">{student.name}</p>
              <p className="text-caption text-mute">{student.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-mute hover:text-ink p-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={listRef} className="flex-1 p-xl overflow-y-auto max-h-[320px] space-y-lg">
          {loading ? (
            <p className="text-body-md text-mute text-center pt-xl">Loading...</p>
          ) : messages.length === 0 ? (
            <p className="text-body-md text-mute text-center pt-xl">No messages yet. Start a conversation.</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${isOwn(msg) ? 'items-end' : 'items-start'}`}>
                <span className="text-caption text-mute mb-xs">
                  {isOwn(msg) ? 'You' : student.name}
                </span>
                <div className={`px-md py-sm text-body-sm max-w-[80%] ${isOwn(msg) ? 'bg-primary text-on-primary' : 'bg-surface-soft text-ink'}`}>
                  {msg.message}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-lg border-t border-hairline">
          <div className="flex gap-md">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 h-10 bg-surface-soft text-ink text-body-sm px-md rounded-none border-b border-hairline-strong focus-visible:outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="bg-primary text-on-primary text-button-md px-lg h-10 rounded-xs font-700 border-none cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              <Send className="w-4 h-4" /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StudentsPage() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chatStudent, setChatStudent] = useState<Student | null>(null)

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch('/api/students')
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to fetch students')
        }
        const data = await res.json()
        setStudents(JSON.parse(JSON.stringify((data.students ?? []).map((s: Student) => ({
          ...s,
          phone: s.phone?.replace(/[^0-9]/g, '') ?? ''
        })))))
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
  }, [])

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isAdmin = session?.user?.role === 'admin'

  if (loading) {
    return <LogoSpinner />
  }

  if (error) {
    return (
      <div className="max-w-[1440px] mx-auto px-xl py-xxl">
        <p className="text-error">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <h1 className="text-display-md text-ink font-700 leading-[0.95]">My Students</h1>
        <Badge variant="new">{students.length} Total</Badge>
      </div>

      <div className="relative w-72 mb-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search students..."
          className="w-full h-10 pl-10 pr-md bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none"
        />
      </div>

      <div className="bg-canvas border border-hairline overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline bg-surface-soft">
              <th className="text-left px-lg py-md text-caption text-charcoal font-600">Student</th>
              <th className="text-left px-lg py-md text-caption text-charcoal font-600">Program</th>
              {isAdmin && <th className="text-left px-lg py-md text-caption text-charcoal font-600">Instructor</th>}
              <th className="text-left px-lg py-md text-caption text-charcoal font-600">Progress</th>
              <th className="text-right px-lg py-md text-caption text-charcoal font-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((student) => {
              const progress = student.guilds.length > 0
                ? Math.round(student.guilds.length * 30)
                : 0
              const clamped = Math.min(progress, 100)

              return (
                <tr key={student.id} className="border-b border-hairline hover:bg-surface-soft/50">
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-md">
                      <Avatar name={student.name} size="sm" src={student.avatar} />
                      <div>
                        <p className="text-body-sm text-ink">{student.name}</p>
                        <p className="text-caption text-mute">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-lg py-md text-body-sm text-charcoal">
                    {student.guilds.map((g) => g.courseTitle).join(', ') || '—'}
                  </td>
                  {isAdmin && (
                    <td className="px-lg py-md text-body-sm text-charcoal">
                      {student.guilds.map((g) => g.instructorName).filter(Boolean).join(', ') || '—'}
                    </td>
                  )}
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-md max-w-[200px]">
                      <Progress value={clamped} />
                      <span className={`w-2 h-2 rounded-full shrink-0 ${getProgressColor(clamped)}`} />
                      <span className="text-caption text-charcoal shrink-0">{clamped}%</span>
                    </div>
                  </td>
                  <td className="px-lg py-md text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setChatStudent(student)}
                        className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-strong rounded-xs cursor-pointer text-charcoal hover:text-ink hover:bg-surface-soft transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      {student.phone && (
                        <a
                          ref={el => { if (el && student.phone) el.href = `https://wa.me/${student.phone}` }}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-strong rounded-xs text-charcoal hover:text-[#25D366] hover:bg-surface-soft transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-lg py-xl text-center text-mute text-body-sm">
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {chatStudent && (
        <StudentChatModal
          student={chatStudent}
          onClose={() => setChatStudent(null)}
        />
      )}
    </div>
  )
}
