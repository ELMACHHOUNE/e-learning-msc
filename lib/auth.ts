import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await connectToDatabase()

        const user = await User.findOne({ email: credentials.email as string }).select('+password')
        if (!user) return null

        const isValid = await bcrypt.compare(credentials.password as string, user.password as string)
        if (!isValid) return null

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
        }
      },
    }),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })]
      : []),
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? [GitHub({ clientId: process.env.AUTH_GITHUB_ID, clientSecret: process.env.AUTH_GITHUB_SECRET })]
      : []),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        session.user.image = token.picture as string | undefined
      }
      return session
    },
  },
})

export async function getCurrentUser() {
  const session = await auth()
  return session?.user as { id: string; name: string; email: string; image?: string; role: 'admin' | 'instructor' | 'student' } | undefined
}

export async function requireRole(...roles: ('admin' | 'instructor' | 'student')[]) {
  const session = await auth()
  const user = session?.user as { id: string; role: 'admin' | 'instructor' | 'student' } | undefined
  if (!user) throw new Error('Unauthorized')
  if (roles.length > 0 && !roles.includes(user.role)) {
    throw new Error('Forbidden')
  }
  return user
}
