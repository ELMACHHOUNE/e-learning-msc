import { getForgotPasswordSection } from '@/lib/site-content'
import { ForgotPasswordForm } from './forgot-password-form'

export default async function ForgotPasswordPage() {
  const section = await getForgotPasswordSection()
  return (
    <div className="flex min-h-[calc(100vh-60px)]">
      <div className="hidden lg:flex w-1/2 bg-surface-dark items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <div className="relative z-10 text-center px-xl">
          <h1 className="text-display-xl text-on-dark font-bold leading-[0.95]">
            {section.leftTitle}
          </h1>
        </div>
      </div>

      <ForgotPasswordForm section={section} />
    </div>
  )
}