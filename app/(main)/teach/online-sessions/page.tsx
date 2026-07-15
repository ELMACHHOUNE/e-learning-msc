'use client'

import { Button, Badge } from '@/components/ui'
import { Video, Clock } from 'lucide-react'

const sessions = [
  { id: '1', title: 'Module 3: Data Structures', guild: 'Achilles Vengeance', time: 'Today, 2:00 PM', participants: 24, status: 'upcoming' as const },
  { id: '2', title: 'Code Review Session', guild: 'Achilles Vengeance', time: 'Tomorrow, 10:00 AM', participants: 12, status: 'upcoming' as const },
  { id: '3', title: 'Q&A: Final Project Prep', guild: 'Data Science Guild', time: 'Sep 20, 3:00 PM', participants: 18, status: 'upcoming' as const },
]

export default function OnlineSessionsPage() {
  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <h1 className="text-display-md text-ink font-700 leading-[0.95]">Online Sessions</h1>
        <Button variant="primary">
          <Video className="w-4 h-4 mr-2" /> Create Session
        </Button>
      </div>

      <div className="grid gap-lg">
        {sessions.map((session) => (
          <div key={session.id} className="bg-canvas border border-hairline p-xxl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-md mb-sm">
                  <h2 className="text-heading-sm text-ink font-700">{session.title}</h2>
                  <Badge variant={session.status === 'upcoming' ? 'info' : 'success'}>{session.status}</Badge>
                </div>
                <p className="text-body-sm text-mute mb-md">{session.guild}</p>
                <div className="flex items-center gap-lg">
                  <span className="flex items-center gap-1 text-body-sm text-charcoal">
                    <Clock className="w-4 h-4" />
                    {session.time}
                  </span>
                  <span className="flex items-center gap-1 text-body-sm text-charcoal">
                    <Video className="w-4 h-4" />
                    {session.participants} participants
                  </span>
                </div>
              </div>
              <Button variant="primary">Join Session</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
