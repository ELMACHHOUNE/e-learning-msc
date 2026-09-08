import { getNavbarSection } from '@/lib/site-content'
import { SiteNavbar } from '@/components/shared/site-navbar'

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const navbar = await getNavbarSection()
  return (
    <>
      <SiteNavbar section={navbar} />
      {children}
    </>
  )
}