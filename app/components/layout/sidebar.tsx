'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  ArrowLeftRight,
  Scale,
  Target,
  Bot,
  Settings,
  LogOut,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  isAI?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Portfolio', href: '/portfolio', icon: TrendingUp },
  { label: 'Cash Flow', href: '/cash-flow', icon: ArrowLeftRight },
  { label: 'Balance Sheet', href: '/balance-sheet', icon: Scale },
  { label: 'Goals', href: '/goals', icon: Target },
  { label: 'AI Advisor', href: '/advisor', icon: Bot, isAI: true },
]

interface SidebarProps {
  user: User
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const userInitials = user.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'CM'

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 h-screen overflow-y-auto border-r border-[#1e2a3a]"
      style={{ width: '240px', background: '#0d1424' }}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1e2a3a]">
        <div
          className="flex items-center justify-center rounded-lg shrink-0"
          style={{ width: '32px', height: '32px', background: '#3b82f6' }}
          aria-hidden="true"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="2" y="14" width="4" height="8" rx="1" fill="white" />
            <rect x="8" y="9" width="4" height="13" rx="1" fill="white" opacity="0.85" />
            <rect x="14" y="4" width="4" height="18" rx="1" fill="white" opacity="0.7" />
            <rect x="20" y="1" width="4" height="21" rx="1" fill="white" opacity="0.55" />
          </svg>
        </div>
        <span className="text-sm font-bold text-[#e2e8f0] tracking-tight leading-none">
          CapitalManager
        </span>
      </div>

      {/* Primary navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          if (item.isAI) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'text-white'
                    : 'text-[#64748b] hover:text-[#e2e8f0]',
                ].join(' ')}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* AI gradient background */}
                <div
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(6,182,212,0.15) 100%)',
                    opacity: isActive ? 1 : undefined,
                  }}
                  aria-hidden="true"
                />
                {/* Active left border indicator */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full"
                    style={{
                      height: '60%',
                      background: 'linear-gradient(180deg, #3b82f6, #06b6d4)',
                    }}
                    aria-hidden="true"
                  />
                )}
                <Icon
                  size={16}
                  className={[
                    'relative shrink-0 transition-colors duration-150',
                    isActive ? 'text-[#38bdf8]' : 'text-[#64748b] group-hover:text-[#38bdf8]',
                  ].join(' ')}
                />
                <span className="relative">{item.label}</span>
                {/* AI badge */}
                <span
                  className="relative ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(6,182,212,0.25))',
                    color: '#38bdf8',
                    border: '1px solid rgba(56,189,248,0.3)',
                  }}
                >
                  AI
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#1e2a3a] text-white border-l-2 border-[#3b82f6]'
                  : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#111827]',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={16}
                className={[
                  'shrink-0 transition-colors duration-150',
                  isActive ? 'text-[#3b82f6]' : 'text-[#64748b]',
                ].join(' ')}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 h-px bg-[#1e2a3a]" aria-hidden="true" />

      {/* Bottom section */}
      <div className="px-3 py-4 space-y-1">
        {/* Setup / Profile */}
        <Link
          href="/setup"
          className={[
            'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
            pathname === '/setup' || pathname.startsWith('/setup/')
              ? 'bg-[#1e2a3a] text-white border-l-2 border-[#3b82f6]'
              : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#111827]',
          ].join(' ')}
          aria-current={pathname === '/setup' ? 'page' : undefined}
        >
          <Settings
            size={16}
            className={[
              'shrink-0 transition-colors duration-150',
              pathname === '/setup' || pathname.startsWith('/setup/')
                ? 'text-[#3b82f6]'
                : 'text-[#64748b]',
            ].join(' ')}
          />
          Setup / Profile
        </Link>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* Avatar */}
          <div
            className="flex items-center justify-center rounded-full shrink-0 text-xs font-bold text-white"
            style={{
              width: '28px',
              height: '28px',
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            }}
            aria-hidden="true"
          >
            {userInitials}
          </div>
          <span
            className="text-xs text-[#64748b] truncate leading-none"
            title={user.email ?? undefined}
          >
            {user.email}
          </span>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#64748b] hover:text-[#ef4444] hover:bg-[#1a1012] transition-all duration-150 text-left"
          type="button"
        >
          <LogOut size={16} className="shrink-0" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
