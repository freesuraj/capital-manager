import Link from 'next/link'
import { TrendingUp, TrendingDown, ArrowRight, BarChart3 } from 'lucide-react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PortfolioDonut } from '@/components/charts/portfolio-donut'
import { AccountBar } from '@/components/charts/account-bar'
import type { InvestmentHolding } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function fmtCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

function fmtPct(value: number, signed = true): string {
  const sign = signed ? (value >= 0 ? '+' : '') : ''
  return `${sign}${value.toFixed(2)}%`
}

const TYPE_COLORS: Record<string, string> = {
  stock: '#3b82f6',
  etf: '#10b981',
  bond: '#f59e0b',
  mutual_fund: '#06b6d4',
  crypto: '#8b5cf6',
  real_estate: '#ec4899',
  commodity: '#f97316',
  cash_equivalent: '#64748b',
  other: '#64748b',
}

const ACCOUNT_COLORS: Record<string, string> = {
  taxable: '#3b82f6',
  ira: '#10b981',
  roth_ira: '#8b5cf6',
  '401k': '#f59e0b',
  other: '#64748b',
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    stock: 'Stock',
    etf: 'ETF',
    bond: 'Bond',
    mutual_fund: 'Mutual Fund',
    crypto: 'Crypto',
    real_estate: 'Real Estate',
    commodity: 'Commodity',
    cash_equivalent: 'Cash Equiv.',
    other: 'Other',
  }
  return map[type] ?? type
}

