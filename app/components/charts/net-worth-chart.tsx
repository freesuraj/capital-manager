'use client'

import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

interface DataPoint {
  date: string
  netWorth: number
  assets: number
  liabilities: number
}

interface NetWorthChartProps {
  data: DataPoint[]
}

type Period = '1M' | '3M' | '6M' | '1Y' | 'ALL'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function formatAxisDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function generateSampleData(): DataPoint[] {
  const points: DataPoint[] = []
  const now = new Date()
  let assets = 280_000
  let liabilities = 95_000

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    assets = assets * (1 + (Math.random() * 0.04 - 0.005))
    liabilities = liabilities * (1 - 0.005 + Math.random() * 0.002)
    points.push({
      date: d.toISOString().slice(0, 10),
      assets: Math.round(assets),
      liabilities: Math.round(liabilities),
      netWorth: Math.round(assets - liabilities),
    })
  }
  return points
}

function filterByPeriod(data: DataPoint[], period: Period): DataPoint[] {
  if (period === 'ALL' || data.length === 0) return data
  const months: Record<Period, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12, ALL: 9999 }
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months[period])
  return data.filter((d) => new Date(d.date) >= cutoff)
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

interface TooltipEntry {
  dataKey?: string
  value?: number | string
}

interface TooltipState {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipState) {
  if (!active || !payload?.length || !label) return null

  const assets = payload.find((p) => p.dataKey === 'assets')?.value ?? 0
  const netWorth = payload.find((p) => p.dataKey === 'netWorth')?.value ?? 0

  return (
    <div
      className="rounded-xl border px-4 py-3 text-sm shadow-xl"
      style={{ background: '#111827', borderColor: '#1e2a3a', minWidth: '170px' }}
    >
      <p className="text-xs font-semibold text-[#64748b] mb-2 uppercase tracking-wider">
        {formatAxisDate(label)}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#64748b]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#3b82f6]" />
            Assets
          </span>
          <span className="font-semibold text-[#e2e8f0]">{formatCurrency(Number(assets))}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#64748b]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#06b6d4]" />
            Net Worth
          </span>
          <span className="font-semibold text-[#06b6d4]">
            {formatCurrency(Number(netWorth))}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NetWorthChart({ data }: NetWorthChartProps) {
  const [period, setPeriod] = useState<Period>('1Y')

  const displayData = useMemo(() => {
    const source = data.length > 0 ? data : generateSampleData()
    return filterByPeriod(source, period)
  }, [data, period])

  const isSample = data.length === 0
  const periods: Period[] = ['1M', '3M', '6M', '1Y', 'ALL']

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-[#64748b]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 rounded-full bg-[#3b82f6]" />
            Total Assets
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 rounded-full bg-[#06b6d4]" />
            Net Worth
          </span>
          {isSample && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium text-[#f59e0b] bg-[#451a03] border border-[#78350f]">
              Sample Data
            </span>
          )}
        </div>

        {/* Period selector */}
        <div
          className="flex items-center gap-1 p-1 rounded-lg"
          style={{ background: '#0a0f1e' }}
        >
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={[
                'px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150',
                period === p
                  ? 'bg-[#3b82f6] text-white shadow'
                  : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2a3a]',
              ].join(' ')}
              type="button"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '320px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="assetsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tickFormatter={formatAxisDate}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />

            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
            />

            <Tooltip
              content={(props) => (
                <CustomTooltip
                  active={props.active}
                  payload={props.payload as unknown as TooltipEntry[] | undefined}
                  label={typeof props.label === 'string' ? props.label : String(props.label ?? '')}
                />
              )}
              cursor={{ stroke: '#1e2a3a', strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="assets"
              stroke="#3b82f6"
              strokeWidth={1.5}
              fill="url(#assetsGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
            />

            <Area
              type="monotone"
              dataKey="netWorth"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#netWorthGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#06b6d4', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
