import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function safeUrl(url: string | undefined | null): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return url
  return ''
}

export function safeMailto(email: string | undefined | null): string {
  if (!email) return ''
  const cleaned = email.replace(/[^a-zA-Z0-9@._+-]/g, '')
  if (!cleaned.includes('@')) return ''
  return `mailto:${cleaned}`
}

export function safePhoneUrl(phone: string | undefined | null): string {
  if (!phone) return ''
  const cleaned = phone.replace(/[^0-9]/g, '')
  if (!cleaned) return ''
  return `https://wa.me/${cleaned}`
}
