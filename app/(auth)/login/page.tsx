'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

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
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block overflow-hidden">
        <Image
          src="/images/login.png"
          alt="Login background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-dark/40 to-transparent" />
        <div className="absolute inset-0 z-10 flex items-end justify-center pb-14">
          <div className="text-center px-8">
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3">
              E-LEARNING MSC
            </p>
            <p className="text-display-md text-on-dark font-bold leading-[0.95]">
              Structured learning. Measurable outcomes.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-canvas flex items-center justify-center px-10 lg:px-16">
        <div className="w-full max-w-[400px] mx-auto">
          <div className="lg:hidden mb-10">
            <Link href="/" className="text-display-md text-ink font-bold leading-[0.95] no-underline">e-learning-msc</Link>
          </div>
          <Link href="/" className="hidden lg:inline-flex items-center gap-1.5 text-[12px] font-medium text-mute hover:text-ink no-underline mb-8 transition-colors">
            &larr; Back to home
          </Link>

          <h2 className="text-[24px] font-bold text-ink uppercase leading-[0.95] mb-1">Welcome back</h2>
          <p className="text-[14px] text-mute mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-error/10 border border-error/20">
                <p className="text-[13px] text-error font-medium">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-[12px] font-semibold text-charcoal mb-1.5 uppercase tracking-[0.06em]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="w-full h-11 bg-canvas text-ink text-[14px] px-0 border-b border-ink focus:outline-none focus:border-primary transition-colors placeholder:text-stone"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[12px] font-semibold text-charcoal mb-1.5 uppercase tracking-[0.06em]">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                className="w-full h-11 bg-canvas text-ink text-[14px] px-0 border-b border-ink focus:outline-none focus:border-primary transition-colors placeholder:text-stone"
              />
              <div className="text-right mt-2">
                <Link
                  href="/forgot-password"
                  className="text-[12px] font-medium text-ink underline hover:no-underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary text-on-primary text-[13px] font-bold uppercase tracking-[0.08em] hover:bg-primary-deep transition-colors disabled:opacity-50 cursor-pointer border-none"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-hairline" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-canvas px-3 text-[11px] text-mute uppercase tracking-[0.05em]">or</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="h-11 border border-ink bg-canvas text-ink text-[12px] font-bold uppercase tracking-[0.06em] hover:bg-surface-soft transition-colors cursor-pointer"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
              className="h-11 border border-ink bg-canvas text-ink text-[12px] font-bold uppercase tracking-[0.06em] hover:bg-surface-soft transition-colors cursor-pointer"
            >
              GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
