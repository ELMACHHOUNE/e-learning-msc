'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void | Promise<void>
}

let showConfirmFn: ((opts: ConfirmOptions) => void) | null = null

export function confirm(opts: ConfirmOptions) {
  showConfirmFn?.(opts)
}

export function ConfirmDialog() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [loading, setLoading] = useState(false)

  const close = useCallback(() => setOptions(null), [])

  useEffect(() => {
    showConfirmFn = (opts) => setOptions(opts)
    return () => { showConfirmFn = null }
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!options) return
    setLoading(true)
    try {
      await options.onConfirm()
    } catch {}
    setLoading(false)
    setOptions(null)
  }, [options])

  if (typeof document === 'undefined') return null

  const isDanger = options?.variant === 'danger'

  return createPortal(
    <AnimatePresence>
      {options && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-canvas border border-hairline-strong max-w-sm w-full shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
          >
            <div className="flex items-start justify-between gap-4 p-5 pb-0">
              <div className="flex items-center gap-3">
                {isDanger ? (
                  <div className="w-10 h-10 flex items-center justify-center border border-hairline-strong bg-surface-soft">
                    <Trash2 className="w-5 h-5 text-error" />
                  </div>
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center border border-hairline-strong bg-surface-soft">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  </div>
                )}
                <div>
                  <h3 className="text-heading-xs text-ink font-700 uppercase tracking-[0.192px]">{options.title}</h3>
                  {options.message && <p className="text-body-sm text-mute mt-1">{options.message}</p>}
                </div>
              </div>
              <button onClick={close} className="text-mute hover:text-ink bg-transparent border-none cursor-pointer p-0.5 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-end gap-2 p-5">
              <button
                onClick={close}
                disabled={loading}
                className="border border-hairline-strong bg-canvas text-ink text-button-sm font-bold uppercase px-4 py-2 cursor-pointer hover:bg-surface-soft transition-colors disabled:opacity-40"
              >
                {options.cancelLabel ?? 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={cn(
                  'border text-button-sm font-bold uppercase px-4 py-2 cursor-pointer transition-colors disabled:opacity-40 flex items-center gap-2',
                  isDanger
                    ? 'border-error bg-error text-white hover:bg-error/90'
                    : 'border-ink bg-ink text-canvas hover:bg-ink/90',
                )}
              >
                {loading && (
                  <span className="w-3.5 h-3.5 border-[2px] border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {options.confirmLabel ?? (isDanger ? 'Delete' : 'Confirm')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}