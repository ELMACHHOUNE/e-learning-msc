'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toDayKey, type SessionDTO } from './types'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface SessionCalendarProps {
  month: Date
  onMonthChange: (month: Date) => void
  sessionsByDay: Map<string, SessionDTO[]>
  onSelectDay: (day: string) => void
}

function buildCells(month: Date): (Date | null)[] {
  const year = month.getFullYear()
  const mon = month.getMonth()
  const firstWeekday = (new Date(year, mon, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, mon + 1, 0).getDate()
  const cells: (Date | null)[] = Array(firstWeekday).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, mon, d))
  }
  return cells
}

export function SessionCalendar({ month, onMonthChange, sessionsByDay, onSelectDay }: SessionCalendarProps) {
  const todayKey = toDayKey(new Date())
  const cells = buildCells(month)

  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(month)

  return (
    <div className="bg-canvas border border-hairline">
      <div className="flex items-center justify-between px-lg py-md border-b border-hairline bg-surface-soft">
        <h2 className="text-heading-sm text-ink font-700 capitalize">{monthLabel}</h2>
        <div className="flex items-center gap-xs">
          <button
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="w-8 h-8 flex items-center justify-center border border-hairline-strong bg-canvas text-charcoal hover:bg-surface-soft cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMonthChange(new Date())}
            className="h-8 px-3 text-button-sm text-charcoal border border-hairline-strong bg-canvas hover:bg-surface-soft cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="w-8 h-8 flex items-center justify-center border border-hairline-strong bg-canvas text-charcoal hover:bg-surface-soft cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-hairline">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-xs text-center text-caption text-mute font-600">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) {
            return <div key={`blank-${i}`} className="border border-hairline/50 min-h-[72px] bg-surface-soft/40" />
          }
          const key = toDayKey(date)
          const daySessions = sessionsByDay.get(key) ?? []
          const isToday = key === todayKey
          return (
            <button
              key={key}
              onClick={() => onSelectDay(key)}
              className={cn(
                'min-h-[72px] border border-hairline/50 p-xs flex flex-col items-center gap-1 cursor-pointer hover:bg-surface-soft transition-colors',
                isToday && 'bg-primary/10'
              )}
            >
              <span
                className={cn(
                  'w-7 h-7 flex items-center justify-center text-body-sm',
                  isToday ? 'bg-primary text-on-primary font-700' : 'text-charcoal'
                )}
              >
                {date.getDate()}
              </span>
              {daySessions.length > 0 && (
                <div className="flex flex-col items-center gap-0.5 w-full">
                  <div className="flex items-center gap-0.5 flex-wrap justify-center">
                    {daySessions.slice(0, 3).map((s) => (
                      <span
                        key={s.id}
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          s.hasAttendance ? 'bg-success' : 'bg-primary'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-overline text-mute font-600">
                    {daySessions.length > 3 ? `${daySessions.length} sessions` : daySessions.length === 1 ? '1 session' : `${daySessions.length} sessions`}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}