import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Wallet,
  CheckCircle2,
  XCircle,
  Minus,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CashflowPie, type PieSlice } from '@/components/charts/cashflow-pie'
import type { IncomeSource, Expense } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function fmtFull(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  housing: '#3b82f6',
  transport: '#f59e0b',
  food: '#10b981',
  utilities: '#8b5cf6',
  insurance: '#06b6d4',
  healthcare: '#ef4444',
  entertainment: '#ec4899',
  education: '#84cc16',
  savings: '#10b981',
  debt_payment: '#f97316',
  other: '#64748b',
}

const INCOME_TYPE_COLORS: Record<string, string> = {
  salary: '#3b82f6',
  freelance: '#10b981',
  rental: '#8b5cf6',
  dividends: '#f59e0b',
  business: '#06b6d4',
  side_hustle: '#ec4899',
  other: '#64748b',
}

function incomeTypeVariant(type: string): 'default' | 'success' | 'warning' | 'outline' {
  const map: Record<string, 'default' | 'success' | 'warning' | 'outline'> = {
    salary: 'default',
    freelance: 'success',
    rental: 'warning',
    dividends: 'warning',
    business: 'default',
    side_hustle: 'success',
    other: 'outline',
  }
  return map[type] ?? 'outline'
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function HeroStat({
  label,
  value,
  sub,
  accent,
  icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  accent: string
  icon: React.ComponentType<{ size?: number; color?: string }>
}) {
  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-3 relative overflow-hidden"
      style={{ background: '#111827', border: '1px solid #1e2a3a' }}
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)` }}
      />
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#64748b] font-medium">{label}</span>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          <Icon size={16} color={accent} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-[#e2e8f0] tabular-nums tracking-tight">{value}</p>
        {sub && <p className="text-xs text-[#64748b] mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Waterfall ────────────────────────────────────────────────────────────────

function SavingsWaterfall({
  income,
  expenses,
  savings,
}: {
  income: number
  expenses: number
  savings: number
}) {
  const pctExpenses = income > 0 ? Math.min(100, (expenses / income) * 100) : 0
  const pctSavings = income > 0 ? Math.max(0, Math.min(100, (savings / income) * 100)) : 0
  const savingsPositive = savings >= 0

  return (
    <div className="flex flex-col gap-4">
      {/* Visual bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#64748b] font-medium">Income distribution</span>
          <span className="text-xs text-[#64748b]">{fmt(income)}/mo</span>
        </div>
        <div className="h-8 rounded-xl overflow-hidden flex" style={{ background: '#0a0f1e' }}>
          <div
            className="h-full flex items-center justify-center text-xs font-semibold text-white transition-all duration-700"
            style={{ width: `${pctExpenses}%`, background: '#ef4444', minWidth: pctExpenses > 5 ? '0' : '0' }}
          >
            {pctExpenses > 15 && `${pctExpenses.toFixed(0)}%`}
          </div>
          <div
            className="h-full flex items-center justify-center text-xs font-semibold text-white transition-all duration-700"
            style={{
              width: `${Math.abs(pctSavings)}%`,
              background: savingsPositive ? '#10b981' : '#f59e0b',
            }}
          >
            {Math.abs(pctSavings) > 10 && `${pctSavings.toFixed(0)}%`}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
            Expenses {pctExpenses.toFixed(0)}%
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
            <span className="w-2 h-2 rounded-full" style={{ background: savingsPositive ? '#10b981' : '#f59e0b' }} />
            {savingsPositive ? 'Savings' : 'Deficit'} {Math.abs(pctSavings).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Flow steps */}
      <div className="flex flex-col gap-1">
        {[
          { label: 'Monthly Income', value: income, color: '#10b981', icon: ArrowUpRight },
          { label: 'Monthly Expenses', value: -expenses, color: '#ef4444', icon: ArrowDownRight },
          { label: 'Net Cash Flow', value: savings, color: savingsPositive ? '#3b82f6' : '#f59e0b', icon: savingsPositive ? ArrowUpRight : ArrowDownRight },
        ].map(({ label, value, color, icon: Icon }, i) => (
          <div key={label}>
            {i === 2 && <div className="h-px my-2" style={{ background: '#1e2a3a' }} />}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}15` }}
                >
                  <Icon size={13} color={color} />
                </div>
                <span className="text-sm text-[#94a3b8]">{label}</span>
              </div>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color }}
              >
                {value >= 0 ? '+' : ''}{fmtFull(value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div
        className="w-24 h-24 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
      >
        <Wallet size={40} className="text-[#10b981]" />
      </div>
      <div className="max-w-md">
        <h2 className="text-2xl font-bold text-[#e2e8f0] mb-2">No cash flow data yet</h2>
        <p className="text-[#64748b] leading-relaxed">
          Add your income sources and expenses to see your monthly cash flow, savings rate, and
          spending breakdown.
        </p>
      </div>
      <Link
        href="/setup"
        className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-white text-sm shadow-lg transition-all duration-150 hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}
      >
        Add Income & Expenses
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CashFlowPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const adminSupabase = createAdminClient()

  const [{ data: incomeRaw }, { data: expensesRaw }] = await Promise.all([
    adminSupabase.from('income_sources').select('*').eq('user_id', user!.id),
    adminSupabase.from('expenses').select('*').eq('user_id', user!.id),
  ])

  const incomeSources = (incomeRaw as IncomeSource[] | null) ?? []
  const expenses = (expensesRaw as Expense[] | null) ?? []

  const hasData = incomeSources.length > 0 || expenses.length > 0

  if (!hasData) {
    return (
      <div className="fade-in">
        <PageHeader title="Cash Flow" subtitle="Income vs Expenses" />
        <EmptyState />
      </div>
    )
  }

  // ── Totals ──────────────────────────────────────────────────────────────────
  const activeIncome = incomeSources.filter((i) => i.is_active)
  const totalIncome = activeIncome.reduce((s, i) => s + i.monthly_amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.monthly_equivalent, 0)
  const netCashFlow = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0

  const essentialExpenses = expenses.filter((e) => e.is_essential).reduce((s, e) => s + e.monthly_equivalent, 0)
  const discretionaryExpenses = totalExpenses - essentialExpenses

  // ── Chart data ──────────────────────────────────────────────────────────────
  // Income by type
  const incomeByType: Record<string, number> = {}
  for (const i of activeIncome) {
    incomeByType[i.type] = (incomeByType[i.type] ?? 0) + i.monthly_amount
  }
  const incomePieData: PieSlice[] = Object.entries(incomeByType)
    .map(([type, value]) => ({
      name: type.replace('_', ' '),
      value,
      color: INCOME_TYPE_COLORS[type] ?? '#64748b',
    }))
    .sort((a, b) => b.value - a.value)

  // Expenses by category
  const expByCategory: Record<string, number> = {}
  for (const e of expenses) {
    expByCategory[e.category] = (expByCategory[e.category] ?? 0) + e.monthly_equivalent
  }
  const expensePieData: PieSlice[] = Object.entries(expByCategory)
    .map(([cat, value]) => ({
      name: cat.replace('_', ' '),
      value,
      color: EXPENSE_CATEGORY_COLORS[cat] ?? '#64748b',
    }))
    .sort((a, b) => b.value - a.value)

  // ── Sorted lists ────────────────────────────────────────────────────────────
  const sortedIncome = [...incomeSources].sort((a, b) => b.monthly_amount - a.monthly_amount)
  const sortedExpenses = [...expenses].sort((a, b) => b.monthly_equivalent - a.monthly_equivalent)

  return (
    <div className="fade-in">
      <PageHeader
        title="Cash Flow"
        subtitle="Income vs Expenses"
        actions={
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#e2e8f0] border border-[#1e2a3a] bg-[#111827] hover:bg-[#1e2a3a] transition-colors duration-150"
          >
            <Wallet size={14} />
            Add Entry
          </Link>
        }
      />

      {/* ── Hero Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <HeroStat
          label="Total Monthly Income"
          value={fmt(totalIncome)}
          sub={`${activeIncome.length} active source${activeIncome.length !== 1 ? 's' : ''}`}
          accent="#10b981"
          icon={TrendingUp}
        />
        <HeroStat
          label="Total Monthly Expenses"
          value={fmt(totalExpenses)}
          sub={`${expenses.length} expense${expenses.length !== 1 ? 's' : ''} tracked`}
          accent="#ef4444"
          icon={TrendingDown}
        />
        <HeroStat
          label="Net Cash Flow"
          value={`${netCashFlow >= 0 ? '+' : ''}${fmt(netCashFlow)}`}
          sub={`${savingsRate.toFixed(1)}% savings rate`}
          accent={netCashFlow >= 0 ? '#3b82f6' : '#f59e0b'}
          icon={netCashFlow >= 0 ? TrendingUp : TrendingDown}
        />
      </div>

      {/* ── Two-column income / expenses lists ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Income Sources */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Income Sources</CardTitle>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: '#10b981' }}
              >
                {fmt(totalIncome)}/mo
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <div className="divide-y" style={{ borderColor: '#1e2a3a' }}>
              {sortedIncome.map((source) => {
                const pct = totalIncome > 0 ? (source.monthly_amount / totalIncome) * 100 : 0
                return (
                  <div
                    key={source.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors duration-100"
                  >
                    {/* Active indicator */}
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: source.is_active ? '#10b981' : '#64748b' }}
                      title={source.is_active ? 'Active' : 'Inactive'}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[#e2e8f0] truncate">
                          {source.name}
                        </span>
                        {!source.is_active && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={incomeTypeVariant(source.type)}>
                          {source.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-[#64748b]">{pct.toFixed(0)}% of income</span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: '#1e2a3a' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: source.is_active
                              ? INCOME_TYPE_COLORS[source.type] ?? '#3b82f6'
                              : '#64748b',
                          }}
                        />
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className="text-sm font-bold tabular-nums"
                        style={{ color: source.is_active ? '#10b981' : '#64748b' }}
                      >
                        {fmt(source.monthly_amount)}
                      </p>
                      <p className="text-xs text-[#64748b]">/month</p>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Total row */}
            <div
              className="flex items-center justify-between px-6 py-3"
              style={{ borderTop: '1px solid #1e2a3a', background: 'rgba(16,185,129,0.04)' }}
            >
              <span className="text-sm font-semibold text-[#64748b]">Active Total</span>
              <span className="text-sm font-bold text-[#10b981] tabular-nums">{fmt(totalIncome)}/mo</span>
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Expenses</CardTitle>
              <span className="text-sm font-bold tabular-nums" style={{ color: '#ef4444' }}>
                {fmt(totalExpenses)}/mo
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <div className="divide-y" style={{ borderColor: '#1e2a3a' }}>
              {sortedExpenses.map((expense) => {
                const pct = totalExpenses > 0 ? (expense.monthly_equivalent / totalExpenses) * 100 : 0
                const catColor = EXPENSE_CATEGORY_COLORS[expense.category] ?? '#64748b'
                return (
                  <div
                    key={expense.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors duration-100"
                  >
                    {/* Essential / discretionary */}
                    <div title={expense.is_essential ? 'Essential' : 'Discretionary'}>
                      {expense.is_essential ? (
                        <CheckCircle2 size={16} className="text-[#10b981] shrink-0" />
                      ) : (
                        <Minus size={16} className="text-[#64748b] shrink-0" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[#e2e8f0] truncate">
                          {expense.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize"
                          style={{
                            background: `${catColor}18`,
                            color: catColor,
                            border: `1px solid ${catColor}30`,
                          }}
                        >
                          {expense.category.replace('_', ' ')}
                        </span>
                        <Badge variant={expense.is_essential ? 'success' : 'outline'}>
                          {expense.is_essential ? 'Essential' : 'Discretionary'}
                        </Badge>
                        <span className="text-xs text-[#64748b]">{expense.frequency}</span>
                      </div>
                      <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: '#1e2a3a' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: catColor }}
                        />
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums text-[#ef4444]">
                        {fmt(expense.monthly_equivalent)}
                      </p>
                      <p className="text-xs text-[#64748b]">/month</p>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Totals */}
            <div
              className="px-6 py-3 flex flex-col gap-1"
              style={{ borderTop: '1px solid #1e2a3a', background: 'rgba(239,68,68,0.04)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748b]">
                  <CheckCircle2 size={10} className="inline mr-1 text-[#10b981]" />
                  Essential
                </span>
                <span className="text-xs font-semibold text-[#94a3b8] tabular-nums">{fmt(essentialExpenses)}/mo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748b]">
                  <XCircle size={10} className="inline mr-1 text-[#64748b]" />
                  Discretionary
                </span>
                <span className="text-xs font-semibold text-[#94a3b8] tabular-nums">{fmt(discretionaryExpenses)}/mo</span>
              </div>
              <div className="flex items-center justify-between mt-1 pt-1" style={{ borderTop: '1px solid #1e2a3a' }}>
                <span className="text-sm font-semibold text-[#64748b]">Total</span>
                <span className="text-sm font-bold text-[#ef4444] tabular-nums">{fmt(totalExpenses)}/mo</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Income breakdown pie */}
        <Card>
          <CardHeader>
            <CardTitle>Income by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <CashflowPie data={incomePieData} total={totalIncome} label="Total" />
          </CardContent>
        </Card>

        {/* Expenses breakdown pie */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CashflowPie data={expensePieData} total={totalExpenses} label="Total" />
          </CardContent>
        </Card>

        {/* Savings waterfall */}
        <Card>
          <CardHeader>
            <CardTitle>Savings Waterfall</CardTitle>
          </CardHeader>
          <CardContent>
            <SavingsWaterfall
              income={totalIncome}
              expenses={totalExpenses}
              savings={netCashFlow}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Key insights ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Savings Rate',
            value: `${savingsRate.toFixed(1)}%`,
            sub: savingsRate >= 20 ? 'Great!' : savingsRate >= 10 ? 'Good' : 'Needs work',
            color: savingsRate >= 20 ? '#10b981' : savingsRate >= 10 ? '#f59e0b' : '#ef4444',
          },
          {
            label: 'Essential Ratio',
            value: `${totalExpenses > 0 ? ((essentialExpenses / totalExpenses) * 100).toFixed(0) : 0}%`,
            sub: 'of expenses essential',
            color: '#3b82f6',
          },
          {
            label: 'Expense Ratio',
            value: `${totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(0) : 0}%`,
            sub: 'of income spent',
            color: totalIncome > 0 && (totalExpenses / totalIncome) < 0.8 ? '#10b981' : '#ef4444',
          },
          {
            label: 'Monthly Surplus',
            value: fmt(Math.max(0, netCashFlow)),
            sub: netCashFlow < 0 ? 'In deficit' : 'Available to invest',
            color: netCashFlow >= 0 ? '#10b981' : '#ef4444',
          },
        ].map(({ label, value, sub, color }) => (
          <div
            key={label}
            className="rounded-xl p-4"
            style={{ background: '#111827', border: '1px solid #1e2a3a' }}
          >
            <p className="text-xs text-[#64748b] mb-1">{label}</p>
            <p className="text-xl font-bold tabular-nums" style={{ color }}>{value}</p>
            <p className="text-xs text-[#64748b] mt-1">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
