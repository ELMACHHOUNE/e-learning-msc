import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

function redirect(req: { url: string }, path: string) {
  const response = NextResponse.redirect(new URL(path, req.url))
  response.headers.set('Content-Type', 'text/html; charset=utf-8')
  return response
}

export default auth((req) => {
  const pathname = req.nextUrl.pathname

  if (!req.auth) {
    const callbackUrl = `${pathname}${req.nextUrl.search}`
    return redirect(req, `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const role = req.auth.user?.role

  if (pathname.startsWith('/admin') && role !== 'admin') {
    const dashboard = role === 'instructor' ? '/teach' : '/dashboard'
    return redirect(req, dashboard)
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
