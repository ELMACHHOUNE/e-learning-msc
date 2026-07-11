'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface ChatMessage {
  id: string
  name: string
  email: string
  message: string
  isAdmin?: boolean
  read?: boolean
  createdAt: string
}

export function ChatSupport() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/support/messages')
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages ?? [])
        if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (open) {
      fetchMessages()
      markAsRead()
    }
  }, [open, fetchMessages])

  useEffect(() => {
    if (!open && session) {
      fetchMessages()
    }
  }, [open, session, fetchMessages])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  async function markAsRead() {
    try {
      await fetch('/api/support/messages', { method: 'PATCH' })
      setUnreadCount(0)
    } catch {}
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')
    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
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

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-surface-dark text-on-dark rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity border-none cursor-pointer"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-700 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-canvas border border-hairline shadow-lg flex flex-col"
          >
            <div className="p-xl border-b border-hairline">
              <p className="text-heading-sm text-ink">Support</p>
              <p className="text-body-sm text-mute">How can we help you today?</p>
            </div>
            <div ref={listRef} className="flex-1 p-xl overflow-y-auto max-h-[300px] space-y-lg">
              {messages.length === 0 ? (
                <p className="text-body-md text-mute text-center pt-xl">No messages yet</p>
              ) : (
                messages.map((msg) => {
                  const isAdmin = msg.name?.startsWith('Admin (')
                  const isOwn = !isAdmin
                  return (
                    <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      <span className="text-caption text-mute mb-xs">
                        {isAdmin ? 'Support' : 'You'}
                      </span>
                      <div className={`px-md py-sm text-body-sm max-w-[80%] ${isOwn ? 'bg-primary text-on-primary' : 'bg-surface-soft text-ink'}`}>
                        {msg.message}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="p-lg border-t border-hairline">
              <div className="flex gap-md">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  disabled={!session}
                  className="flex-1 h-10 bg-surface-soft text-ink text-body-sm px-md rounded-none border-b border-hairline-strong focus-visible:outline-none disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending || !session}
                  className="bg-primary text-on-primary text-button-md px-lg h-10 rounded-xs font-700 border-none cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  <Send className="w-4 h-4" /> Send
                </button>
              </div>
              {!session && (
                <p className="text-caption text-mute mt-sm">Please log in to send a message</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
