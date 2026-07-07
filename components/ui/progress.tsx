'use client'

import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  barClassName?: string
  showLabel?: boolean
}

export function Progress({ value, max = 100, className, barClassName, showLabel }: ProgressProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100)

  return (
    <div className={cn('w-full', className)}>
      <div className="w-full bg-surface-soft rounded-none h-2 overflow-hidden">
        <div
          className={cn('h-full bg-primary transition-all duration-300', barClassName)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-caption text-mute mt-1">
          {value}/{max} ({percentage}%)
        </p>
      )}
    </div>
  )
}
