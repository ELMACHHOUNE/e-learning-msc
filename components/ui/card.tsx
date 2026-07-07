import { cn } from '@/lib/utils'

interface CardProps {
  variant?: 'light' | 'dark' | 'yellow'
  children: React.ReactNode
  className?: string
}

export function Card({ variant = 'light', children, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-none',
        {
          'bg-canvas text-ink': variant === 'light',
          'bg-surface-dark text-on-dark': variant === 'dark',
          'bg-primary text-on-primary': variant === 'yellow',
        },
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-xxl pb-0', className)}>{children}</div>
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-xxl', className)}>{children}</div>
}
