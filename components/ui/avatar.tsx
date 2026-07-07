import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const sizeClasses = {
  sm: 'w-8 h-8 text-button-sm',
  md: 'w-10 h-10 text-button-md',
  lg: 'w-12 h-12 text-button-md',
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary text-on-primary flex items-center justify-center font-700',
        sizeClasses[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
