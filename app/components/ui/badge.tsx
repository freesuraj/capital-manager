'use client'

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'outline'

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-[#1e3a5f] text-[#60a5fa] border border-[#1e4a7a]',
  success:
    'bg-[#052e1c] text-[#10b981] border border-[#064e32]',
  warning:
    'bg-[#2d1f00] text-[#f59e0b] border border-[#4a3300]',
  destructive:
    'bg-[#3b0f0f] text-[#ef4444] border border-[#5a1a1a]',
  outline:
    'bg-transparent text-[#94a3b8] border border-[#1e2a3a]',
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
        variantClasses[variant],
        className ?? '',
      ].join(' ')}
    >
      {children}
    </span>
  )
}
