import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'new' | 'default' | 'success' | 'warning' | 'error' | 'info'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-button-md rounded-full px-3.5 py-1.5',
        {
          'bg-primary text-on-primary': variant === 'new',
          'bg-surface-soft text-charcoal': variant === 'default',
          'bg-success/10 text-success': variant === 'success',
          'bg-warning/10 text-warning': variant === 'warning',
          'bg-error/10 text-error': variant === 'error',
          'bg-info/10 text-info': variant === 'info',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
