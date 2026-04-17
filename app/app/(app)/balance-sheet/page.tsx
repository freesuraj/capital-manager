import Link from 'next/link'
import { Scale, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { NetWorthStackedBar } from '@/components/charts/net-worth-bar'
import type { Asset, Liability } from '@/types'

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

const ASSET_TYPE_COLORS: Record<string, string> = {
  cash: '#10b981',
  savings: '#06b6d4',
  investment: '#3b82f6',
  real_estate: '#8b5cf6',
  retirement: '#f59e0b',
  business: '#ec4899',
  other: '#64748b',
}

const LIABILITY_TYPE_COLORS: Record<string, string> = {
  mortgage: '#ef4444',
  car_loan: '#f97316',
  student_loan: '#f59e0b',
  credit_card: '#ec4899',
  personal_loan: '#8b5cf6',
  business_loan: '#06b6d4',
  other: '#64748b',
}

function assetTypeLabel(type: string): string {
  const map: Record<string, string> = {
    cash: 'Cash',
    savings: 'Savings',
    investment: 'Investments',
    real_estate: 'Real Estate',
    retirement: 'Retirement',
    business: 'Business',
    other: 'Other',
  }
  return map[type] ?? type
}

function liabilityTypeLabel(type: string): string {
  const map: Record<string, string> = {
    mortgage: 'Mortgage',
    car_loan: 'Car Loan',
    student_loan: 'Student Loan',
    credit_card: 'Credit Card',
    personal_loan: 'Personal Loan',
    business_loan: 'Business Loan',
    other: 'Other',
  }
  return map[type] ?? type
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div
        className="w-24 h-24 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
      >
        <Scale size={40} className="text-[#3b82f6]" />
      </div>
      <div className="max-w-md">
        <h2 className="text-2xl font-bold text-[#e2e8f0] mb-2">No balance sheet data yet</h2>
        <p className="text-[#64748b] leading-relaxed">
          Add your assets and liabilities to see your complete financial picture, net worth, and key
          financial ratios.
        </p>
      </div>
      <Link
        href="/setup"
        className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-white text-sm shadow-lg transition-all duration-150 hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
      >
        Add Assets & Liabilities
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}

// ─── Asset Type Section ───────────────────────────────────────────────────────

function AssetSection({
  type,
  assets,
  subtotal,
  totalAssets,
}: {
  type: string
  assets: Asset[]
  subtotal: number
  totalAssets: number
}) {
  const color = ASSET_TYPE_COLORS[type] ?? '#64748b'
  const pct = totalAssets > 0 ? (subtotal / totalAssets) * 100 : 0

  return (
    <div className="mb-4 last:mb-0">
      {/* Section header */}
      <div
        className="flex items-center justify-between px-4 py-2 rounded-lg mb-2"
        style={{ background: `${color}10`, border: `1px solid ${color}20` }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
            {assetTypeLabel(type)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#64748b]">{pct.toFixed(1)}%</span>
          <span className="text-sm font-bold tabular-nums text-[#e2e8f0]">{fmt(subtotal)}</span>
        </div>
      </div>

      {/* Assets in this category */}
      <div className="flex flex-col gap-1 pl-2">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#e2e8f0] font-medium truncate">{asset.name}</p>
              {asset.institution && (
                <p className="text-xs text-[#64748b] truncate">{asset.institution}</p>
              )}
            </div>
            <span className="text-sm font-semibold text-[#e2e8f0] tabular-nums ml-4 shrink-0">
              {fmt(asset.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Liability Type Section ───────────────────────────────────────────────────

function LiabilitySection({
  type,
  liabilities,
  subtotal,
  totalLiabilities,
}: {
  type: string
  liabilities: Liability[]
  subtotal: number
  totalLiabilities: number
}) {
  const color = LIABILITY_TYPE_COLORS[type] ?? '#64748b'
  const pct = totalLiabilities > 0 ? (subtotal / totalLiabilities) * 100 : 0

  return (
    <div className="mb-4 last:mb-0">
      <div
        className="flex items-center justify-between px-4 py-2 rounded-lg mb-2"
        style={{ background: `${color}10`, border: `1px solid ${color}20` }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
            {liabilityTypeLabel(type)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#64748b]">{pct.toFixed(1)}%</span>
          <span className="text-sm font-bold tabular-nums text-[#e2e8f0]">{fmt(subtotal)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 pl-2">
        {liabilities.map((liability) => (
          <div
            key={liability.id}
            className="flex items-start justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#e2e8f0] font-medium truncate">{liability.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {liability.institution && (
                  <span className="text-xs text-[#64748b]">{liability.institution}</span>
                )}
                <span className="text-xs text-[#f59e0b]">{liability.interest_rate.toFixed(2)}% APR</span>
                {liability.monthly_payment > 0 && (
                  <span className="text-xs text-[#64748b]">{fmt(liability.monthly_payment)}/mo</span>
                )}
              </div>
            </div>
            <span className="text-sm font-semibold text-[#ef4444] tabular-nums ml-4 shrink-0">
              {fmt(liability.balance)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Ratio Card ───────────────────────────────────────────────────────────────

function RatioCard({
  label,
  value,
  description,
  status,
  color,
}: {
  label: string
  value: string
  description: string
  status: string
  color: string
}) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-2 relative overflow-hidden"
      style={{ background: '#111827', border: '1px solid #1e2a3a' }}
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}10 0%, transparent 70%)` }}
      />
      <p className="text-xs text-[#64748b] font-medium uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
      <div>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium mb-1"
          style={{
            background: `${color}15`,
            color,
            border: `1px solid ${color}25`,
          }}
        >
          {status}
        </span>
        <p className="text-xs text-[#64748b]">{description}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BalanceSheetPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const adminSupabase = createAdminClient()

  const [{ data: assetsRaw }, { data: liabilitiesRaw }] = await Promise.all([
    adminSupabase.from('assets').select('*').eq('user_id', user!.id),
    adminSupabase.from('liabilities').select('*').eq('user_id', user!.id),
  ])

  const assets = (assetsRaw as Asset[] | null) ?? []
  const liabilities = (liabilitiesRaw as Liability[] | null) ?? []

  const hasData = assets.length > 0 || liabilities.length > 0

  if (!hasData) {
    return (
      <div className="fade-in">
        <PageHeader title="Balance Sheet" subtitle="Assets vs Liabilities" />
        <EmptyState />
      </div>
    )
  }

  // ── Totals ──────────────────────────────────────────────────────────────────
  const totalAssets = assets.reduce((s, a) => s + a.value, 0)
  const totalLiabilities = liabilities.reduce((s, l) => s + l.balance, 0)
  const netWorth = totalAssets - totalLiabilities

  // ── Group assets by type ────────────────────────────────────────────────────
  const assetOrder: Asset['type'][] = ['cash', 'savings', 'investment', 'real_estate', 'retirement', 'business', 'other']
  const assetsByType: Record<string, Asset[]> = {}
  for (const asset of assets) {
    if (!assetsByType[asset.type]) assetsByType[asset.type] = []
    assetsByType[asset.type].push(asset)
  }

  // ── Group liabilities by type ───────────────────────────────────────────────
  const liabilityOrder: Liability['type'][] = ['mortgage', 'car_loan', 'student_loan', 'credit_card', 'personal_loan', 'business_loan', 'other']
  const liabilitiesByType: Record<string, Liability[]> = {}
  for (const liability of liabilities) {
    if (!liabilitiesByType[liability.type]) liabilitiesByType[liability.type] = []
    liabilitiesByType[liability.type].push(liability)
  }

  // ── Net worth bar data ──────────────────────────────────────────────────────
  const netWorthBarData = assetOrder
    .filter((type) => assetsByType[type]?.length > 0)
    .map((type) => ({
      name: assetTypeLabel(type),
      value: assetsByType[type].reduce((s, a) => s + a.value, 0),
      color: ASSET_TYPE_COLORS[type],
    }))

  // ── Ratios ──────────────────────────────────────────────────────────────────
  const debtToAsset = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0
  const leverageRatio = netWorth > 0 ? totalAssets / netWorth : 0
  const liquidAssets = assets
    .filter((a) => a.type === 'cash' || a.type === 'savings')
    .reduce((s, a) => s + a.value, 0)
  const liquidRatio = totalAssets > 0 ? (liquidAssets / totalAssets) * 100 : 0
  const totalMonthlyPayments = liabilities.reduce((s, l) => s + l.monthly_payment, 0)
  const weightedAvgInterest =
    totalLiabilities > 0
      ? liabilities.reduce((s, l) => s + l.interest_rate * l.balance, 0) / totalLiabilities
      : 0

  return (
    <div className="fade-in">
      <PageHeader
        title="Balance Sheet"
        subtitle="Assets vs Liabilities"
        actions={
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#e2e8f0] border border-[#1e2a3a] bg-[#111827] hover:bg-[#1e2a3a] transition-colors duration-150"
          >
            <Scale size={14} />
            Add Entry
          </Link>
        }
      />

      {/* ── Hero Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Total Assets */}
        <div
          className="rounded-xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #052e1c, #0a1f15)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }}
          />
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-[#10b981]" />
            <span className="text-sm text-[#64748b] font-medium">Total Assets</span>
          </div>
          <p className="text-3xl font-bold text-[#e2e8f0] tabular-nums">{fmtCompact(totalAssets)}</p>
          <p className="text-xs text-[#64748b] mt-1">{assets.length} asset{assets.length !== 1 ? 's' : ''} tracked</p>
        </div>

        {/* Total Liabilities */}
        <div
          className="rounded-xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #3b0f0f, #1a0808)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)' }}
          />
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-[#ef4444]" />
            <span className="text-sm text-[#64748b] font-medium">Total Liabilities</span>
          </div>
          <p className="text-3xl font-bold text-[#e2e8f0] tabular-nums">{fmtCompact(totalLiabilities)}</p>
          <p className="text-xs text-[#64748b] mt-1">
            {fmt(totalMonthlyPayments)}/mo in payments
          </p>
        </div>

        {/* Net Worth */}
        <div
          className="rounded-xl p-6 relative overflow-hidden"
          style={{
            background: netWorth >= 0
              ? 'linear-gradient(135deg, #0f1d35, #091429)'
              : 'linear-gradient(135deg, #2d1f00, #1a1200)',
            border: `1px solid ${netWorth >= 0 ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)'}`,
          }}
        >
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${netWorth >= 0 ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)'} 0%, transparent 70%)`,
            }}
          />
          <div className="flex items-center gap-2 mb-3">
            <Scale size={16} style={{ color: netWorth >= 0 ? '#3b82f6' : '#f59e0b' }} />
            <span className="text-sm text-[#64748b] font-medium">Net Worth</span>
          </div>
          <p
            className="text-3xl font-bold tabular-nums"
            style={{ color: netWorth >= 0 ? '#e2e8f0' : '#f59e0b' }}
          >
            {netWorth >= 0 ? '' : '-'}{fmtCompact(Math.abs(netWorth))}
          </p>
          <p className="text-xs text-[#64748b] mt-1">
            {debtToAsset.toFixed(1)}% debt-to-asset ratio
          </p>
        </div>
      </div>

      {/* ── Net Worth Visualization ─────────────────────────────────────────── */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Asset Composition</CardTitle>
        </CardHeader>
        <CardContent>
          <NetWorthStackedBar data={netWorthBarData} total={totalAssets} />
        </CardContent>
      </Card>

      {/* ── Side-by-side tables ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Assets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Assets</CardTitle>
              <span className="text-sm font-bold tabular-nums text-[#10b981]">
                {fmtCompact(totalAssets)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {assetOrder
              .filter((type) => assetsByType[type]?.length > 0)
              .map((type) => {
                const typeAssets = assetsByType[type]
                const subtotal = typeAssets.reduce((s, a) => s + a.value, 0)
                return (
                  <AssetSection
                    key={type}
                    type={type}
                    assets={typeAssets}
                    subtotal={subtotal}
                    totalAssets={totalAssets}
                  />
                )
              })}

            {/* Total */}
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl mt-4"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <span className="font-bold text-[#e2e8f0]">Total Assets</span>
              <span className="text-lg font-bold text-[#10b981] tabular-nums">{fmt(totalAssets)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Liabilities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Liabilities</CardTitle>
              <span className="text-sm font-bold tabular-nums text-[#ef4444]">
                {fmtCompact(totalLiabilities)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {liabilities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
                >
                  <TrendingUp size={20} className="text-[#10b981]" />
                </div>
                <p className="text-sm font-semibold text-[#10b981]">Debt-free!</p>
                <p className="text-xs text-[#64748b]">No liabilities recorded</p>
              </div>
            ) : (
              <>
                {liabilityOrder
                  .filter((type) => liabilitiesByType[type]?.length > 0)
                  .map((type) => {
                    const typeLiabilities = liabilitiesByType[type]
                    const subtotal = typeLiabilities.reduce((s, l) => s + l.balance, 0)
                    return (
                      <LiabilitySection
                        key={type}
                        type={type}
                        liabilities={typeLiabilities}
                        subtotal={subtotal}
                        totalLiabilities={totalLiabilities}
                      />
                    )
                  })}

                {/* Total */}
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl mt-4"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <span className="font-bold text-[#e2e8f0]">Total Liabilities</span>
                  <span className="text-lg font-bold text-[#ef4444] tabular-nums">{fmt(totalLiabilities)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Net Worth Summary Row ───────────────────────────────────────────── */}
      <div
        className="rounded-xl p-6 mb-6 flex items-center justify-between flex-wrap gap-4"
        style={{ background: '#111827', border: '2px solid #1e2a3a' }}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <p className="text-xs text-[#64748b]">Total Assets</p>
            <p className="text-lg font-bold text-[#10b981] tabular-nums">{fmt(totalAssets)}</p>
          </div>
          <div className="text-2xl text-[#64748b] font-light">−</div>
          <div>
            <p className="text-xs text-[#64748b]">Total Liabilities</p>
            <p className="text-lg font-bold text-[#ef4444] tabular-nums">{fmt(totalLiabilities)}</p>
          </div>
          <div className="text-2xl text-[#64748b] font-light">=</div>
          <div>
            <p className="text-xs text-[#64748b]">Net Worth</p>
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: netWorth >= 0 ? '#3b82f6' : '#f59e0b' }}
            >
              {netWorth >= 0 ? '' : '-'}{fmtCompact(Math.abs(netWorth))}
            </p>
          </div>
        </div>
        <Scale size={32} style={{ color: netWorth >= 0 ? '#3b82f6' : '#f59e0b', opacity: 0.6 }} />
      </div>

      {/* ── Key Ratios ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-[#64748b] uppercase tracking-wider mb-3">
          Key Financial Ratios
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <RatioCard
            label="Debt-to-Asset"
            value={`${debtToAsset.toFixed(1)}%`}
            description="Liabilities as % of assets"
            status={debtToAsset <= 30 ? 'Healthy' : debtToAsset <= 60 ? 'Moderate' : 'High'}
            color={debtToAsset <= 30 ? '#10b981' : debtToAsset <= 60 ? '#f59e0b' : '#ef4444'}
          />
          <RatioCard
            label="Leverage Ratio"
            value={`${leverageRatio.toFixed(2)}x`}
            description="Assets per dollar of net worth"
            status={leverageRatio <= 2 ? 'Conservative' : leverageRatio <= 5 ? 'Moderate' : 'High'}
            color={leverageRatio <= 2 ? '#10b981' : leverageRatio <= 5 ? '#f59e0b' : '#ef4444'}
          />
          <RatioCard
            label="Liquid Ratio"
            value={`${liquidRatio.toFixed(1)}%`}
            description="Cash + savings as % of assets"
            status={liquidRatio >= 20 ? 'Strong' : liquidRatio >= 10 ? 'Adequate' : 'Low'}
            color={liquidRatio >= 20 ? '#10b981' : liquidRatio >= 10 ? '#f59e0b' : '#ef4444'}
          />
          <RatioCard
            label="Avg Interest Rate"
            value={`${weightedAvgInterest.toFixed(2)}%`}
            description="Weighted avg on all debt"
            status={weightedAvgInterest === 0 ? 'No Debt' : weightedAvgInterest <= 5 ? 'Low' : weightedAvgInterest <= 10 ? 'Moderate' : 'High'}
            color={weightedAvgInterest === 0 ? '#10b981' : weightedAvgInterest <= 5 ? '#10b981' : weightedAvgInterest <= 10 ? '#f59e0b' : '#ef4444'}
          />
        </div>
      </div>
    </div>
  )
}
