'use client'

import React from 'react'

type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'destructive' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-[#3b82f6] hover:bg-[#2563eb] text-white border border-[#3b82f6] hover:border-[#2563eb]',
  secondary:
    'bg-[#1e293b] hover:bg-[#243144] text-[#e2e8f0] border border-[#1e2a3a] hover:border-[#2d3f55]',
  ghost:
    'bg-transparent hover:bg-[#1e2a3a] text-[#94a3b8] hover:text-[#e2e8f0] border border-transparent',
  destructive:
    'bg-[#ef4444] hover:bg-[#dc2626] text-white border border-[#ef4444] hover:border-[#dc2626]',
  outline:
    'bg-transparent hover:bg-[#1e2a3a] text-[#3b82f6] border border-[#3b82f6] hover:border-[#60a5fa]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export function Button({
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1e]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className ?? '',
      ].join(' ')}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