function accountLabel(type: string): string {
  const map: Record<string, string> = {
    taxable: 'Taxable',
    ira: 'IRA',
    roth_ira: 'Roth IRA',
    '401k': '401(k)',
    other: 'Other',
  }
  return map[type] ?? type
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="relative">
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          <BarChart3 size={40} className="text-[#3b82f6]" />
        </div>
        <div
          className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
        >
          <TrendingUp size={18} className="text-[#10b981]" />
        </div>
      </div>
      <div className="max-w-md">
        <h2 className="text-2xl font-bold text-[#e2e8f0] mb-2">No investment holdings yet</h2>
        <p className="text-[#64748b] leading-relaxed">
          Track your stocks, ETFs, bonds, crypto and more in one place. Add your first holding to
          see your portfolio allocation and performance.
        </p>
      </div>
      <Link
        href="/setup"
        className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-white text-sm shadow-lg transition-all duration-150 hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #10b981)' }}
      >
        Add your first investment holding
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PortfolioPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const adminSupabase = createAdminClient()

  const [{ data: holdingsRaw }, { data: assetsRaw }] = await Promise.all([
    adminSupabase.from('investment_holdings').select('*').eq('user_id', user!.id),
    adminSupabase.from('assets').select('*').eq('user_id', user!.id),
  ])

  const holdings = (holdingsRaw as InvestmentHolding[] | null) ?? []
  const totalPortfolioValue = holdings.reduce((s, h) => s + h.current_value, 0)

  if (holdings.length === 0) {
    return (
      <div className="fade-in">
        <PageHeader title="Portfolio" subtitle="Investment holdings & allocation" />
        <EmptyState />
      </div>
    )
  }

  // ── Allocation by type ──────────────────────────────────────────────────────
  const typeGroups: Record<string, number> = {}
  for (const h of holdings) {
    typeGroups[h.type] = (typeGroups[h.type] ?? 0) + h.current_value
  }
  const typeAllocation = Object.entries(typeGroups)
    .map(([type, value]) => ({
      name: typeLabel(type),
      value,
      color: TYPE_COLORS[type] ?? '#64748b',
    }))
    .sort((a, b) => b.value - a.value)

  // ── Allocation by account type ──────────────────────────────────────────────
  const accountGroups: Record<string, number> = {}
  for (const h of holdings) {
    accountGroups[h.account_type] = (accountGroups[h.account_type] ?? 0) + h.current_value
  }
  const accountAllocation = Object.entries(accountGroups)
    .map(([type, value]) => ({
      name: accountLabel(type),
      value,
      color: ACCOUNT_COLORS[type] ?? '#64748b',
    }))
    .sort((a, b) => b.value - a.value)

  // ── Holdings sorted by value ────────────────────────────────────────────────
  const sortedHoldings = [...holdings].sort((a, b) => b.current_value - a.current_value)

  // ── Total gain/loss ─────────────────────────────────────────────────────────
  const totalCostBasis = holdings.reduce((s, h) => s + (h.cost_basis ?? 0), 0)
  const totalGainLoss = totalPortfolioValue - totalCostBasis
  const totalGainPct = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0

  void assetsRaw

  return (
    <div className="fade-in">
      <PageHeader
        title="Portfolio"
        subtitle="Investment holdings & allocation"
        actions={
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#e2e8f0] border border-[#1e2a3a] bg-[#111827] hover:bg-[#1e2a3a] transition-colors duration-150"
          >
            <TrendingUp size={14} />
            Add Holding
          </Link>
        }
      />

      {/* ── Hero: Total Portfolio Value ─────────────────────────────────────── */}
      <div
        className="rounded-2xl p-8 mb-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #111827 0%, #0f1d35 100%)',
          border: '1px solid #1e2a3a',
        }}
      >
        {/* Subtle background glow */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
          }}
        />
        <div className="relative">
          <p className="text-sm font-medium text-[#64748b] uppercase tracking-wider mb-1">
            Total Portfolio Value
          </p>
          <div className="flex items-end gap-4 flex-wrap">
            <span className="text-5xl font-bold text-[#e2e8f0] tabular-nums tracking-tight">
              {fmtCompact(totalPortfolioValue)}
            </span>
            {totalCostBasis > 0 && (
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{
                    background: totalGainLoss >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    border: `1px solid ${totalGainLoss >= 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  }}
                >
                  {totalGainLoss >= 0 ? (
                    <TrendingUp size={14} className="text-[#10b981]" />
                  ) : (
                    <TrendingDown size={14} className="text-[#ef4444]" />
                  )}
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: totalGainLoss >= 0 ? '#10b981' : '#ef4444' }}
                  >
                    {totalGainLoss >= 0 ? '+' : ''}{fmt(totalGainLoss)} ({fmtPct(totalGainPct)})
                  </span>
                </div>
                <span className="text-xs text-[#64748b]">vs cost basis</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6 mt-4 flex-wrap">
            <div>
              <p className="text-xs text-[#64748b]">Holdings</p>
              <p className="text-sm font-semibold text-[#e2e8f0]">{holdings.length}</p>
            </div>
            <div className="w-px h-8" style={{ background: '#1e2a3a' }} />
            <div>
              <p className="text-xs text-[#64748b]">Asset Types</p>
              <p className="text-sm font-semibold text-[#e2e8f0]">{typeAllocation.length}</p>
            </div>
            <div className="w-px h-8" style={{ background: '#1e2a3a' }} />
            <div>
              <p className="text-xs text-[#64748b]">Account Types</p>
              <p className="text-sm font-semibold text-[#e2e8f0]">{accountAllocation.length}</p>
            </div>
            {totalCostBasis > 0 && (
              <>
                <div className="w-px h-8" style={{ background: '#1e2a3a' }} />
                <div>
                  <p className="text-xs text-[#64748b]">Total Cost Basis</p>
                  <p className="text-sm font-semibold text-[#e2e8f0]">{fmtCompact(totalCostBasis)}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Row: Charts ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Allocation by type */}
        <Card>
          <CardHeader>
            <CardTitle>Allocation by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioDonut data={typeAllocation} total={totalPortfolioValue} />
          </CardContent>
        </Card>

        {/* Allocation by account */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Allocation by Account</CardTitle>
              <div className="flex items-center gap-3 text-xs">
                {accountAllocation.map((a) => (
                  <span key={a.name} className="flex items-center gap-1.5 text-[#64748b]">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: a.color }} />
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AccountBar data={accountAllocation} />
            {/* Account breakdown details */}
            <div className="mt-4 flex flex-col gap-2">
              {accountAllocation.map((a) => {
                const pct = totalPortfolioValue > 0 ? (a.value / totalPortfolioValue) * 100 : 0
                return (
                  <div key={a.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.color }} />
                      <span className="text-sm text-[#94a3b8]">{a.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-[#64748b] tabular-nums">{pct.toFixed(1)}%</span>
                      <span className="text-sm font-semibold text-[#e2e8f0] tabular-nums w-28 text-right">
                        {fmt(a.value)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Holdings Table ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Holdings</CardTitle>
            <span className="text-xs text-[#64748b]">{holdings.length} positions</span>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2a3a' }}>
                  {['Ticker / Name', 'Type', 'Account', 'Shares', 'Cost Basis', 'Current Value', 'Gain / Loss'].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: '#64748b' }}
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.map((h, i) => {
                  const gainLoss = h.cost_basis != null ? h.current_value - h.cost_basis : null
                  const gainPct =
                    gainLoss != null && h.cost_basis != null && h.cost_basis > 0
                      ? (gainLoss / h.cost_basis) * 100
                      : null
                  const isPositive = gainLoss == null ? null : gainLoss >= 0
                  const weightPct =
                    totalPortfolioValue > 0 ? (h.current_value / totalPortfolioValue) * 100 : 0

                  return (
                    <tr
                      key={h.id}
                      style={{
                        borderBottom: i < sortedHoldings.length - 1 ? '1px solid #1e2a3a' : 'none',
                      }}
                      className="hover:bg-white/[0.02] transition-colors duration-100"
                    >
                      {/* Ticker / Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                            style={{
                              background: `${TYPE_COLORS[h.type] ?? '#64748b'}18`,
                              color: TYPE_COLORS[h.type] ?? '#64748b',
                              border: `1px solid ${TYPE_COLORS[h.type] ?? '#64748b'}30`,
                            }}
                          >
                            {h.ticker ? h.ticker.slice(0, 2) : h.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#e2e8f0]">{h.ticker ?? '—'}</p>
                            <p className="text-xs text-[#64748b] truncate max-w-[160px]">{h.name}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                          style={{
                            background: `${TYPE_COLORS[h.type] ?? '#64748b'}18`,
                            color: TYPE_COLORS[h.type] ?? '#64748b',
                            border: `1px solid ${TYPE_COLORS[h.type] ?? '#64748b'}30`,
                          }}
                        >
                          {typeLabel(h.type)}
                        </span>
                      </td>

                      {/* Account */}
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                          style={{
                            background: `${ACCOUNT_COLORS[h.account_type] ?? '#64748b'}18`,
                            color: ACCOUNT_COLORS[h.account_type] ?? '#64748b',
                            border: `1px solid ${ACCOUNT_COLORS[h.account_type] ?? '#64748b'}30`,
                          }}
                        >
                          {accountLabel(h.account_type)}
                        </span>
                      </td>

                      {/* Shares */}
                      <td className="px-6 py-4 text-[#94a3b8] tabular-nums">
                        {h.shares != null ? h.shares.toLocaleString('en-US', { maximumFractionDigits: 4 }) : '—'}
                      </td>

                      {/* Cost Basis */}
                      <td className="px-6 py-4 text-[#94a3b8] tabular-nums">
                        {h.cost_basis != null ? fmt(h.cost_basis) : '—'}
                      </td>

                      {/* Current Value */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-[#e2e8f0] tabular-nums">{fmt(h.current_value)}</p>
                          <p className="text-[11px] text-[#64748b] tabular-nums mt-0.5">
                            {weightPct.toFixed(1)}% of portfolio
                          </p>
                        </div>
                      </td>

                      {/* Gain / Loss */}
                      <td className="px-6 py-4">
                        {gainLoss != null ? (
                          <div>
                            <p
                              className="font-semibold tabular-nums"
                              style={{ color: isPositive ? '#10b981' : '#ef4444' }}
                            >
                              {gainLoss >= 0 ? '+' : ''}{fmt(gainLoss)}
                            </p>
                            {gainPct != null && (
                              <p
                                className="text-xs tabular-nums mt-0.5"
                                style={{ color: isPositive ? '#059669' : '#dc2626' }}
                              >
                                {fmtPct(gainPct)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#64748b]">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Footer totals */}
              <tfoot>
                <tr style={{ borderTop: '2px solid #1e2a3a' }}>
                  <td className="px-6 py-4 font-bold text-[#e2e8f0]" colSpan={4}>
                    Total
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#94a3b8] tabular-nums">
                    {totalCostBasis > 0 ? fmt(totalCostBasis) : '—'}
                  </td>
                  <td className="px-6 py-4 font-bold text-[#e2e8f0] tabular-nums">
                    {fmt(totalPortfolioValue)}
                  </td>
                  <td className="px-6 py-4">
                    {totalCostBasis > 0 && (
                      <div>
                        <p
                          className="font-bold tabular-nums"
                          style={{ color: totalGainLoss >= 0 ? '#10b981' : '#ef4444' }}
                        >
                          {totalGainLoss >= 0 ? '+' : ''}{fmt(totalGainLoss)}
                        </p>
                        <p
                          className="text-xs tabular-nums mt-0.5"
                          style={{ color: totalGainLoss >= 0 ? '#059669' : '#dc2626' }}
                        >
                          {fmtPct(totalGainPct)}
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
