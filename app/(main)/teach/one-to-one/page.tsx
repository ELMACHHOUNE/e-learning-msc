'use client'

import { useState } from 'react'
import { Button, Avatar } from '@/components/ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
]

const students = ['Alice Johnson', 'Bob Smith', 'Carol White', 'David Brown']

export default function OneToOnePage() {
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <h1 className="text-display-md text-ink font-700 leading-[0.95]">One-to-One Sessions</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xxl">
        <div className="lg:col-span-1 space-y-lg">
          <h2 className="text-heading-sm text-ink font-700">Select Student</h2>
          <div className="space-y-2">
            {students.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedStudent(name)}
                className={`w-full flex items-center gap-md p-md text-left transition-colors bg-transparent border-none cursor-pointer ${
                  selectedStudent === name
                    ? 'bg-primary/10 border border-primary'
                    : 'bg-canvas border border-hairline hover:bg-surface-soft'
                }`}
              >
                <Avatar name={name} size="sm" />
                <span className="text-body-md text-ink">{name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-lg">
            <h2 className="text-heading-sm text-ink font-700">Available Slots</h2>
            <div className="flex items-center gap-md">
              <button className="bg-transparent border-none cursor-pointer text-charcoal hover:text-ink">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-body-md text-ink font-600">September 2026</span>
              <button className="bg-transparent border-none cursor-pointer text-charcoal hover:text-ink">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-canvas border border-hairline p-xxl">
            <div className="grid grid-cols-4 gap-md">
              {timeSlots.map((slot) => {
                const isBooked = slot === '12:00 PM' || slot === '3:00 PM'
                const isSelected = selectedSlot === slot
                return (
                  <button
                    key={slot}
                    disabled={isBooked}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-md text-center text-button-sm transition-colors border cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary'
                        : isBooked
                        ? 'bg-surface-soft text-stone border-hairline cursor-not-allowed'
                        : 'bg-canvas text-ink border-hairline-strong hover:bg-surface-soft'
                    }`}
                  >
                    {slot}
                    {isBooked && <span className="block text-caption mt-1">Booked</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {selectedStudent && selectedSlot && (
            <div className="mt-lg p-xxl bg-primary/10 border border-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-md text-ink font-600">Session Confirmation</p>
                  <p className="text-body-sm text-mute mt-xs">
                    One-to-one with {selectedStudent} at {selectedSlot}
                  </p>
                </div>
                <Button variant="primary">Confirm Booking</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
