'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface AllocationItem {
  name: string
  value: number
  color: string
}

interface AllocationPieProps {
  data: AllocationItem[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

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
  return (
    <div
      className="rounded-xl border px-3 py-2 text-sm shadow-xl"
      style={{ background: '#111827', borderColor: '#1e2a3a' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: entry.payload?.color }}
        />
        <span className="font-semibold text-[#e2e8f0]">{entry.name}</span>
      </div>
      <p className="text-[#64748b] mt-1">{formatCurrency(Number(entry.value))}</p>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AllocationPie({ data }: AllocationPieProps) {
  const total = data.reduce((s, d) => s + d.value, 0)

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] gap-2">
        <div
          className="w-16 h-16 rounded-full border-4 border-dashed"
          style={{ borderColor: '#1e2a3a' }}
        />
        <p className="text-sm text-[#64748b]">No allocation data</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      {/* Donut chart */}
      <div className="shrink-0 relative" style={{ width: '200px', height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
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

        {/* Center label overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <span className="text-[11px] text-[#64748b] font-medium">Total</span>
          <span className="text-sm font-bold text-[#e2e8f0] tabular-nums mt-0.5">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {data.map((item) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
          return (
            <div key={item.name} className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: item.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs text-[#e2e8f0] truncate font-medium">{item.name}</span>
                  <span className="text-xs text-[#64748b] tabular-nums shrink-0">{pct}%</span>
                </div>
                <div className="text-[11px] text-[#64748b] tabular-nums">
                  {formatCurrency(item.value)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
