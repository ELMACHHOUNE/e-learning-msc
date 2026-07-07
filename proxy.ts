import { auth } from '@/lib/auth'

export default auth((req) => {
  if (!req.auth) {
    const url = new URL('/login', req.url)
    url.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return Response.redirect(url)
  }
})

export const config = {
  matcher: ['/dashboard/:path*', '/courses/:path*', '/admin/:path*', '/students/:path*', '/teach/:path*', '/labphase/:path*'],
}
