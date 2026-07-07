'use client'

import { Badge } from '@/components/ui'
import { ArrowUpRight, DollarSign, TrendingUp, Calendar } from 'lucide-react'

const earningsData = [
  { month: 'Jan', amount: 3200 },
  { month: 'Feb', amount: 2800 },
  { month: 'Mar', amount: 3500 },
  { month: 'Apr', amount: 4100 },
  { month: 'May', amount: 3800 },
  { month: 'Jun', amount: 4500 },
]

export default function EarningsPage() {
  const totalEarnings = earningsData.reduce((sum, e) => sum + e.amount, 0)
  const maxAmount = Math.max(...earningsData.map((e) => e.amount))

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <h1 className="text-display-md text-ink font-700 leading-[0.95]">Earnings</h1>
        <Badge variant="new">This Year</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xxl">
        <div className="bg-canvas border border-hairline p-xxl">
          <DollarSign className="w-8 h-8 text-primary mb-md" />
          <p className="text-body-sm text-mute mb-xs">Total Earnings</p>
          <p className="text-display-lg text-ink font-700">${totalEarnings.toLocaleString()}</p>
        </div>
        <div className="bg-canvas border border-hairline p-xxl">
          <TrendingUp className="w-8 h-8 text-success mb-md" />
          <p className="text-body-sm text-mute mb-xs">Average Monthly</p>
          <p className="text-display-lg text-ink font-700">${Math.round(totalEarnings / earningsData.length).toLocaleString()}</p>
        </div>
        <div className="bg-canvas border border-hairline p-xxl">
          <Calendar className="w-8 h-8 text-info mb-md" />
          <p className="text-body-sm text-mute mb-xs">Best Month</p>
          <p className="text-display-lg text-ink font-700">${maxAmount.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-canvas border border-hairline p-xxl">
        <h2 className="text-heading-sm text-ink font-700 mb-lg">Monthly Breakdown</h2>
        <div className="flex items-end gap-lg h-48">
          {earningsData.map((item) => (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-sm">
              <span className="text-caption text-mute">${item.amount}</span>
              <div
                className="w-full bg-primary transition-all duration-300"
                style={{ height: `${(item.amount / maxAmount) * 100}%` }}
              />
              <span className="text-caption text-charcoal">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
