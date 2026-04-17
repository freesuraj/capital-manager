'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface AllocationItem {
  name: string
  value: number
  color: string
}

interface PortfolioDonutProps {
  data: AllocationItem[]
  total: number
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

interface TooltipEntry {
  name?: string
  value?: number | string
  payload?: AllocationItem
}

interface TooltipState {
  active?: boolean
  payload?: TooltipEntry[]
}

function CustomTooltip({ active, payload }: TooltipState) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const total = entry.payload ? undefined : 0
  void total
  return (
    <div
      className="rounded-xl border px-3 py-2 text-sm shadow-xl"
      style={{ background: '#111827', borderColor: '#1e2a3a' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: entry.payload?.color }}
        />
        <span className="font-semibold text-[#e2e8f0]">{entry.name}</span>
      </div>
      <p className="text-[#64748b] text-xs">{formatCurrency(Number(entry.value))}</p>
    </div>
  )
}

export function PortfolioDonut({ data, total }: PortfolioDonutProps) {
  if (data.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <div className="w-16 h-16 rounded-full border-4 border-dashed" style={{ borderColor: '#1e2a3a' }} />
        <p className="text-sm text-[#64748b]">No allocation data</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-6">
      <div className="shrink-0 relative" style={{ width: 220, height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={105}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={(props) => (
                <CustomTooltip
                  active={props.active}
                  payload={props.payload as unknown as TooltipEntry[] | undefined}
                />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] text-[#64748b] font-medium">Portfolio</span>
          <span className="text-sm font-bold text-[#e2e8f0] tabular-nums mt-0.5">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2.5 min-w-0">
        {data.map((item) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
          return (
            <div key={item.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                  <span className="text-xs text-[#e2e8f0] font-medium truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-[#64748b] tabular-nums">{pct}%</span>
                  <span className="text-xs text-[#e2e8f0] tabular-nums font-semibold">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1e2a3a' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: item.color, opacity: 0.85 }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
