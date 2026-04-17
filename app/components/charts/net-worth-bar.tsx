'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export interface NetWorthBarSlice {
  name: string
  value: number
  color: string
}

interface NetWorthBarProps {
  data: NetWorthBarSlice[]
  total: number
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

interface TooltipEntry {
  name?: string
  value?: number | string
  payload?: NetWorthBarSlice
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
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ background: entry.payload?.color }}
        />
        <span className="font-semibold text-[#e2e8f0]">{entry.name}</span>
      </div>
      <p className="text-[#64748b] text-xs">{formatCurrency(Number(entry.value))}</p>
    </div>
  )
}

export function NetWorthStackedBar({ data, total }: NetWorthBarProps) {
  if (data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-24">
        <p className="text-sm text-[#64748b]">No data to display</p>
      </div>
    )
  }

  // Build a single stacked bar using segments
  return (
    <div className="flex flex-col gap-3">
      {/* Stacked horizontal bar */}
      <div className="flex h-10 rounded-xl overflow-hidden gap-0.5">
        {data.map((slice) => {
          const pct = total > 0 ? (slice.value / total) * 100 : 0
          return (
            <div
              key={slice.name}
              className="h-full transition-all duration-700 first:rounded-l-xl last:rounded-r-xl"
              style={{ width: `${pct}%`, background: slice.color, minWidth: pct > 0 ? 2 : 0 }}
              title={`${slice.name}: ${formatCurrency(slice.value)} (${pct.toFixed(1)}%)`}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {data.map((slice) => {
          const pct = total > 0 ? (slice.value / total) * 100 : 0
          return (
            <div key={slice.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: slice.color }} />
              <span className="text-xs text-[#94a3b8]">{slice.name}</span>
              <span className="text-xs text-[#64748b]">{pct.toFixed(0)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Separate vertical bar chart for liabilities by type
export function LiabilitiesBar({ data }: { data: NetWorthBarSlice[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-sm text-[#64748b]">No liabilities data</p>
      </div>
    )
  }

  return (
    <div style={{ height: Math.max(120, data.length * 44) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
          <XAxis
            type="number"
            tickFormatter={formatCurrency}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            content={(props) => (
              <CustomTooltip
                active={props.active}
                payload={props.payload as unknown as TooltipEntry[] | undefined}
              />
            )}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
