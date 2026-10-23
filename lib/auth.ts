import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/db'
import { consumeRateLimit } from '@/lib/analytics/rate-limit'
import User, { type UserDocument } from '@/models/User'

const DUMMY_PASSWORD_HASH = '$2b$10$7zjAF4R8SWV2uimhCsS/2.1v1uoWz1FY5sqH11aNj1o1i1TpgBq0q'

function getClientIp(request: Request) {
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',').map((part) => part.trim()).filter(Boolean)
    if (parts.length > 0) return parts[parts.length - 1]
  }
  return 'unknown'
}

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

type NextAuthInstance = ReturnType<typeof NextAuth>

let nextAuthInstance: NextAuthInstance | undefined

function getAuthInstance(): NextAuthInstance {
  if (!nextAuthInstance) {
    nextAuthInstance = NextAuth({
      session: { strategy: 'jwt', maxAge: 60 * 60 },
      jwt: { maxAge: 60 * 60 },
      providers: [
        Credentials({
          name: 'credentials',
          credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
          },
          async authorize(credentials, request) {
            if (!credentials?.email || !credentials?.password) {
              return null
            }

            const email = String(credentials.email).trim()
            const password = String(credentials.password)
            const ip = getClientIp(request)

            const emailLimit = consumeRateLimit(`auth:email:${email.toLowerCase()}`, 10)
            const ipLimit = consumeRateLimit(`auth:ip:${ip}`, 20)
            if (!emailLimit.allowed || !ipLimit.allowed) return null

            await connectToDatabase()

            const user = await User.findOne({ email }).select('+password')
            if (!user) {
              await bcrypt.compare(password, DUMMY_PASSWORD_HASH)
              return null
            }

            const hash = typeof user.password === 'string' && user.password.length > 0
              ? user.password
              : DUMMY_PASSWORD_HASH
            const isValid = await bcrypt.compare(password, hash)
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
        async jwt({ token, user, account, trigger, session }) {
          const typedToken = token as typeof token & AuthToken
          if (user) {
            const isOAuth = account?.provider != null && account.provider !== 'credentials'
            if (isOAuth) {
              await connectToDatabase()
              const email = (user.email ?? '').toLowerCase().trim()
              if (email) {
                const found = await User.findOne({ email }).select('-password').lean()
                if (found) {
                  typedToken.id = String(found._id)
                  typedToken.role = found.role
                  typedToken.picture = getSafeSessionImage(found.avatar) ?? user.image ?? undefined
                  if (!found.avatar && user.image) {
                    await User.updateOne({ _id: found._id }, { $set: { avatar: user.image } })
                  }
                } else {
                  const created = await User.create({
                    name: user.name && user.name.trim() ? user.name : (email.split('@')[0] || 'Student'),
                    email,
                    avatar: user.image ?? undefined,
                    role: 'student',
                  } as UserDocument)
                  typedToken.id = String(created._id)
                  typedToken.role = 'student'
                  typedToken.picture = getSafeSessionImage(created.avatar) ?? user.image ?? undefined
                }
              }
            } else {
              typedToken.id = String(user.id)
              typedToken.role = user.role
              typedToken.picture = user.image ?? undefined
            }
          }
          if (trigger === 'update' && session) {
            if (session.name) typedToken.name = session.name
            if (session.image) typedToken.picture = session.image
            if (session.email) typedToken.email = session.email
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
                const u = await User.findById(typedToken.id).select('avatar').lean() as { avatar?: string } | null
                if (u?.avatar) typedSessionUser.image = String(u.avatar)
              } catch {}
            }
          }
          return session
        },
      },
    })
  }
  return nextAuthInstance
}

const instance = getAuthInstance()
export const { handlers, auth, signIn, signOut } = instance

export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

export async function requireRole(...roles: ('admin' | 'instructor' | 'student')[]) {
  const session = await auth()
  const user = session?.user
  if (!user) throw new Error('Unauthorized')
  if (roles.length > 0 && !roles.includes(user.role)) {
    throw new Error('Forbidden')
  }
  return user
}