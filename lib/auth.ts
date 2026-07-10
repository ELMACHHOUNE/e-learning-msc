import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'

type AuthToken = {
  id: string
  role?: 'admin' | 'instructor' | 'student'
  picture?: string
}

type AuthSessionUser = {
  id: string
  name: string
  email: string
  image?: string
  role: 'admin' | 'instructor' | 'student'
}

function getSafeSessionImage(image?: string | null) {
  if (!image) return undefined
  if (image.startsWith('data:')) return undefined
  if (image.length > 512) return undefined
  return image
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: 60 * 60 },
  jwt: { maxAge: 60 * 60 },
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
          image: getSafeSessionImage(user.avatar),
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
        const typedToken = token as typeof token & AuthToken
        typedToken.id = String(user.id)
        typedToken.role = (user as { role?: AuthToken['role'] }).role
        typedToken.picture = (user as any).image
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const typedSessionUser = session.user as typeof session.user & AuthSessionUser
        const typedToken = token as typeof token & AuthToken
        typedSessionUser.id = typedToken.id
        typedSessionUser.role = typedToken.role ?? 'student'
        typedSessionUser.image = getSafeSessionImage(typedToken.picture)
        if (!typedSessionUser.image && typedToken.id) {
          try {
            await connectToDatabase()
            const u = await User.findById(typedToken.id).select('avatar').lean()
            if (u && (u as any).avatar) typedSessionUser.image = String((u as any).avatar)
          } catch {}
        }
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