'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { ComponentType, ReactNode } from 'react'

export interface KpiCardProps {
  label: string
  value: string | number
  icon: ComponentType<{ className?: string }>
  deltaPercent?: number | null
  deltaLabel?: string
  hint?: string
  index?: number
}

export function KpiCard({ label, value, icon: Icon, deltaPercent, deltaLabel, hint, index = 0 }: KpiCardProps) {
  const showDelta = typeof deltaPercent === 'number' && Number.isFinite(deltaPercent)
  const positive = (deltaPercent ?? 0) >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-canvas border border-hairline p-lg min-w-0 flex flex-col"
    >
      <div className="flex items-center justify-between gap-sm mb-md">
        <span className="text-caption text-mute uppercase tracking-[0.1em] truncate">{label}</span>
        <Icon className="w-4 h-4 text-mute shrink-0" />
      </div>
      <p className="text-display-md text-ink font-700 leading-[0.95]">{value}</p>
      {showDelta && (
        <p className="text-caption mt-xs">
          <span className={cn('font-700', positive ? 'text-success' : 'text-error')}>
            {positive ? '+' : ''}
            {deltaPercent}%
          </span>
          <span className="text-mute"> {deltaLabel ?? 'vs previous period'}</span>
        </p>
      )}
      {!showDelta && hint && <p className="text-caption text-mute mt-xs">{hint}</p>}
    </motion.div>
  )
}

export function AnalyticsPanel({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('bg-canvas border border-hairline flex flex-col', className)}>
      <div className="flex items-center justify-between gap-md px-lg py-md border-b border-hairline">
        <h3 className="text-caption text-charcoal font-600 uppercase tracking-[0.1em]">{title}</h3>
        {action}
      </div>
      <div className="p-lg flex-1">{children}</div>
    </section>
  )
}

export function LoadingPanel({ label = 'Loading analytics...' }: { label?: string }) {
  return (
    <div className="bg-canvas border border-hairline flex flex-col items-center justify-center py-xxxl">
      <div className="flex flex-col items-center gap-lg">
        <div className="animate-spin" style={{ animationDuration: '2s' }}>
          <img src="/images/icon.png" alt="" className="w-8 h-8 object-contain" />
        </div>
        <p className="text-caption text-mute tracking-[0.1em]">{label}</p>
      </div>
    </div>
  )
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-xxxl px-lg gap-sm">
      <p className="text-body-md text-ink font-600">{title}</p>
      <p className="text-body-sm text-mute max-w-[32rem]">{message}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-xxxl px-lg gap-md">
      <p className="text-body-md text-error font-600">Could not load this report</p>
      <p className="text-body-sm text-mute max-w-[32rem]">{message}</p>
      <button
        onClick={onRetry}
        className="h-9 px-4 bg-canvas border border-hairline-strong text-body-sm text-ink rounded-[2px] hover:bg-surface-soft transition-colors cursor-pointer"
      >
        Try again
      </button>
    </div>
  )
}