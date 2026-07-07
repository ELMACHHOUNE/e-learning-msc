'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button, Input } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex w-1/2 bg-surface-dark items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <div className="relative z-10 text-center px-xl">
          <h1 className="text-display-xl text-on-dark font-700 leading-[0.95]">Reset Password</h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-xl bg-canvas">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden mb-xxl">
            <Link href="/login" className="text-heading-sm text-ink no-underline">e-learning-msc</Link>
          </div>

          <Link href="/login" className="inline-flex items-center gap-2 text-body-sm text-mute hover:text-ink no-underline mb-xl">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          {!submitted ? (
            <>
              <h2 className="text-heading-lg text-ink font-700 mb-xs">Forgot password?</h2>
              <p className="text-body-md text-mute mb-xxl">
                No worries. Enter your email and we'll send you reset instructions.
              </p>

              <form onSubmit={handleSubmit} className="space-y-lg">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email"
                  placeholder="Enter your email"
                  required
                />

                <Button type="submit" variant="primary" className="w-full">
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-heading-lg text-ink font-700 mb-xs">Check your email</h2>
              <p className="text-body-md text-mute mb-xxl">
                If an account exists with that email, we've sent password reset instructions.
              </p>
              <Button
                type="button"
                variant="outline-dark"
                className="w-full"
                onClick={() => setSubmitted(false)}
              >
                Send again
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
