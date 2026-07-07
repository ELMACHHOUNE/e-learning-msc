'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-xxl"
      >
        <Image
          src="/images/icon.png"
          alt="Logo"
          width={96}
          height={96}
          priority
          className="object-contain"
        />

        <div className="w-64">
          <div className="w-full bg-surface-soft rounded-none h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <p className="text-caption text-mute text-center mt-md">{progress}%</p>
        </div>
      </motion.div>
    </div>
  )
}
