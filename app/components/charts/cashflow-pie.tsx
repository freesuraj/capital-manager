'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export interface PieSlice {
  name: string
  value: number
  color: string
}

interface CashflowPieProps {
  data: PieSlice[]
  total: number
  label?: string
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

interface TooltipEntry {
  name?: string
  value?: number | string
  payload?: PieSlice
}

interface TooltipState {
  active?: boolean
  payload?: TooltipEntry[]
}

function CustomTooltip({ active, payload }: TooltipState) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
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
      <p className="text-[#64748b] text-xs">{formatCurrency(Number(entry.value))}/mo</p>
    </div>
  )
}

export function CashflowPie({ data, total, label }: CashflowPieProps) {
  if (data.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2">
        <div className="w-12 h-12 rounded-full border-4 border-dashed" style={{ borderColor: '#1e2a3a' }} />
        <p className="text-sm text-[#64748b]">No data</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 160, height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={78}
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
          {label && <span className="text-[10px] text-[#64748b]">{label}</span>}
          <span className="text-sm font-bold text-[#e2e8f0] tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full flex flex-col gap-1.5">
        {data.slice(0, 6).map((item) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0'
          return (
            <div key={item.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                <span className="text-xs text-[#94a3b8] truncate capitalize">{item.name.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-[#64748b]">{pct}%</span>
                <span className="text-xs font-semibold text-[#e2e8f0] tabular-nums w-16 text-right">
                  {formatCurrency(item.value)}
                </span>
              </div>
            </div>
          )
        })}
        {data.length > 6 && (
          <p className="text-xs text-[#64748b] text-center mt-1">+{data.length - 6} more</p>
        )}
      </div>
    </div>
  )
}
