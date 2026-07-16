import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL('/login?callbackUrl=%2Fdashboard', req.url))
  }
})

export const config = {
  matcher: ['/dashboard/:path*', '/courses/:path*', '/admin/:path*', '/students/:path*', '/teach/:path*', '/labphase/:path*', '/profile/:path*'],
}