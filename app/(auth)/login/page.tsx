'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Button, Input } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex w-1/2 bg-surface-dark items-center justify-center relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-2xl" />
        </motion.div>
        <div className="relative z-10 text-center px-xl">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-display-xl text-on-dark font-700 leading-[0.95] mb-xl"
          >
            e-learning
            <br />
            <span className="text-primary">msc</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-body-lg text-on-dark-mute"
          >
            Premium learning management platform
          </motion.p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-xl bg-canvas">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden mb-xxl">
            <h1 className="text-display-md text-ink font-700 leading-[0.95]">e-learning-msc</h1>
          </div>

          <h2 className="text-heading-lg text-ink font-700 mb-xs">Welcome back</h2>
          <p className="text-body-md text-mute mb-xxl">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-lg">
            {error && (
              <div className="p-md bg-error/10 border border-error/20 rounded-xs">
                <p className="text-body-sm text-error">{error}</p>
              </div>
            )}

            <div>
              <Input
                id="email"
                name="email"
                type="email"
                label="Email"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="Enter your password"
                required
              />
              <div className="text-right mt-sm">
                <a
                  href="/forgot-password"
                  className="text-body-sm text-ink underline hover:no-underline"
                >
                  Forgot Password?
                </a>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative my-xxl">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-hairline" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-canvas px-md text-body-sm text-mute">or continue with</span>
            </div>
          </div>

          <div className="flex gap-md">
            <Button
              type="button"
              variant="outline-dark"
              className="flex-1"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            >
              Google
            </Button>
            <Button
              type="button"
              variant="outline-dark"
              className="flex-1"
              onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            >
              GitHub
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
