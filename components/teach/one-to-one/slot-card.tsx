'use client'

import { Badge } from '@/components/ui'
import { CalendarDays, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OneToOneDTO } from './types'
import { formatSlotDate, formatSlotDuration, formatSlotTime } from './types'

interface SlotCardProps {
  slot: OneToOneDTO
  guildLabel?: string
  instructorLabel?: string
  isPast?: boolean
  children?: React.ReactNode
  className?: string
}

export function SlotCard({ slot, guildLabel = '', instructorLabel, isPast = false, children, className }: SlotCardProps) {
  const statusMeta = {
    available: { variant: 'info' as const, label: 'Available' },
    booked: { variant: 'success' as const, label: 'Booked' },
    cancelled: { variant: 'warning' as const, label: 'Cancelled' },
  }[slot.status]

  const subtitle = [guildLabel, instructorLabel, slot.studentName ? `with ${slot.studentName}` : '']
    .filter(Boolean)
    .join(' · ')

  return (
    <div className={cn('bg-canvas border border-hairline p-lg', isPast && 'opacity-70', className)}>
      <div className="flex items-start justify-between gap-md flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-md mb-sm flex-wrap">
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
            {isPast && <span className="text-caption text-mute">Past</span>}
            {slot.title && <span className="text-body-sm text-charcoal font-600">{slot.title}</span>}
          </div>
          <div className="flex items-center gap-lg flex-wrap text-body-sm text-charcoal">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="w-4 h-4" />
              {formatSlotDate(slot.date)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatSlotTime(slot.date)} · {formatSlotDuration(slot.duration)}
            </span>
          </div>
          {subtitle && <p className="text-body-sm text-mute mt-sm">{subtitle}</p>}
        </div>
        {children && <div className="flex items-center gap-md flex-wrap shrink-0">{children}</div>}
      </div>
    </div>
  )
}