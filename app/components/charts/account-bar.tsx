'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface AccountBarItem {
  name: string
  value: number
  color: string
}

interface AccountBarProps {
  data: AccountBarItem[]
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

interface TooltipEntry {
  dataKey?: string
  value?: number | string
  payload?: AccountBarItem
}

interface TooltipState {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipState) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl border px-3 py-2 text-sm shadow-xl"
      style={{ background: '#111827', borderColor: '#1e2a3a' }}
    >
      <p className="font-semibold text-[#e2e8f0] mb-1">{label}</p>
      <p className="text-[#64748b] text-xs">{formatCurrency(Number(payload[0].value))}</p>
    </div>
  )
}

export function AccountBar({ data }: AccountBarProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-sm text-[#64748b]">No account data</p>
      </div>
    )
  }

  return (
    <div style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
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
            width={80}
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
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
