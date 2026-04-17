'use client'

interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={`bg-[#111827] border border-[#1e2a3a] rounded-xl ${className ?? ''}`}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div className={`px-6 py-4 border-b border-[#1e2a3a] ${className ?? ''}`}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children }: CardProps) {
  return (
    <h3 className={`text-base font-semibold text-[#e2e8f0] ${className ?? ''}`}>
      {children}
    </h3>
  )
}

export function CardContent({ className, children }: CardProps) {
  return (
    <div className={`px-6 py-4 ${className ?? ''}`}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children }: CardProps) {
  return (
    <div className={`px-6 py-4 border-t border-[#1e2a3a] ${className ?? ''}`}>
      {children}
    </div>
  )
}
