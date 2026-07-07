import { Navbar } from '@/components/shared/navbar'
import { ChatSupport } from '@/components/shared/chat-support'

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <ChatSupport />
    </>
  )
}
