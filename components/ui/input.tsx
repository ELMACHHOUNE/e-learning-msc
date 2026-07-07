'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-body-sm text-charcoal mb-xxs">
            {label}
          </label>
        )}
        <input
          id={id}
          className={cn(
            'flex h-12 w-full bg-canvas text-ink text-body-md px-md pt-sm pb-sm',
            'border-b border-hairline-strong rounded-none',
            'placeholder:text-ash',
            'focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-ink',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error focus-visible:border-error',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-caption text-error">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input, type InputProps }
