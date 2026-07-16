import { auth } from '@/lib/auth'

export default auth((req) => {
  if (!req.auth) {
    return Response.redirect('/login?callbackUrl=%2Fdashboard')
  }
})

export const config = {
  matcher: ['/dashboard/:path*', '/courses/:path*', '/admin/:path*', '/students/:path*', '/teach/:path*', '/labphase/:path*', '/profile/:path*'],
}