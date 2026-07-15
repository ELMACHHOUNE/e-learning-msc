'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

type AlertVariant = 'success' | 'error' | 'warning' | 'info'

interface AlertData {
  id: string
  variant: AlertVariant
  title: string
  message?: string
}

const iconMap: Record<AlertVariant, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
}

const iconColorMap: Record<AlertVariant, string> = {
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
}

let addAlertFn: ((a: Omit<AlertData, 'id'>) => void) | null = null

export function toast(alert: Omit<AlertData, 'id'>) {
  addAlertFn?.(alert)
}

export function AlertContainer() {
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [mounted] = useState(() => typeof document !== 'undefined')

  useEffect(() => {
    addAlertFn = (a) => {
      const id = Math.random().toString(36).substring(2, 8)
      setAlerts((prev) => [...prev, { ...a, id }])
      setTimeout(() => {
        setAlerts((prev) => prev.filter((x) => x.id !== id))
      }, 4000)
    }
    return () => { addAlertFn = null }
  }, [])

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none w-full max-w-[384px]">
      <AnimatePresence>
        {alerts.map((alert) => {
          const Icon = iconMap[alert.variant]
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              className="border border-hairline pointer-events-auto bg-canvas shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
            >
              <div className="grid grid-cols-[1fr_auto] gap-2 px-6 py-4 border-b border-hairline bg-surface-soft">
                <div className="flex items-start gap-2 min-w-0">
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColorMap[alert.variant]}`} />
                  <p className="text-button-sm font-bold uppercase text-ink break-words min-w-0">{alert.title}</p>
                </div>
                <button
                  onClick={() => setAlerts((prev) => prev.filter((x) => x.id !== alert.id))}
                  className="text-mute hover:text-ink bg-transparent border-none cursor-pointer p-0.5 shrink-0 self-start"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {alert.message && (
                <div className="px-6 py-4">
                  <p className="text-body-sm text-mute">{alert.message}</p>
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>,
    document.body,
  )
}