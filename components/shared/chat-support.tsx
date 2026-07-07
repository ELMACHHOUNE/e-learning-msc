'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X } from 'lucide-react'

export function ChatSupport() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-surface-dark text-on-dark rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity border-none cursor-pointer"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-canvas border border-hairline shadow-lg"
          >
            <div className="p-xl border-b border-hairline">
              <p className="text-heading-sm text-ink">Support</p>
              <p className="text-body-sm text-mute">How can we help you today?</p>
            </div>
            <div className="p-xl h-[300px] flex items-center justify-center">
              <p className="text-body-md text-mute">Chat support coming soon</p>
            </div>
            <div className="p-lg border-t border-hairline">
              <div className="flex gap-md">
                <input
                  placeholder="Type your message..."
                  className="flex-1 h-10 bg-surface-soft text-ink text-body-sm px-md rounded-none border-b border-hairline-strong focus-visible:outline-none"
                />
                <button className="bg-primary text-on-primary text-button-md px-lg h-10 rounded-xs font-700 border-none cursor-pointer">
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
