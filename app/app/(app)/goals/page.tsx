import Link from 'next/link'
import { Target, Bot, Plus, TrendingUp, Calendar, ArrowRight, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GoalCard, IncomeDoublingRing } from '@/components/ui/goal-card'
import type { Goal, IncomeSource } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthsUntil(dateStr: string): number {
  const deadline = new Date(dateStr)
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24 * 30))
}

// ─── Goal accent colors by index ─────────────────────────────────────────────

const GOAL_COLORS = [
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#06b6d4',
  '#ec4899',
  '#f97316',
  '#84cc16',
]

// ─── Add Goal Button (client interaction — placeholder) ───────────────────────

function AddGoalButton() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-150 hover:scale-105 active:scale-95"
      style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
    >
      <Plus size={14} />
      Add Goal
    </button>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyGoals() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
      >
        <Target size={36} className="text-[#3b82f6]" />
      </div>
      <div className="max-w-sm">
        <h3 className="text-xl font-bold text-[#e2e8f0] mb-2">No goals yet</h3>
        <p className="text-[#64748b] text-sm leading-relaxed">
          Set financial goals to track your progress toward milestones like building an emergency
          fund, paying off debt, or reaching a net worth target.
        </p>
      </div>
      <AddGoalButton />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GoalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: goalsRaw }, { data: incomeRaw }] = await Promise.all([
    supabase
      .from('goals')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('income_sources')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_active', true),
  ])

  const goals = (goalsRaw as Goal[] | null) ?? []
  const incomeSources = (incomeRaw as IncomeSource[] | null) ?? []

  // ── Income doubling data ────────────────────────────────────────────────────
  const totalMonthlyIncome = incomeSources.reduce((s, i) => s + i.monthly_amount, 0)
  const targetIncome = totalMonthlyIncome * 2

  // ── Stats summary ───────────────────────────────────────────────────────────
  const activeGoals = goals.filter((g) => g.status === 'active')
  const achievedGoals = goals.filter((g) => g.status === 'achieved')
  const pausedGoals = goals.filter((g) => g.status === 'paused')

  const goalsWithDeadline = goals.filter((g) => g.deadline)
  const upcomingDeadlines = goalsWithDeadline
    .filter((g) => g.status === 'active' && monthsUntil(g.deadline!) <= 6)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())

  return (
    <div className="fade-in">
      <PageHeader
        title="Goals"
        subtitle="Track your financial objectives"
        actions={<AddGoalButton />}
      />

      {/* ── Income Doubling Hero ────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-8 mb-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f1d35 0%, #0d1929 50%, #150d2e 100%)',
          border: '1px solid rgba(59,130,246,0.25)',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute top-0 left-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }}
        />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}
                >
                  <Zap size={16} className="text-[#3b82f6]" />
                </div>
                <Badge variant="default">Featured Goal</Badge>
              </div>
              <h2 className="text-2xl font-bold text-[#e2e8f0] mb-1">
                Income Doubling Challenge
              </h2>
              <p className="text-[#64748b] text-sm max-w-md">
                Double your monthly income from{' '}
                <span className="text-[#e2e8f0] font-semibold">
                  ${totalMonthlyIncome.toLocaleString()}/mo
                </span>{' '}
                to{' '}
                <span className="text-[#3b82f6] font-semibold">
                  ${targetIncome.toLocaleString()}/mo
                </span>
                . Build new income streams, grow your career earnings, or scale your business.
              </p>
            </div>

            {/* Timeline badge */}
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl shrink-0"
              style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
            >
              <Calendar size={14} className="text-[#3b82f6]" />
              <div>
                <p className="text-xs text-[#64748b]">Target window</p>
                <p className="text-sm font-semibold text-[#3b82f6]">4 – 6 months</p>
              </div>
            </div>
          </div>

          {/* Progress Ring + Stats */}
          {totalMonthlyIncome > 0 ? (
            <IncomeDoublingRing
              currentIncome={totalMonthlyIncome}
              targetIncome={targetIncome}
            />
          ) : (
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <TrendingUp size={18} className="text-[#f59e0b]" />
              <p className="text-sm text-[#94a3b8]">
                Add income sources to start tracking your doubling progress.
              </p>
              <Link
                href="/setup"
                className="ml-auto text-xs font-semibold text-[#3b82f6] hover:underline shrink-0"
              >
                Add income
              </Link>
            </div>
          )}

          {/* AI Advisor CTA */}
          <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {[
                { label: 'Add income streams', done: incomeSources.length > 1 },
                { label: 'Optimize expenses', done: false },
                { label: 'Invest surplus', done: false },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      background: done ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)',
                      border: `1px solid ${done ? '#10b981' : '#475569'}`,
                    }}
                  >
                    {done && <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
                  </div>
                  <span className="text-xs text-[#64748b]">{label}</span>
                </div>
              ))}
            </div>
            <Link
              href="/advisor"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
                border: '1px solid rgba(59,130,246,0.3)',
                color: '#93c5fd',
              }}
            >
              <Bot size={14} />
              Talk to AI Advisor about this goal
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Goals Summary stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Goals', value: goals.length, color: '#3b82f6' },
          { label: 'Active', value: activeGoals.length, color: '#3b82f6' },
          { label: 'Achieved', value: achievedGoals.length, color: '#10b981' },
          { label: 'Upcoming Deadlines', value: upcomingDeadlines.length, color: upcomingDeadlines.length > 0 ? '#f59e0b' : '#64748b' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-4 text-center"
            style={{ background: '#111827', border: '1px solid #1e2a3a' }}
          >
            <p className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
            <p className="text-xs text-[#64748b] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Goals Grid ──────────────────────────────────────────────────────── */}
      {goals.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyGoals />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active goals */}
          {activeGoals.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-[#64748b] uppercase tracking-wider">
                  Active Goals
                </h2>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}
                >
                  {activeGoals.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeGoals.map((goal, i) => (
                  <GoalCard
                    key={goal.id}
                    id={goal.id}
                    title={goal.title}
                    description={goal.description}
                    targetValue={goal.target_value}
                    currentValue={goal.current_value}
                    unit={goal.unit}
                    deadline={goal.deadline}
                    status={goal.status}
                    accentColor={GOAL_COLORS[i % GOAL_COLORS.length]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Achieved goals */}
          {achievedGoals.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-[#64748b] uppercase tracking-wider">
                  Achieved
                </h2>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}
                >
                  {achievedGoals.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    id={goal.id}
                    title={goal.title}
                    description={goal.description}
                    targetValue={goal.target_value}
                    currentValue={goal.current_value}
                    unit={goal.unit}
                    deadline={goal.deadline}
                    status={goal.status}
                    accentColor="#10b981"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Paused goals */}
          {pausedGoals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-[#64748b] uppercase tracking-wider">
                  Paused
                </h2>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(100,116,139,0.15)', color: '#64748b' }}
                >
                  {pausedGoals.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pausedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    id={goal.id}
                    title={goal.title}
                    description={goal.description}
                    targetValue={goal.target_value}
                    currentValue={goal.current_value}
                    unit={goal.unit}
                    deadline={goal.deadline}
                    status={goal.status}
                    accentColor="#64748b"
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Upcoming Deadlines ──────────────────────────────────────────────── */}
      {upcomingDeadlines.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[#f59e0b]" />
              <CardTitle>Upcoming Deadlines</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <div className="divide-y" style={{ borderColor: '#1e2a3a' }}>
              {upcomingDeadlines.map((goal) => {
                const months = goal.deadline ? monthsUntil(goal.deadline) : 0
                const pct = goal.target_value > 0
                  ? Math.min(100, (goal.current_value / goal.target_value) * 100)
                  : 0
                const isUrgent = months <= 1
                return (
                  <div key={goal.id} className="flex items-center gap-4 px-6 py-4">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: isUrgent ? '#ef4444' : '#f59e0b' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#e2e8f0] truncate">{goal.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#1e2a3a', maxWidth: 120 }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: '#3b82f6' }}
                          />
                        </div>
                        <span className="text-xs text-[#64748b]">{pct.toFixed(0)}% complete</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-[#64748b]">
                        {goal.deadline && new Date(goal.deadline).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                      <p
                        className="text-xs font-semibold mt-0.5"
                        style={{ color: isUrgent ? '#ef4444' : '#f59e0b' }}
                      >
                        {months <= 0 ? 'Overdue' : `${months}mo left`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
