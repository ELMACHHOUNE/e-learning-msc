import { getToken } from 'next-auth/jwt'

export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/dashboard/:path*', '/courses/:path*', '/admin/:path*', '/students/:path*', '/teach/:path*', '/labphase/:path*'],
}
