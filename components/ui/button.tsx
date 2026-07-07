'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary-dark' | 'outline-dark' | 'outline-light' | 'pill' | 'icon-square'
  size?: 'default' | 'sm' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap font-700 transition-colors disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-on-primary text-button-md rounded-xs hover:bg-primary-deep active:bg-primary-deep':
              variant === 'primary',
            'bg-surface-dark text-on-dark text-button-md rounded-xs hover:opacity-90 active:opacity-80':
              variant === 'secondary-dark',
            'bg-canvas text-ink border border-hairline-strong text-button-md rounded-xs hover:bg-surface-soft':
              variant === 'outline-dark',
            'bg-surface-dark text-on-dark border border-on-dark text-button-md rounded-xs hover:bg-surface-deep':
              variant === 'outline-light',
            'bg-canvas text-ink border border-hairline-strong text-button-sm rounded-pill h-9 px-4 hover:bg-surface-soft':
              variant === 'pill',
            'bg-canvas border border-hairline-strong rounded-xs w-10 h-10 hover:bg-surface-soft':
              variant === 'icon-square',
          },
          {
            'h-12 px-6 py-3.5': size === 'default',
            'h-9 px-4 py-2 text-button-sm': size === 'sm',
            'h-14 px-8 py-4 text-button-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, type ButtonProps }
