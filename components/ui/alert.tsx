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

const variantStyles: Record<AlertVariant, { icon: typeof CheckCircle; iconColor: string }> = {
  success: { icon: CheckCircle, iconColor: 'text-success' },
  error: { icon: AlertCircle, iconColor: 'text-error' },
  warning: { icon: AlertCircle, iconColor: 'text-warning' },
  info: { icon: Info, iconColor: 'text-info' },
}

let addAlertFn: ((a: Omit<AlertData, 'id'>) => void) | null = null

export function toast(alert: Omit<AlertData, 'id'>) {
  addAlertFn?.(alert)
}

export function AlertContainer() {
  const [alerts, setAlerts] = useState<AlertData[]>([])

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

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {alerts.map((alert) => {
          const style = variantStyles[alert.variant]
          const Icon = style.icon
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              className='border border-hairline-strong pointer-events-auto shadow-[0_4px_16px_rgba(0,0,0,0.10)] bg-canvas'
            >
              <div className="flex items-start gap-3 p-4">
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.iconColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-button-sm font-bold uppercase tracking-[0.144px] text-ink">
                    {alert.title}
                  </p>
                  {alert.message && (
                    <p className="text-body-sm text-mute mt-0.5">{alert.message}</p>
                  )}
                </div>
                <button
                  onClick={() => setAlerts((prev) => prev.filter((x) => x.id !== alert.id))}
                  className="text-mute hover:text-ink bg-transparent border-none cursor-pointer p-0.5 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>,
    document.body,
  )
}