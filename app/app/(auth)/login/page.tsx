'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      router.push('/dashboard')
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4">
      <div className="bg-[#111827] border border-[#1e2a3a] rounded-2xl shadow-xl shadow-black/40 overflow-hidden">
        {/* Card header */}
        <div className="px-8 pt-8 pb-6 border-b border-[#1e2a3a]">
          <h1 className="text-lg font-semibold text-[#e2e8f0]">Welcome back</h1>
          <p className="mt-1 text-sm text-[#64748b]">
            Sign in to your CapitalManager account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5" noValidate>
          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg bg-[#3b0f0f] border border-[#5a1a1a] px-4 py-3"
            >
              <svg
                className="mt-0.5 shrink-0 text-[#ef4444]"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-[#ef4444]">{error}</p>
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[#94a3b8]">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              className="w-full rounded-lg bg-[#0f172a] border border-[#1e2a3a] px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#475569] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent disabled:opacity-50"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-[#94a3b8]">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full rounded-lg bg-[#0f172a] border border-[#1e2a3a] px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#475569] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent disabled:opacity-50"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="default"
            size="lg"
            loading={loading}
            className="w-full mt-1 shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        {/* Footer link */}
        <div className="px-8 pb-7 text-center">
          <p className="text-sm text-[#64748b]">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-[#3b82f6] hover:text-[#60a5fa] font-medium transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>

      {/* Divider + OAuth placeholder */}
      <div className="mt-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-[#1e2a3a]" />
        <span className="text-xs text-[#475569]">or continue with</span>
        <div className="flex-1 h-px bg-[#1e2a3a]" />
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setError(null)
          setLoading(true)
          const supabase = createClient()
          const { error: oauthError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback` },
          })
          if (oauthError) {
            setError(oauthError.message)
            setLoading(false)
          }
        }}
        className="mt-4 w-full flex items-center justify-center gap-3 rounded-xl bg-[#111827] border border-[#1e2a3a] hover:border-[#2d3f55] hover:bg-[#1a2332] px-4 py-2.5 text-sm font-medium text-[#e2e8f0] transition-all disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>
    </div>
  )
}
