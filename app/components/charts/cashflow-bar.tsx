'use client'

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface MonthData {
  month: string
  income: number
  expenses: number
}

interface CashFlowBarProps {
  income: number
  expenses: number
  months?: MonthData[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
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
  if (!active || !payload?.length) return null

  const income = payload.find((p) => p.dataKey === 'income')?.value ?? 0
  const expenses = payload.find((p) => p.dataKey === 'expenses')?.value ?? 0
  const net = Number(income) - Number(expenses)

  return (
    <div
      className="rounded-xl border px-4 py-3 text-sm shadow-xl"
      style={{ background: '#111827', borderColor: '#1e2a3a', minWidth: '160px' }}
    >
      {label && (
        <p className="text-xs font-semibold text-[#64748b] mb-2 uppercase tracking-wider">
          {label}
        </p>
      )}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#64748b]">
            <span className="inline-block w-2 h-2 rounded-sm bg-[#10b981]" />
            Income
          </span>
          <span className="font-semibold text-[#10b981]">{formatCurrency(Number(income))}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#64748b]">
            <span className="inline-block w-2 h-2 rounded-sm bg-[#ef4444]" />
            Expenses
          </span>
          <span className="font-semibold text-[#ef4444]">{formatCurrency(Number(expenses))}</span>
        </div>
        <div className="h-px bg-[#1e2a3a] my-1" />
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#64748b]">Net</span>
          <span
            className="font-bold"
            style={{ color: net >= 0 ? '#10b981' : '#ef4444' }}
          >
            {net >= 0 ? '+' : ''}
            {formatCurrency(net)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

type ChartRow = MonthData & { net: number }

function buildSingleBar(income: number, expenses: number): ChartRow[] {
  return [{ month: 'Current', income, expenses, net: income - expenses }]
}

export function CashFlowBar({ income, expenses, months }: CashFlowBarProps) {
  const chartData: ChartRow[] = (months && months.length > 0
    ? months
    : buildSingleBar(income, expenses)
  ).map((m) => ({ ...m, net: m.income - m.expenses }))

  const hasManyBars = chartData.length > 1

  return (
    <div style={{ height: '280px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          barCategoryGap={hasManyBars ? '25%' : '50%'}
          barGap={4}
        >
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="month"
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
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />

          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingTop: '12px' }}
            formatter={(value: string) =>
              value === 'income' ? 'Income' : value === 'expenses' ? 'Expenses' : 'Net Flow'
            }
          />

          <Bar
            dataKey="income"
            fill="url(#incomeGrad)"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
          <Bar
            dataKey="expenses"
            fill="url(#expensesGrad)"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />

          {hasManyBars && (
            <Line
              type="monotone"
              dataKey="net"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
