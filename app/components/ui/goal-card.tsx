'use client'

import { Target, Calendar, CheckCircle2, PauseCircle, Clock } from 'lucide-react'

interface GoalCardProps {
  id: string
  title: string
  description?: string | null
  targetValue: number
  currentValue: number
  unit: string
  deadline?: string | null
  status: 'active' | 'achieved' | 'paused'
  accentColor?: string
}

function formatValue(value: number, unit: string): string {
  if (unit === 'USD' || unit === '$' || unit.toLowerCase() === 'dollars') {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
    return `$${value.toFixed(0)}`
  }
  if (unit === '%') return `${value.toFixed(1)}%`
  return `${value.toLocaleString()} ${unit}`
}

function daysUntil(dateStr: string): number {
  const deadline = new Date(dateStr)
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function deadlineLabel(dateStr: string): string {
  const days = daysUntil(dateStr)
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  if (days < 7) return `${days}d left`
  if (days < 30) return `${Math.ceil(days / 7)}w left`
  if (days < 365) return `${Math.ceil(days / 30)}mo left`
  return `${(days / 365).toFixed(1)}y left`
}

export function GoalCard({
  title,
  description,
  targetValue,
  currentValue,
  unit,
  deadline,
  status,
  accentColor = '#3b82f6',
}: GoalCardProps) {
  const pct = targetValue > 0 ? Math.min(100, (currentValue / targetValue) * 100) : 0
  const isAchieved = status === 'achieved' || pct >= 100
  const isPaused = status === 'paused'

  // SVG ring params
  const size = 88
  const strokeWidth = 7
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - pct / 100)

  const daysLeft = deadline ? daysUntil(deadline) : null
  const isOverdue = daysLeft != null && daysLeft < 0 && !isAchieved

  const statusColor = isAchieved ? '#10b981' : isPaused ? '#64748b' : accentColor
  const statusIcon = isAchieved ? CheckCircle2 : isPaused ? PauseCircle : Clock
  const StatusIcon = statusIcon

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden transition-all duration-200 hover:scale-[1.01]"
      style={{ background: '#111827', border: `1px solid ${isPaused ? '#1e2a3a' : `${statusColor}30`}` }}
    >
      {/* Background glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${statusColor}08 0%, transparent 70%)` }}
      />

      {/* Top row: ring + info */}
      <div className="flex items-start gap-4">
        {/* Progress Ring */}
        <div className="shrink-0 relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            {/* Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#1e2a3a"
              strokeWidth={strokeWidth}
            />
            {/* Progress */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={statusColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold tabular-nums" style={{ color: statusColor }}>
              {pct.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Title and status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-bold text-[#e2e8f0] leading-tight">{title}</h3>
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: `${statusColor}15`,
                border: `1px solid ${statusColor}25`,
              }}
            >
              <StatusIcon size={10} style={{ color: statusColor }} />
              <span className="text-[10px] font-semibold capitalize" style={{ color: statusColor }}>
                {isAchieved ? 'achieved' : status}
              </span>
            </div>
          </div>
          {description && (
            <p className="text-xs text-[#64748b] leading-relaxed line-clamp-2">{description}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[#64748b]">Progress</span>
          <span className="text-xs font-semibold tabular-nums" style={{ color: statusColor }}>
            {formatValue(currentValue, unit)} / {formatValue(targetValue, unit)}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1e2a3a' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: statusColor }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] text-[#64748b] tabular-nums">
            {formatValue(currentValue, unit)}
          </span>
          <span className="text-[11px] text-[#64748b] tabular-nums">
            {formatValue(targetValue - currentValue > 0 ? targetValue - currentValue : 0, unit)} remaining
          </span>
        </div>
      </div>

      {/* Deadline */}
      {deadline && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            background: isOverdue ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.2)' : '#1e2a3a'}`,
          }}
        >
          <Calendar size={12} style={{ color: isOverdue ? '#ef4444' : '#64748b' }} />
          <span className="text-xs" style={{ color: isOverdue ? '#ef4444' : '#64748b' }}>
            {new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="ml-auto text-xs font-semibold" style={{ color: isOverdue ? '#ef4444' : statusColor }}>
            {deadline ? deadlineLabel(deadline) : ''}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Larger hero variant for income doubling ────────────────────────────────────

interface IncomeDoublingCardProps {
  currentIncome: number
  targetIncome: number
}

export function IncomeDoublingRing({ currentIncome, targetIncome }: IncomeDoublingCardProps) {
  const pct = targetIncome > 0 ? Math.min(100, (currentIncome / targetIncome) * 100) : 0

  const size = 140
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - pct / 100)

  const color = pct >= 100 ? '#10b981' : pct >= 75 ? '#3b82f6' : pct >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex items-center gap-8 flex-wrap">
      {/* Large ring */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1e2a3a"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 6px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums" style={{ color }}>
            {pct.toFixed(0)}%
          </span>
          <span className="text-xs text-[#64748b]">complete</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs text-[#64748b] mb-0.5">Current Monthly Income</p>
          <p className="text-2xl font-bold text-[#e2e8f0] tabular-nums">
            {currentIncome >= 1000 ? `$${(currentIncome / 1000).toFixed(1)}K` : `$${currentIncome.toFixed(0)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Target size={14} className="text-[#64748b]" />
          <span className="text-xs text-[#64748b]">Target (2x):</span>
          <span className="text-sm font-bold tabular-nums" style={{ color }}>
            {targetIncome >= 1000 ? `$${(targetIncome / 1000).toFixed(1)}K` : `$${targetIncome.toFixed(0)}`}/mo
          </span>
        </div>
        <div>
          <p className="text-xs text-[#64748b] mb-1">Remaining</p>
          <p className="text-lg font-bold tabular-nums" style={{ color }}>
            +{Math.max(0, targetIncome - currentIncome) >= 1000
              ? `$${((targetIncome - currentIncome) / 1000).toFixed(1)}K`
              : `$${Math.max(0, targetIncome - currentIncome).toFixed(0)}`}
            /mo needed
          </p>
        </div>
      </div>
    </div>
  )
}
