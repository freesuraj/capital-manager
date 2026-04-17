'use client'

import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts'

interface StatCardProps {
  label: string
  value: string | number
  change?: number
  changePercent?: number
  trend?: number[]
  prefix?: string
  suffix?: string
  positive?: boolean
}

function SparklineTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg px-2 py-1 text-xs text-[#e2e8f0]">
      {payload[0].value}
    </div>
  )
}

export function StatCard({
  label,
  value,
  change,
  changePercent,
  trend,
  prefix = '',
  suffix = '',
  positive,
}: StatCardProps) {
  const hasChange = changePercent !== undefined
  // Determine direction: if `positive` is explicitly passed, use it; else infer from changePercent
  const isUp = positive !== undefined ? positive : (changePercent ?? 0) >= 0
  const changeColor = isUp ? 'text-[#10b981]' : 'text-[#ef4444]'
  const changeBg = isUp ? 'bg-[#052e1c]' : 'bg-[#3b0f0f]'
  const arrowIcon = isUp ? '↑' : '↓'

  const sparkData = trend?.map((v, i) => ({ i, v })) ?? []

  return (
    <div className="bg-[#111827] border border-[#1e2a3a] rounded-xl p-5 flex flex-col gap-3">
      {/* Label */}
      <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider">{label}</p>

      {/* Value row */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <span className="text-2xl font-bold text-[#e2e8f0] tabular-nums">
            {prefix}
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix}
          </span>

          {hasChange && (
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${changeColor} ${changeBg}`}
              >
                {arrowIcon} {Math.abs(changePercent!).toFixed(2)}%
              </span>
              {change !== undefined && (
                <span className="text-xs text-[#64748b]">
                  {isUp ? '+' : ''}
                  {prefix}
                  {typeof change === 'number' ? change.toLocaleString() : change}
                  {suffix}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparkData.length > 1 && (
          <div className="w-24 h-12 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={isUp ? '#10b981' : '#ef4444'}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Tooltip
                  content={<SparklineTooltip />}
                  cursor={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
