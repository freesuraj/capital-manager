import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowRight,
  Bot,
  BarChart3,
  ShieldCheck,
  AlertCircle,
  Landmark,
  CreditCard,
} from 'lucide-react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { NetWorthChart } from '@/components/charts/net-worth-chart'
import { AllocationPie } from '@/components/charts/allocation-pie'
import { CashFlowBar } from '@/components/charts/cashflow-bar'
import type { Asset, Liability, IncomeSource, Expense, PortfolioSnapshot, FinancialSummary, HouseholdMember } from '@/types'

// ─── helpers ────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

function assetTypeColor(type: Asset['type']): string {
  const map: Record<Asset['type'], string> = {
    cash: '#10b981',
    savings: '#06b6d4',
    investment: '#3b82f6',
    real_estate: '#8b5cf6',
    retirement: '#f59e0b',
    business: '#ec4899',
    other: '#64748b',
  }
  return map[type] ?? '#64748b'
}

function buildNetWorthHistory(snapshots: PortfolioSnapshot[]) {
  return snapshots.map((s) => ({
    date: s.date,
    netWorth: s.net_worth,
    assets: s.total_assets,
    liabilities: s.total_liabilities,
  }))
}

function buildAllocationData(assets: Asset[]) {
  const grouped: Record<string, number> = {}
  for (const a of assets) {
    grouped[a.type] = (grouped[a.type] ?? 0) + a.value
  }
  return Object.entries(grouped).map(([type, value]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
    value,
    color: assetTypeColor(type as Asset['type']),
  }))
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      {/* Icon cluster */}
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
        <h2 className="text-2xl font-bold text-[#e2e8f0] mb-2">Your financial command center</h2>
        <p className="text-[#64748b] leading-relaxed">
          Get started by entering your financial data. We'll track your net worth, cash flow, and
          investments — giving you a complete picture of your financial health.
        </p>
      </div>

      {/* CTA button */}
      <Link
        href="/setup"
        className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-white text-sm shadow-lg transition-all duration-150 hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
      >
        Set Up My Profile
        <ArrowRight size={16} />
      </Link>

      {/* Quick feature callouts */}
      <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-lg">
        {[
          { icon: Wallet, label: 'Track Net Worth' },
          { icon: BarChart3, label: 'Analyze Cash Flow' },
          { icon: Bot, label: 'AI Advisor' },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 p-4 rounded-xl"
            style={{ background: '#111827', border: '1px solid #1e2a3a' }}
          >
            <Icon size={20} className="text-[#64748b]" />
            <span className="text-xs text-[#64748b] font-medium text-center">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Quick action card ────────────────────────────────────────────────────────

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  accent,
}: {
  href: string
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>
  title: string
  description: string
  accent: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 p-4 rounded-xl border transition-all duration-150 hover:scale-[1.02]"
      style={{ background: '#111827', borderColor: '#1e2a3a' }}
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0 transition-transform duration-150 group-hover:scale-110"
        style={{ background: `${accent}1a`, border: `1px solid ${accent}33` }}
      >
        <Icon size={18} color={accent} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#e2e8f0]">{title}</p>
        <p className="text-xs text-[#64748b] mt-0.5">{description}</p>
      </div>
      <ArrowRight
        size={14}
        className="text-[#64748b] group-hover:text-[#e2e8f0] group-hover:translate-x-0.5 transition-all duration-150 shrink-0"
      />
    </Link>
  )
}

// ─── Quick stat row ───────────────────────────────────────────────────────────

function QuickStatRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
        style={{ background: `${accent}15` }}
      >
        <Icon size={14} color={accent} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#64748b]">{label}</p>
        <p className="text-sm font-semibold text-[#e2e8f0] tabular-nums">{value}</p>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const adminSupabase = createAdminClient()

  // Parallel data fetching
  const [
    { data: membersRaw },
    { data: assets },
    { data: liabilities },
    { data: incomeSources },
    { data: expenses },
    { data: snapshots },
  ] = await Promise.all([
    adminSupabase.from('household_members').select('*').eq('user_id', user!.id).order('created_at', { ascending: true }),
    adminSupabase.from('assets').select('*').eq('user_id', user!.id),
    adminSupabase.from('liabilities').select('*').eq('user_id', user!.id),
    adminSupabase.from('income_sources').select('*').eq('user_id', user!.id),
    adminSupabase.from('expenses').select('*').eq('user_id', user!.id),
    supabase
      .from('portfolio_snapshots')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: true })
      .limit(24),
  ])
  const members = (membersRaw as HouseholdMember[] | null) ?? []
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]))

  // Compute summary
  const totalAssets = (assets as Asset[] | null)?.reduce((s, a) => s + a.value, 0) ?? 0
  const totalLiabilities = (liabilities as Liability[] | null)?.reduce((s, l) => s + l.balance, 0) ?? 0
  const totalMonthlyIncome = (incomeSources as IncomeSource[] | null)?.reduce((s, i) => s + i.monthly_amount, 0) ?? 0
  const totalMonthlyExpenses = (expenses as Expense[] | null)?.reduce((s, e) => s + e.monthly_equivalent, 0) ?? 0
  const netWorth = totalAssets - totalLiabilities
  const monthlyCashFlow = totalMonthlyIncome - totalMonthlyExpenses
  const savingsRate = totalMonthlyIncome > 0 ? (monthlyCashFlow / totalMonthlyIncome) * 100 : 0
  const totalInvestments =
    (assets as Asset[] | null)
      ?.filter((a) => ['investment', 'retirement'].includes(a.type))
      .reduce((s, a) => s + a.value, 0) ?? 0
  const totalCash =
    (assets as Asset[] | null)
      ?.filter((a) => ['cash', 'savings'].includes(a.type))
      .reduce((s, a) => s + a.value, 0) ?? 0
  const debtToIncomeRatio =
    totalMonthlyIncome > 0 ? (totalLiabilities / (totalMonthlyIncome * 12)) * 100 : 0
  const emergencyFundMonths =
    totalMonthlyExpenses > 0 ? totalCash / totalMonthlyExpenses : 0

  const summary: FinancialSummary = {
    totalAssets,
    totalLiabilities,
    netWorth,
    totalMonthlyIncome,
    totalMonthlyExpenses,
    monthlyCashFlow,
    totalInvestments,
    totalCash,
    debtToIncomeRatio,
    savingsRate,
    emergencyFundMonths,
  }

  const hasData =
    (assets?.length ?? 0) > 0 ||
    (incomeSources?.length ?? 0) > 0 ||
    (expenses?.length ?? 0) > 0

  // Derived chart data
  const netWorthHistory = buildNetWorthHistory((snapshots as PortfolioSnapshot[]) ?? [])
  const allocationData = buildAllocationData((assets as Asset[]) ?? [])

  // Top income source / expense
  const topIncome = (incomeSources as IncomeSource[] | null)?.sort(
    (a, b) => b.monthly_amount - a.monthly_amount
  )[0]
  const topExpense = (expenses as Expense[] | null)?.sort(
    (a, b) => b.monthly_equivalent - a.monthly_equivalent
  )[0]

  // Sparkline trend from snapshots (last 8 points)
  const sparkTrend = netWorthHistory.slice(-8).map((s) => s.netWorth)

  return (
    <div className="fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Your financial command center"
        actions={
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#e2e8f0] border border-[#1e2a3a] bg-[#111827] hover:bg-[#1e2a3a] transition-colors duration-150"
          >
            <PiggyBank size={14} />
            Add Data
          </Link>
        }
      />

      {!hasData ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-6">
          {/* ── Row 1: Stat cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Net Worth"
              value={formatCurrency(summary.netWorth)}
              trend={sparkTrend.length > 1 ? sparkTrend : undefined}
              positive={summary.netWorth >= 0}
            />
            <StatCard
              label="Monthly Cash Flow"
              value={formatCurrency(summary.monthlyCashFlow)}
              positive={summary.monthlyCashFlow >= 0}
              changePercent={
                summary.totalMonthlyIncome > 0
                  ? (summary.monthlyCashFlow / summary.totalMonthlyIncome) * 100
                  : undefined
              }
            />
            <StatCard
              label="Total Investments"
              value={formatCurrency(summary.totalInvestments)}
              positive
            />
            <StatCard
              label="Savings Rate"
              value={`${summary.savingsRate.toFixed(1)}%`}
              positive={summary.savingsRate >= 20}
              changePercent={summary.savingsRate > 0 ? summary.savingsRate : undefined}
            />
          </div>

          {/* ── Row 2: Net Worth Chart + Allocation Pie ─────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Net Worth Chart — 2/3 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Net Worth Over Time</CardTitle>
                  <span className="text-xs text-[#64748b]">
                    {netWorthHistory.length > 0
                      ? `${netWorthHistory.length} data points`
                      : 'Sample data'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <NetWorthChart data={netWorthHistory} />
              </CardContent>
            </Card>

            {/* Asset Allocation — 1/3 */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                {allocationData.length > 0 ? (
                  <AllocationPie data={allocationData} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] gap-2">
                    <div
                      className="w-12 h-12 rounded-full border-2 border-dashed"
                      style={{ borderColor: '#1e2a3a' }}
                    />
                    <p className="text-xs text-[#64748b]">No assets yet</p>
                    <Link
                      href="/setup"
                      className="text-xs text-[#3b82f6] hover:underline"
                    >
                      Add your first asset
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Row 3: Cash Flow Chart + Quick Stats ───────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cash Flow Bar */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Cash Flow</CardTitle>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-[#10b981] font-semibold">
                      ↑ {formatCurrency(summary.totalMonthlyIncome)}/mo
                    </span>
                    <span className="text-[#ef4444] font-semibold">
                      ↓ {formatCurrency(summary.totalMonthlyExpenses)}/mo
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CashFlowBar
                  income={summary.totalMonthlyIncome}
                  expenses={summary.totalMonthlyExpenses}
                />
              </CardContent>
            </Card>

            {/* Quick stats panel */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-5">
                  {/* Emergency fund */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-[#64748b]">
                        <ShieldCheck size={14} className="text-[#10b981]" />
                        Emergency Fund
                      </div>
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{
                          color:
                            summary.emergencyFundMonths >= 6
                              ? '#10b981'
                              : summary.emergencyFundMonths >= 3
                              ? '#f59e0b'
                              : '#ef4444',
                        }}
                      >
                        {summary.emergencyFundMonths.toFixed(1)} months
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: '#1e2a3a' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, (summary.emergencyFundMonths / 6) * 100)}%`,
                          background:
                            summary.emergencyFundMonths >= 6
                              ? '#10b981'
                              : summary.emergencyFundMonths >= 3
                              ? '#f59e0b'
                              : '#ef4444',
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-[#64748b] mt-1">Target: 6 months</p>
                  </div>

                  {/* Debt-to-Income */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-[#64748b]">
                        <AlertCircle size={14} className="text-[#f59e0b]" />
                        Debt-to-Income
                      </div>
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{
                          color:
                            summary.debtToIncomeRatio <= 36
                              ? '#10b981'
                              : summary.debtToIncomeRatio <= 50
                              ? '#f59e0b'
                              : '#ef4444',
                        }}
                      >
                        {summary.debtToIncomeRatio.toFixed(1)}%
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: '#1e2a3a' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, summary.debtToIncomeRatio)}%`,
                          background:
                            summary.debtToIncomeRatio <= 36
                              ? '#10b981'
                              : summary.debtToIncomeRatio <= 50
                              ? '#f59e0b'
                              : '#ef4444',
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-[#64748b] mt-1">
                      Target: {'<'}36%
                    </p>
                  </div>

                  <div className="h-px" style={{ background: '#1e2a3a' }} />

                  {/* Top income */}
                  <QuickStatRow
                    icon={Landmark}
                    label="Top Income Source"
                    value={
                      topIncome
                        ? `${topIncome.name} · ${formatCurrency(topIncome.monthly_amount)}/mo`
                        : '—'
                    }
                    accent="#10b981"
                  />

                  {/* Top expense */}
                  <QuickStatRow
                    icon={CreditCard}
                    label="Largest Expense"
                    value={
                      topExpense
                        ? `${topExpense.name} · ${formatCurrency(topExpense.monthly_equivalent)}/mo`
                        : '—'
                    }
                    accent="#ef4444"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Row 4: Quick Actions ───────────────────────────────────── */}
          <div>
            <h2 className="text-sm font-semibold text-[#64748b] uppercase tracking-wider mb-3">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <QuickActionCard
                href="/setup"
                icon={PiggyBank}
                title="Add Financial Data"
                description="Update assets, income & expenses"
                accent="#3b82f6"
              />
              <QuickActionCard
                href="/portfolio"
                icon={TrendingUp}
                title="View Portfolio"
                description="Analyze your investment holdings"
                accent="#10b981"
              />
              <QuickActionCard
                href="/advisor"
                icon={Bot}
                title="Talk to AI Advisor"
                description="Get personalized financial guidance"
                accent="#06b6d4"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
