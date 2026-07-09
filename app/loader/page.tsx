'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoaderPage() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const duration = 2000
    const interval = 20
    const steps = duration / interval
    let current = 0

    const timer = setInterval(() => {
      current += 1
      const pct = Math.min(Math.round((current / steps) * 100), 100)
      setProgress(pct)

      if (pct >= 100) {
        clearInterval(timer)
        setTimeout(() => {
          router.push('/login')
        }, 300)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="fixed inset-0 bg-canvas flex flex-col items-center justify-center z-[9999]">
      <div className="flex flex-col items-center gap-xxl">
        <div className="animate-spin" style={{ animationDuration: '2s' }}>
          <Image
            src="/images/icon.png"
            alt="Logo"
            width={64}
            height={64}
            priority
            className="object-contain"
          />
        </div>

        <div className="text-center">
          <p className="text-heading-sm text-ink font-700 uppercase tracking-[0.18em]">
            e-learning-msc
          </p>
          <p className="text-caption text-mute mt-sm tracking-[0.1em] font-mono">
            {progress}%
          </p>
        </div>
      </div>
    </div>
  )
}