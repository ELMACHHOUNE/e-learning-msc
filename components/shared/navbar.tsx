'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  LogOut,
  Settings,
  GraduationCap,
  Users,
  FlaskConical,
  BookOpen,
  Menu,
  X,
  Shield,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { cn } from '@/lib/utils'

type NavLink = { href?: string; label: string; icon?: React.ComponentType<{ className?: string }>; children?: { href: string; label: string }[] }

export function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role

  const navLinks: NavLink[] = [
    { href: '/dashboard', label: 'Dashboard', icon: GraduationCap },
    ...(role === 'admin' ? [
      { href: '/admin', label: 'Admin', icon: Shield },
      { href: '/instructors', label: 'Instructors', icon: Users },
      { href: '/graduations', label: 'Graduations', icon: GraduationCap },
    ] : []),
    ...(role !== 'admin' ? [{
      label: 'Teach',
      icon: BookOpen,
      children: [
        { href: '/teach/attendance', label: 'Attendance' },
        { href: '/teach/one-to-one', label: 'One-to-One' },
        { href: '/teach/earnings', label: 'Earnings' },
        { href: '/teach/online-sessions', label: 'Online Sessions' },
      ],
    }] : []),
    ...(role !== 'student' ? [{ href: '/students', label: role === 'admin' ? 'Students' : 'My Students', icon: Users }] : []),
    {
      label: 'LabPhase',
      icon: FlaskConical,
      children: [
        { href: '/labphase/lab-phase-list', label: 'Lab Phase List' },
        { href: '/labphase/student-projects', label: 'Student Projects' },
      ],
    },
    { href: '/courses', label: 'My Courses', icon: BookOpen },
  ]
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="h-16 bg-canvas border-b border-hairline px-md sm:px-xl flex items-center justify-between gap-md sticky top-0 z-50">
      <div className="flex items-center gap-md sm:gap-xl min-w-0">
        <Link href="/" className="flex items-center gap-3 no-underline shrink-0">
          <Image src="/images/icon.png" alt="e-learning-msc" width={28} height={28} className="object-contain" />
          <span className="hidden md:inline text-heading-sm text-ink font-bold uppercase tracking-[0.144px] leading-none">
            e-learning-msc
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-lg">
          {navLinks.map((link) => {
            if ('children' in link && link.children) {
              const isOpen = openDropdown === link.label
              return (
                <div key={link.label} className="relative">
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : link.label)}
                    className={cn(
                      'flex items-center gap-1 text-button-md text-charcoal hover:text-ink transition-colors py-1 bg-transparent border-none cursor-pointer'
                    )}
                  >
                    {link.label}
                    <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full left-0 mt-1 bg-canvas border border-hairline shadow-sm min-w-[180px] z-50"
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'block px-lg py-md text-body-md text-charcoal hover:bg-surface-soft no-underline',
                              pathname === child.href && 'bg-surface-soft text-ink'
                            )}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            }
            return (
              <Link
                key={link.href}
                href={link.href!}
                className={cn(
                  'flex items-center gap-1 text-button-md text-charcoal hover:text-ink transition-colors no-underline',
                  pathname === link.href && 'text-ink'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-sm sm:gap-md shrink-0">
        <Link
          href={role === 'admin' ? '/admin' : role === 'instructor' ? '/dashboard' : '/dashboard'}
          className="no-underline"
        >
          <Badge variant="default" className="hidden md:inline-flex">{role === 'admin' ? 'Admin View' : role === 'instructor' ? 'Instructor View' : 'Student View'}</Badge>
        </Link>
        <ThemeToggle />

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="bg-transparent border-none cursor-pointer"
          >
            <Avatar name={session?.user?.name ?? 'User'} size="sm" src={session?.user?.image ?? undefined} />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-1 bg-canvas border border-hairline shadow-sm min-w-[220px] z-50 max-w-[calc(100vw-2rem)]">
              <div className="px-lg py-md border-b border-hairline">
                <p className="text-body-sm text-ink font-600">{session?.user?.name ?? 'User'}</p>
                <p className="text-caption text-mute break-words">{session?.user?.email ?? 'user@email.com'}</p>
              </div>
              <div className="py-xs">
                <Link href="/profile" className="w-full flex items-center gap-md px-lg py-sm text-body-md text-charcoal hover:bg-surface-soft no-underline">
                  <Settings className="w-4 h-4" />
                  Account Settings
                </Link>
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-md px-lg py-sm text-body-md text-charcoal hover:bg-surface-soft bg-transparent border-none cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden bg-transparent border-none cursor-pointer text-charcoal"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute top-16 left-0 right-0 bg-canvas border-b border-hairline lg:hidden z-50">
          <div className="flex flex-col p-lg bg-surface-soft">
            {navLinks.map((link) => {
              if ('children' in link && link.children) {
                return (
                  <div key={link.label}>
                    <p className="text-button-md text-charcoal py-sm">{link.label}</p>
                    <div className="pl-lg">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block text-body-md text-charcoal py-sm no-underline hover:text-primary"
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              }
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href!}
                  className="flex items-center gap-2 text-body-md text-charcoal py-sm no-underline hover:text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
