import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image?: string
      role: 'admin' | 'instructor' | 'student'
    }
  }

  interface User {
    role?: 'admin' | 'instructor' | 'student'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role?: 'admin' | 'instructor' | 'student'
  }
}
