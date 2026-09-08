import Image from 'next/image'
import { getLoginSection } from '@/lib/site-content'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  const login = await getLoginSection()
  return (
    <div className="grid min-h-[calc(100vh-60px)] lg:grid-cols-2">
      <div className="relative hidden lg:block overflow-hidden">
        <Image
          src={login.image || '/images/login.png'}
          alt="Login background"
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-dark/40 to-transparent" />
        <div className="absolute inset-0 z-10 flex items-end justify-center pb-14">
          <div className="text-center px-8">
            {login.eyebrow && (
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3">
                {login.eyebrow}
              </p>
            )}
            <p className="text-display-md text-on-dark font-bold leading-[0.95]">
              {login.tagline}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-canvas flex">
        <LoginForm section={login} />
      </div>
    </div>
  )
}