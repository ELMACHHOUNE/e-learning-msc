import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const pathname = req.nextUrl.pathname

  if (!req.auth) {
    const callbackUrl = `${pathname}${req.nextUrl.search}`
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, req.url)
    )
  }

  const role = req.auth.user?.role

  if (pathname.startsWith('/admin') && role !== 'admin') {
    const dashboard = role === 'instructor' ? '/teach' : '/dashboard'
    return NextResponse.redirect(new URL(dashboard, req.url))
  }
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/courses/:path*',
    '/admin/:path*',
    '/students/:path*',
    '/instructors/:path*',
    '/graduations/:path*',
    '/teach/:path*',
    '/labphase/:path*',
    '/profile/:path*',
    '/sessions/:path*',
    '/one-to-one/:path*',
  ],
}