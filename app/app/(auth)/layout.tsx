import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — CapitalManager',
  description: 'Sign in to your CapitalManager account.',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f1e] relative overflow-hidden">
      {/* Radial gradient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Subtle grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Logo / wordmark at top */}
      <div className="relative z-10 flex flex-col items-center mb-8 select-none">
        <div className="flex items-center gap-3">
          {/* Icon mark */}
          <div className="w-9 h-9 rounded-lg bg-[#3b82f6] flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polyline
                points="2,14 7,8 11,11 18,4"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <polyline
                points="14,4 18,4 18,8"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <span className="text-xl font-bold text-[#e2e8f0] tracking-tight">
            Capital<span className="text-[#3b82f6]">Manager</span>
          </span>
        </div>
        <p className="mt-1 text-xs text-[#64748b] tracking-wide">Personal Finance OS</p>
      </div>

      {/* Page content */}
      <div className="relative z-10 w-full">{children}</div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-xs text-[#475569]">
        &copy; {new Date().getFullYear()} CapitalManager. All rights reserved.
      </p>
    </div>
  )
}
