'use client'

import React, { useState, useCallback, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input, Select, Textarea } from '@/components/ui/input'
import type {
  FinancialProfile,
  Asset,
  Liability,
  IncomeSource,
  Expense,
  InvestmentHolding,
  HouseholdMember,
} from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SetupFormProps {
  members: HouseholdMember[]
  profiles: FinancialProfile[]
  profile: FinancialProfile | null
  assets: Asset[]
  liabilities: Liability[]
  incomeSources: IncomeSource[]
  expenses: Expense[]
  holdings: InvestmentHolding[]
}

type TabId = 'members' | 'profile' | 'assets' | 'liabilities' | 'income' | 'expenses' | 'investments'

const TABS: { id: TabId; label: string }[] = [
  { id: 'members', label: 'Members' },
  { id: 'profile', label: 'Profile' },
  { id: 'assets', label: 'Assets' },
  { id: 'liabilities', label: 'Liabilities' },
  { id: 'income', label: 'Income' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'investments', label: 'Investments' },
]

const MEMBER_COLORS = [
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Green', value: '#10b981' },
  { label: 'Amber', value: '#f59e0b' },
]

// ─── Toast ───────────────────────────────────────────────────────────────────

interface ToastState {
  message: string
  type: 'success' | 'error'
  id: number
}

function Toast({ toast }: { toast: ToastState }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl animate-toast"
      style={{
        background: toast.type === 'success' ? '#10b981' : '#ef4444',
        color: '#fff',
        minWidth: '200px',
      }}
    >
      {toast.type === 'success' ? '✓ ' : '✕ '}
      {toast.message}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v.toLocaleString()}`
}

function computeMonthlyEquivalent(amount: number, frequency: string): number {
  switch (frequency) {
    case 'annual':
      return amount / 12
    case 'quarterly':
      return amount / 3
    case 'weekly':
      return (amount * 52) / 12
    default:
      return amount
  }
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const k = String(item[key])
      acc[k] = acc[k] ? [...acc[k], item] : [item]
      return acc
    },
    {} as Record<string, T[]>,
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')
}

function DeleteButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="p-1.5 rounded-lg transition-colors hover:bg-[#ef444420] text-[#64748b] hover:text-[#ef4444] disabled:opacity-40"
      aria-label="Delete"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
      </svg>
    </button>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="h-px flex-1" style={{ background: '#1e2a3a' }} />
      <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">{label}</span>
      <div className="h-px flex-1" style={{ background: '#1e2a3a' }} />
    </div>
  )
}

function EmptyList({ label }: { label: string }) {
  return (
    <p className="text-sm text-[#475569] text-center py-6 border border-dashed border-[#1e2a3a] rounded-xl">
      No {label} added yet
    </p>
  )
}

function MemberBadge({ member }: { member: HouseholdMember | undefined }) {
  if (!member) return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
      style={{ background: '#1e2a3a', color: '#64748b' }}
    >
      Joint
    </span>
  )
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
      style={{ background: `${member.color}20`, color: member.color }}
    >
      {member.name}
    </span>
  )
}

function MemberAssignSelect({
  members,
  value,
  onChange,
}: {
  members: HouseholdMember[]
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}) {
  if (members.length === 0) return null
  return (
    <Select label="Assign to" value={value} onChange={onChange}>
      <option value="">Joint / Household</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </Select>
  )
}

// ─── Members Tab ─────────────────────────────────────────────────────────────

function MembersTab({
  initialMembers,
  onToast,
  onMembersChange,
}: {
  initialMembers: HouseholdMember[]
  onToast: (msg: string, type: 'success' | 'error') => void
  onMembersChange: (members: HouseholdMember[]) => void
}) {
  const [members, setMembers] = useState<HouseholdMember[]>(initialMembers)
  const [adding, startAdd] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const blankForm = {
    name: '',
    relationship: 'self' as HouseholdMember['relationship'],
    color: '#3b82f6',
  }
  const [form, setForm] = useState(blankForm)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  function handleAdd() {
    if (!form.name.trim()) {
      onToast('Name is required', 'error')
      return
    }
    startAdd(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { onToast('Not authenticated', 'error'); return }

      const isPrimary = members.length === 0 && form.relationship === 'self'

      const { data, error } = await supabase
        .from('household_members')
        .insert({
          user_id: user.id,
          name: form.name.trim(),
          relationship: form.relationship,
          color: form.color,
          is_primary: isPrimary,
        })
        .select()
        .single()

      if (error) { onToast(error.message, 'error'); return }
      const updated = [...members, data as HouseholdMember]
      setMembers(updated)
      onMembersChange(updated)
      setForm(blankForm)
      onToast('Member added', 'success')
    })
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    startDelete(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('household_members').delete().eq('id', id)
      if (error) { onToast(error.message, 'error'); setDeletingId(null); return }
      const updated = members.filter((m) => m.id !== id)
      setMembers(updated)
      onMembersChange(updated)
      setDeletingId(null)
      onToast('Member removed', 'success')
    })
  }

  const relationshipLabel: Record<string, string> = {
    self: 'Self',
    partner: 'Partner',
    dependent: 'Dependent',
    other: 'Other',
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Household Members</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#64748b] mb-2">No members added yet.</p>
              <p className="text-xs text-[#475569]">Add yourself to get started — then optionally add your partner or dependents.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: '#0f172a', border: '1px solid #1e2a3a' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: member.color }}
                    />
                    <div>
                      <p className="text-sm font-medium text-[#e2e8f0]">{member.name}</p>
                      <p className="text-xs text-[#64748b]">{relationshipLabel[member.relationship] ?? member.relationship}</p>
                    </div>
                    {member.is_primary && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: '#3b82f620', color: '#3b82f6' }}
                      >
                        Primary
                      </span>
                    )}
                  </div>
                  <DeleteButton
                    onClick={() => handleDelete(member.id)}
                    loading={deleting && deletingId === member.id}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Member</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Name"
              placeholder={members.length === 0 ? 'Me' : 'Partner Name'}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <Select label="Relationship" value={form.relationship} onChange={set('relationship')}>
              <option value="self">Self</option>
              <option value="partner">Partner</option>
              <option value="dependent">Dependent</option>
              <option value="other">Other</option>
            </Select>
            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Color</label>
              <div className="flex items-center gap-2 pt-1">
                {MEMBER_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, color: c.value }))}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
                    style={{
                      background: c.value,
                      outline: form.color === c.value ? `2px solid ${c.value}` : 'none',
                      outlineOffset: '2px',
                    }}
                    aria-label={c.label}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleAdd} loading={adding}>
              Add Member
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab({
  profiles,
  profile,
  members,
  onToast,
}: {
  profiles: FinancialProfile[]
  profile: FinancialProfile | null
  members: HouseholdMember[]
  onToast: (msg: string, type: 'success' | 'error') => void
}) {
  // Which member we're editing (null = no-member / legacy profile)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    members.length > 0 ? (members[0]?.id ?? null) : null
  )

  const activeProfile = profiles.find((p) => p.member_id === selectedMemberId) ?? (selectedMemberId === null ? profile : null)

  const [saving, startSave] = useTransition()
  const [form, setForm] = useState({
    age: activeProfile?.age?.toString() ?? '',
    country: activeProfile?.country ?? '',
    tax_jurisdiction: activeProfile?.tax_jurisdiction ?? '',
    employment_status: activeProfile?.employment_status ?? 'employed',
    monthly_income: activeProfile?.monthly_income?.toString() ?? '',
    risk_tolerance: activeProfile?.risk_tolerance ?? 'moderate',
    investment_experience: activeProfile?.investment_experience ?? 'beginner',
    time_horizon: activeProfile?.time_horizon ?? '',
    emergency_fund_target: activeProfile?.emergency_fund_target?.toString() ?? '',
    dependents: activeProfile?.dependents?.toString() ?? '',
    insurance_coverage: activeProfile?.insurance_coverage ?? '',
    goal_priorities: activeProfile?.goal_priorities ?? '',
    restrictions: activeProfile?.restrictions ?? '',
  })

  // When member selection changes, reload form with that member's profile
  function handleMemberChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const mid = e.target.value || null
    setSelectedMemberId(mid)
    const p = profiles.find((pr) => pr.member_id === mid) ?? (mid === null ? profile : null)
    setForm({
      age: p?.age?.toString() ?? '',
      country: p?.country ?? '',
      tax_jurisdiction: p?.tax_jurisdiction ?? '',
      employment_status: p?.employment_status ?? 'employed',
      monthly_income: p?.monthly_income?.toString() ?? '',
      risk_tolerance: p?.risk_tolerance ?? 'moderate',
      investment_experience: p?.investment_experience ?? 'beginner',
      time_horizon: p?.time_horizon ?? '',
      emergency_fund_target: p?.emergency_fund_target?.toString() ?? '',
      dependents: p?.dependents?.toString() ?? '',
      insurance_coverage: p?.insurance_coverage ?? '',
      goal_priorities: p?.goal_priorities ?? '',
      restrictions: p?.restrictions ?? '',
    })
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  function handleSave() {
    startSave(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { onToast('Not authenticated', 'error'); return }

      const payload = {
        user_id: user.id,
        member_id: selectedMemberId ?? null,
        age: form.age ? parseInt(form.age) : null,
        country: form.country || null,
        tax_jurisdiction: form.tax_jurisdiction || null,
        employment_status: form.employment_status || null,
        monthly_income: form.monthly_income ? parseFloat(form.monthly_income) : null,
        risk_tolerance: form.risk_tolerance || null,
        investment_experience: form.investment_experience || null,
        time_horizon: form.time_horizon || null,
        emergency_fund_target: form.emergency_fund_target ? parseFloat(form.emergency_fund_target) : null,
        dependents: form.dependents ? parseInt(form.dependents) : null,
        insurance_coverage: form.insurance_coverage || null,
        goal_priorities: form.goal_priorities || null,
        restrictions: form.restrictions || null,
        updated_at: new Date().toISOString(),
      }

      // Manual upsert: find existing row, then insert or update
      let error
      const query = selectedMemberId
        ? supabase.from('financial_profiles').select('id').eq('member_id', selectedMemberId).maybeSingle()
        : supabase.from('financial_profiles').select('id').eq('user_id', user.id).is('member_id', null).maybeSingle()

      const { data: existing, error: fetchError } = await query
      if (fetchError) { onToast(fetchError.message, 'error'); return }

      if (existing) {
        ;({ error } = await supabase.from('financial_profiles').update(payload).eq('id', existing.id))
      } else {
        ;({ error } = await supabase.from('financial_profiles').insert(payload))
      }

      if (error) onToast(error.message, 'error')
      else onToast('Profile saved', 'success')
    })
  }

  const selectedMemberName = members.find((m) => m.id === selectedMemberId)?.name ?? 'General'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle>Financial Profile</CardTitle>
          {members.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748b]">Editing for:</span>
              <select
                value={selectedMemberId ?? ''}
                onChange={handleMemberChange}
                className="text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                style={{ background: '#111827', border: '1px solid #1e2a3a', color: '#e2e8f0' }}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Age"
            type="number"
            min={0}
            max={120}
            placeholder="32"
            value={form.age}
            onChange={set('age')}
          />
          <Input
            label="Country"
            placeholder="United States"
            value={form.country}
            onChange={set('country')}
          />
          <Input
            label="Tax Jurisdiction"
            placeholder="Federal / CA"
            value={form.tax_jurisdiction}
            onChange={set('tax_jurisdiction')}
          />
          <Select
            label="Employment Status"
            value={form.employment_status}
            onChange={set('employment_status')}
          >
            <option value="employed">Employed</option>
            <option value="self-employed">Self-Employed</option>
            <option value="unemployed">Unemployed</option>
            <option value="retired">Retired</option>
          </Select>
          <Input
            label="Monthly After-Tax Income ($)"
            type="number"
            min={0}
            placeholder="5000"
            value={form.monthly_income}
            onChange={set('monthly_income')}
          />
          <Select
            label="Risk Tolerance"
            value={form.risk_tolerance}
            onChange={set('risk_tolerance')}
          >
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </Select>
          <Select
            label="Investment Experience"
            value={form.investment_experience}
            onChange={set('investment_experience')}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
          <Input
            label="Time Horizon"
            placeholder="5-10 years"
            value={form.time_horizon}
            onChange={set('time_horizon')}
          />
          <Input
            label="Emergency Fund Target ($)"
            type="number"
            min={0}
            placeholder="30000"
            value={form.emergency_fund_target}
            onChange={set('emergency_fund_target')}
          />
          <Input
            label="Dependents"
            type="number"
            min={0}
            placeholder="2"
            value={form.dependents}
            onChange={set('dependents')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <Textarea
            label="Insurance Coverage"
            placeholder="Health, life, auto, home..."
            rows={3}
            value={form.insurance_coverage}
            onChange={set('insurance_coverage')}
          />
          <Textarea
            label="Goal Priorities"
            placeholder="1. Buy a home\n2. Retire at 55..."
            rows={3}
            value={form.goal_priorities}
            onChange={set('goal_priorities')}
          />
          <Textarea
            label="Restrictions / Preferences"
            placeholder="No crypto, ethical investing only..."
            rows={3}
            value={form.restrictions}
            onChange={set('restrictions')}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            Save Profile{members.length > 0 ? ` for ${selectedMemberName}` : ''}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Assets Tab ───────────────────────────────────────────────────────────────

function AssetsTab({
  initialAssets,
  members,
  onToast,
}: {
  initialAssets: Asset[]
  members: HouseholdMember[]
  onToast: (msg: string, type: 'success' | 'error') => void
}) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [adding, startAdd] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const blankForm = {
    name: '',
    type: 'cash' as Asset['type'],
    value: '',
    currency: 'USD',
    institution: '',
    notes: '',
    member_id: '',
  }
  const [form, setForm] = useState(blankForm)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  function handleAdd() {
    if (!form.name || !form.value) {
      onToast('Name and value are required', 'error')
      return
    }
    startAdd(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { onToast('Not authenticated', 'error'); return }

      const { data, error } = await supabase
        .from('assets')
        .insert({
          user_id: user.id,
          member_id: form.member_id || null,
          name: form.name,
          type: form.type,
          value: parseFloat(form.value),
          currency: form.currency || 'USD',
          institution: form.institution || null,
          notes: form.notes || null,
        })
        .select()
        .single()

      if (error) { onToast(error.message, 'error'); return }
      setAssets((prev) => [data as Asset, ...prev])
      setForm(blankForm)
      onToast('Asset added', 'success')
    })
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    startDelete(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('assets').delete().eq('id', id)
      if (error) { onToast(error.message, 'error'); setDeletingId(null); return }
      setAssets((prev) => prev.filter((a) => a.id !== id))
      setDeletingId(null)
      onToast('Asset deleted', 'success')
    })
  }

  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]))
  const grouped = groupBy(assets, 'type')

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Assets</CardTitle>
            <span className="text-sm font-semibold text-[#10b981]">
              Total: {formatCurrency(assets.reduce((s, a) => s + a.value, 0))}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <EmptyList label="assets" />
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                      {capitalize(type)}
                    </span>
                    <span className="text-xs text-[#64748b]">
                      {formatCurrency(items.reduce((s, a) => s + a.value, 0))}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {items.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ background: '#0f172a', border: '1px solid #1e2a3a' }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#e2e8f0] truncate">{asset.name}</p>
                            {members.length > 0 && (
                              <MemberBadge member={asset.member_id ? memberMap[asset.member_id] : undefined} />
                            )}
                          </div>
                          {asset.institution && (
                            <p className="text-xs text-[#64748b]">{asset.institution}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-[#10b981] tabular-nums">
                            {formatCurrency(asset.value)}
                          </span>
                          <DeleteButton
                            onClick={() => handleDelete(asset.id)}
                            loading={deleting && deletingId === asset.id}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Asset</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Name" placeholder="Chase Checking" value={form.name} onChange={set('name')} />
            <Select label="Type" value={form.type} onChange={set('type')}>
              <option value="cash">Cash</option>
              <option value="savings">Savings</option>
              <option value="investment">Investment</option>
              <option value="real_estate">Real Estate</option>
              <option value="retirement">Retirement</option>
              <option value="business">Business</option>
              <option value="other">Other</option>
            </Select>
            <Input label="Value ($)" type="number" min={0} placeholder="10000" value={form.value} onChange={set('value')} />
            <Input label="Currency" placeholder="USD" value={form.currency} onChange={set('currency')} />
            <Input label="Institution" placeholder="Chase Bank" value={form.institution} onChange={set('institution')} />
            <Textarea label="Notes" placeholder="Optional notes..." rows={2} value={form.notes} onChange={set('notes')} />
            <MemberAssignSelect members={members} value={form.member_id} onChange={set('member_id')} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleAdd} loading={adding}>
              Add Asset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Liabilities Tab ──────────────────────────────────────────────────────────

function LiabilitiesTab({
  initialLiabilities,
  members,
  onToast,
}: {
  initialLiabilities: Liability[]
  members: HouseholdMember[]
  onToast: (msg: string, type: 'success' | 'error') => void
}) {
  const [liabilities, setLiabilities] = useState<Liability[]>(initialLiabilities)
  const [adding, startAdd] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const blankForm = {
    name: '',
    type: 'credit_card' as Liability['type'],
    balance: '',
    interest_rate: '',
    monthly_payment: '',
    original_amount: '',
    term_months: '',
    institution: '',
    notes: '',
    member_id: '',
  }
  const [form, setForm] = useState(blankForm)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  function handleAdd() {
    if (!form.name || !form.balance) {
      onToast('Name and balance are required', 'error')
      return
    }
    startAdd(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { onToast('Not authenticated', 'error'); return }

      const { data, error } = await supabase
        .from('liabilities')
        .insert({
          user_id: user.id,
          member_id: form.member_id || null,
          name: form.name,
          type: form.type,
          balance: parseFloat(form.balance),
          interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : 0,
          monthly_payment: form.monthly_payment ? parseFloat(form.monthly_payment) : 0,
          original_amount: form.original_amount ? parseFloat(form.original_amount) : null,
          term_months: form.term_months ? parseInt(form.term_months) : null,
          institution: form.institution || null,
          notes: form.notes || null,
        })
        .select()
        .single()

      if (error) { onToast(error.message, 'error'); return }
      setLiabilities((prev) => [data as Liability, ...prev])
      setForm(blankForm)
      onToast('Liability added', 'success')
    })
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    startDelete(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('liabilities').delete().eq('id', id)
      if (error) { onToast(error.message, 'error'); setDeletingId(null); return }
      setLiabilities((prev) => prev.filter((l) => l.id !== id))
      setDeletingId(null)
      onToast('Liability deleted', 'success')
    })
  }

  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]))

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Liabilities</CardTitle>
            <span className="text-sm font-semibold text-[#ef4444]">
              Total: {formatCurrency(liabilities.reduce((s, l) => s + l.balance, 0))}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {liabilities.length === 0 ? (
            <EmptyList label="liabilities" />
          ) : (
            <div className="space-y-2">
              {liabilities.map((liability) => (
                <div
                  key={liability.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: '#0f172a', border: '1px solid #1e2a3a' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#e2e8f0] truncate">{liability.name}</p>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: '#ef444420', color: '#ef4444' }}
                      >
                        {capitalize(liability.type)}
                      </span>
                      {members.length > 0 && (
                        <MemberBadge member={liability.member_id ? memberMap[liability.member_id] : undefined} />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-[#64748b]">
                        {liability.interest_rate}% APR
                      </p>
                      {liability.monthly_payment > 0 && (
                        <p className="text-xs text-[#64748b]">
                          {formatCurrency(liability.monthly_payment)}/mo
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#ef4444] tabular-nums">
                      {formatCurrency(liability.balance)}
                    </span>
                    <DeleteButton
                      onClick={() => handleDelete(liability.id)}
                      loading={deleting && deletingId === liability.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Liability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Name" placeholder="Chase Visa" value={form.name} onChange={set('name')} />
            <Select label="Type" value={form.type} onChange={set('type')}>
              <option value="mortgage">Mortgage</option>
              <option value="car_loan">Car Loan</option>
              <option value="student_loan">Student Loan</option>
              <option value="credit_card">Credit Card</option>
              <option value="personal_loan">Personal Loan</option>
              <option value="business_loan">Business Loan</option>
              <option value="other">Other</option>
            </Select>
            <Input label="Current Balance ($)" type="number" min={0} placeholder="5000" value={form.balance} onChange={set('balance')} />
            <Input label="Interest Rate (%)" type="number" min={0} step="0.01" placeholder="18.99" value={form.interest_rate} onChange={set('interest_rate')} />
            <Input label="Monthly Payment ($)" type="number" min={0} placeholder="200" value={form.monthly_payment} onChange={set('monthly_payment')} />
            <Input label="Original Amount ($)" type="number" min={0} placeholder="8000" value={form.original_amount} onChange={set('original_amount')} />
            <Input label="Term (months)" type="number" min={0} placeholder="60" value={form.term_months} onChange={set('term_months')} />
            <Input label="Institution" placeholder="Chase Bank" value={form.institution} onChange={set('institution')} />
            <Textarea label="Notes" placeholder="Optional notes..." rows={2} value={form.notes} onChange={set('notes')} />
            <MemberAssignSelect members={members} value={form.member_id} onChange={set('member_id')} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleAdd} loading={adding}>
              Add Liability
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Income Tab ───────────────────────────────────────────────────────────────

function IncomeTab({
  initialIncome,
  members,
  onToast,
}: {
  initialIncome: IncomeSource[]
  members: HouseholdMember[]
  onToast: (msg: string, type: 'success' | 'error') => void
}) {
  const [income, setIncome] = useState<IncomeSource[]>(initialIncome)
  const [adding, startAdd] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const blankForm = {
    name: '',
    type: 'salary' as IncomeSource['type'],
    monthly_amount: '',
    is_active: true,
    notes: '',
    member_id: '',
  }
  const [form, setForm] = useState(blankForm)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  function handleAdd() {
    if (!form.name || !form.monthly_amount) {
      onToast('Name and monthly amount are required', 'error')
      return
    }
    startAdd(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { onToast('Not authenticated', 'error'); return }

      const { data, error } = await supabase
        .from('income_sources')
        .insert({
          user_id: user.id,
          member_id: form.member_id || null,
          name: form.name,
          type: form.type,
          monthly_amount: parseFloat(form.monthly_amount),
          is_active: form.is_active,
          notes: form.notes || null,
        })
        .select()
        .single()

      if (error) { onToast(error.message, 'error'); return }
      setIncome((prev) => [data as IncomeSource, ...prev])
      setForm(blankForm)
      onToast('Income source added', 'success')
    })
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    startDelete(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('income_sources').delete().eq('id', id)
      if (error) { onToast(error.message, 'error'); setDeletingId(null); return }
      setIncome((prev) => prev.filter((i) => i.id !== id))
      setDeletingId(null)
      onToast('Income source deleted', 'success')
    })
  }

  const totalActive = income.filter((i) => i.is_active).reduce((s, i) => s + i.monthly_amount, 0)
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]))

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Income Sources</CardTitle>
            <span className="text-sm font-semibold text-[#10b981]">
              Active: {formatCurrency(totalActive)}/mo
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {income.length === 0 ? (
            <EmptyList label="income sources" />
          ) : (
            <div className="space-y-2">
              {income.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: '#0f172a', border: '1px solid #1e2a3a' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#e2e8f0] truncate">{source.name}</p>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: '#3b82f620', color: '#3b82f6' }}
                      >
                        {capitalize(source.type)}
                      </span>
                      {!source.is_active && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: '#64748b20', color: '#64748b' }}
                        >
                          Inactive
                        </span>
                      )}
                      {members.length > 0 && (
                        <MemberBadge member={source.member_id ? memberMap[source.member_id] : undefined} />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#10b981] tabular-nums">
                      {formatCurrency(source.monthly_amount)}/mo
                    </span>
                    <DeleteButton
                      onClick={() => handleDelete(source.id)}
                      loading={deleting && deletingId === source.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Income Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Name" placeholder="Day job salary" value={form.name} onChange={set('name')} />
            <Select label="Type" value={form.type} onChange={set('type')}>
              <option value="salary">Salary</option>
              <option value="freelance">Freelance</option>
              <option value="rental">Rental</option>
              <option value="dividends">Dividends</option>
              <option value="business">Business</option>
              <option value="side_hustle">Side Hustle</option>
              <option value="other">Other</option>
            </Select>
            <Input label="Monthly Amount ($)" type="number" min={0} placeholder="5000" value={form.monthly_amount} onChange={set('monthly_amount')} />
            <Textarea label="Notes" placeholder="Optional notes..." rows={2} value={form.notes} onChange={set('notes')} />
            <div className="flex items-center gap-3 pt-5">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="w-4 h-4 accent-[#3b82f6]"
              />
              <label htmlFor="is_active" className="text-sm text-[#94a3b8]">
                Currently Active
              </label>
            </div>
            <MemberAssignSelect members={members} value={form.member_id} onChange={set('member_id')} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleAdd} loading={adding}>
              Add Income Source
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────

function ExpensesTab({
  initialExpenses,
  members,
  onToast,
}: {
  initialExpenses: Expense[]
  members: HouseholdMember[]
  onToast: (msg: string, type: 'success' | 'error') => void
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [adding, startAdd] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const blankForm = {
    name: '',
    category: 'housing' as Expense['category'],
    amount: '',
    frequency: 'monthly' as Expense['frequency'],
    is_essential: true,
    notes: '',
    member_id: '',
  }
  const [form, setForm] = useState(blankForm)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  const previewMonthly = form.amount
    ? computeMonthlyEquivalent(parseFloat(form.amount), form.frequency)
    : 0

  function handleAdd() {
    if (!form.name || !form.amount) {
      onToast('Name and amount are required', 'error')
      return
    }
    startAdd(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { onToast('Not authenticated', 'error'); return }

      const monthly_equivalent = computeMonthlyEquivalent(
        parseFloat(form.amount),
        form.frequency,
      )

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          member_id: form.member_id || null,
          name: form.name,
          category: form.category,
          amount: parseFloat(form.amount),
          frequency: form.frequency,
          monthly_equivalent,
          is_essential: form.is_essential,
          notes: form.notes || null,
        })
        .select()
        .single()

      if (error) { onToast(error.message, 'error'); return }
      setExpenses((prev) => [data as Expense, ...prev])
      setForm(blankForm)
      onToast('Expense added', 'success')
    })
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    startDelete(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) { onToast(error.message, 'error'); setDeletingId(null); return }
      setExpenses((prev) => prev.filter((e) => e.id !== id))
      setDeletingId(null)
      onToast('Expense deleted', 'success')
    })
  }

  const totalMonthly = expenses.reduce((s, e) => s + e.monthly_equivalent, 0)
  const grouped = groupBy(expenses, 'category')
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]))

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expenses</CardTitle>
            <span className="text-sm font-semibold text-[#ef4444]">
              Total: {formatCurrency(totalMonthly)}/mo
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <EmptyList label="expenses" />
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                      {capitalize(category)}
                    </span>
                    <span className="text-xs text-[#64748b]">
                      {formatCurrency(items.reduce((s, e) => s + e.monthly_equivalent, 0))}/mo
                    </span>
                  </div>
                  <div className="space-y-2">
                    {items.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ background: '#0f172a', border: '1px solid #1e2a3a' }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#e2e8f0] truncate">{expense.name}</p>
                            {expense.is_essential && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                style={{ background: '#f59e0b20', color: '#f59e0b' }}
                              >
                                Essential
                              </span>
                            )}
                            {members.length > 0 && (
                              <MemberBadge member={expense.member_id ? memberMap[expense.member_id] : undefined} />
                            )}
                          </div>
                          <p className="text-xs text-[#64748b]">
                            {formatCurrency(expense.amount)} / {expense.frequency}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-[#ef4444] tabular-nums">
                            {formatCurrency(expense.monthly_equivalent)}/mo
                          </span>
                          <DeleteButton
                            onClick={() => handleDelete(expense.id)}
                            loading={deleting && deletingId === expense.id}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Name" placeholder="Rent" value={form.name} onChange={set('name')} />
            <Select label="Category" value={form.category} onChange={set('category')}>
              <option value="housing">Housing</option>
              <option value="transport">Transport</option>
              <option value="food">Food</option>
              <option value="utilities">Utilities</option>
              <option value="insurance">Insurance</option>
              <option value="healthcare">Healthcare</option>
              <option value="entertainment">Entertainment</option>
              <option value="education">Education</option>
              <option value="savings">Savings</option>
              <option value="debt_payment">Debt Payment</option>
              <option value="other">Other</option>
            </Select>
            <Input label="Amount ($)" type="number" min={0} placeholder="2000" value={form.amount} onChange={set('amount')} />
            <Select label="Frequency" value={form.frequency} onChange={set('frequency')}>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
              <option value="quarterly">Quarterly</option>
              <option value="weekly">Weekly</option>
            </Select>
            <Textarea label="Notes" placeholder="Optional notes..." rows={2} value={form.notes} onChange={set('notes')} />
            <div className="space-y-3">
              <div className="flex items-center gap-3 pt-5">
                <input
                  type="checkbox"
                  id="is_essential"
                  checked={form.is_essential}
                  onChange={(e) => setForm((p) => ({ ...p, is_essential: e.target.checked }))}
                  className="w-4 h-4 accent-[#3b82f6]"
                />
                <label htmlFor="is_essential" className="text-sm text-[#94a3b8]">
                  Essential Expense
                </label>
              </div>
              {previewMonthly > 0 && form.frequency !== 'monthly' && (
                <p className="text-xs text-[#64748b]">
                  Monthly equivalent:{' '}
                  <span className="text-[#3b82f6] font-semibold">{formatCurrency(previewMonthly)}</span>
                </p>
              )}
            </div>
            <MemberAssignSelect members={members} value={form.member_id} onChange={set('member_id')} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleAdd} loading={adding}>
              Add Expense
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Investments Tab ──────────────────────────────────────────────────────────

function InvestmentsTab({
  initialHoldings,
  onToast,
}: {
  initialHoldings: InvestmentHolding[]
  onToast: (msg: string, type: 'success' | 'error') => void
}) {
  const [holdings, setHoldings] = useState<InvestmentHolding[]>(initialHoldings)
  const [adding, startAdd] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const blankForm = {
    name: '',
    ticker: '',
    type: 'stock' as InvestmentHolding['type'],
    account_type: 'taxable' as InvestmentHolding['account_type'],
    shares: '',
    current_value: '',
    cost_basis: '',
    institution: '',
    currency: 'USD',
  }
  const [form, setForm] = useState(blankForm)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  function handleAdd() {
    if (!form.name || !form.current_value) {
      onToast('Name and current value are required', 'error')
      return
    }
    startAdd(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { onToast('Not authenticated', 'error'); return }

      const { data, error } = await supabase
        .from('investment_holdings')
        .insert({
          user_id: user.id,
          name: form.name,
          ticker: form.ticker || null,
          type: form.type,
          account_type: form.account_type,
          shares: form.shares ? parseFloat(form.shares) : null,
          current_value: parseFloat(form.current_value),
          cost_basis: form.cost_basis ? parseFloat(form.cost_basis) : null,
          institution: form.institution || null,
          currency: form.currency || 'USD',
        })
        .select()
        .single()

      if (error) { onToast(error.message, 'error'); return }
      setHoldings((prev) => [data as InvestmentHolding, ...prev])
      setForm(blankForm)
      onToast('Holding added', 'success')
    })
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    startDelete(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('investment_holdings').delete().eq('id', id)
      if (error) { onToast(error.message, 'error'); setDeletingId(null); return }
      setHoldings((prev) => prev.filter((h) => h.id !== id))
      setDeletingId(null)
      onToast('Holding deleted', 'success')
    })
  }

  const totalValue = holdings.reduce((s, h) => s + h.current_value, 0)
  const totalCostBasis = holdings.reduce((s, h) => s + (h.cost_basis ?? 0), 0)
  const totalGain = totalValue - totalCostBasis
  const grouped = groupBy(holdings, 'account_type')

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Investment Holdings</CardTitle>
            <div className="flex items-center gap-4">
              {totalCostBasis > 0 && (
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: totalGain >= 0 ? '#10b981' : '#ef4444' }}
                >
                  {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)} gain
                </span>
              )}
              <span className="text-sm font-semibold text-[#3b82f6]">
                {formatCurrency(totalValue)} total
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {holdings.length === 0 ? (
            <EmptyList label="holdings" />
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([accountType, items]) => (
                <div key={accountType}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                      {capitalize(accountType)}
                    </span>
                    <span className="text-xs text-[#64748b]">
                      {formatCurrency(items.reduce((s, h) => s + h.current_value, 0))}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {items.map((holding) => {
                      const gain = holding.cost_basis != null
                        ? holding.current_value - holding.cost_basis
                        : null
                      const gainPct = holding.cost_basis && holding.cost_basis > 0
                        ? (gain! / holding.cost_basis) * 100
                        : null

                      return (
                        <div
                          key={holding.id}
                          className="flex items-center justify-between px-4 py-3 rounded-xl"
                          style={{ background: '#0f172a', border: '1px solid #1e2a3a' }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {holding.ticker && (
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded font-mono font-bold"
                                  style={{ background: '#3b82f615', color: '#3b82f6' }}
                                >
                                  {holding.ticker}
                                </span>
                              )}
                              <p className="text-sm font-medium text-[#e2e8f0] truncate">{holding.name}</p>
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                style={{ background: '#64748b20', color: '#94a3b8' }}
                              >
                                {capitalize(holding.type)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              {holding.shares && (
                                <p className="text-xs text-[#64748b]">{holding.shares} shares</p>
                              )}
                              {gain !== null && (
                                <p
                                  className="text-xs font-medium"
                                  style={{ color: gain >= 0 ? '#10b981' : '#ef4444' }}
                                >
                                  {gain >= 0 ? '+' : ''}{formatCurrency(gain)}
                                  {gainPct !== null && ` (${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(1)}%)`}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-[#3b82f6] tabular-nums">
                              {formatCurrency(holding.current_value)}
                            </span>
                            <DeleteButton
                              onClick={() => handleDelete(holding.id)}
                              loading={deleting && deletingId === holding.id}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Holding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Name" placeholder="Apple Inc." value={form.name} onChange={set('name')} />
            <Input label="Ticker (optional)" placeholder="AAPL" value={form.ticker} onChange={set('ticker')} />
            <Select label="Type" value={form.type} onChange={set('type')}>
              <option value="stock">Stock</option>
              <option value="etf">ETF</option>
              <option value="bond">Bond</option>
              <option value="mutual_fund">Mutual Fund</option>
              <option value="crypto">Crypto</option>
              <option value="real_estate">Real Estate</option>
              <option value="commodity">Commodity</option>
              <option value="cash_equivalent">Cash Equivalent</option>
              <option value="other">Other</option>
            </Select>
            <Select label="Account Type" value={form.account_type} onChange={set('account_type')}>
              <option value="taxable">Taxable</option>
              <option value="ira">IRA</option>
              <option value="roth_ira">Roth IRA</option>
              <option value="401k">401k</option>
              <option value="other">Other</option>
            </Select>
            <Input label="Shares (optional)" type="number" min={0} step="0.0001" placeholder="10.5" value={form.shares} onChange={set('shares')} />
            <Input label="Current Value ($)" type="number" min={0} placeholder="15000" value={form.current_value} onChange={set('current_value')} />
            <Input label="Cost Basis ($, optional)" type="number" min={0} placeholder="12000" value={form.cost_basis} onChange={set('cost_basis')} />
            <Input label="Institution" placeholder="Fidelity" value={form.institution} onChange={set('institution')} />
            <Input label="Currency" placeholder="USD" value={form.currency} onChange={set('currency')} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleAdd} loading={adding}>
              Add Holding
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Root Component ───────────────────────────────────────────────────────────

export function SetupForm({
  members: initialMembers,
  profiles,
  profile,
  assets,
  liabilities,
  incomeSources,
  expenses,
  holdings,
}: SetupFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>('members')
  const [toasts, setToasts] = useState<ToastState[]>([])
  const [members, setMembers] = useState<HouseholdMember[]>(initialMembers)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { message, type, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  // Progress summary
  const profileComplete = !!profile?.age || !!profile?.country
  const counts = {
    members: members.length,
    profile: profileComplete ? 1 : 0,
    assets: assets.length,
    liabilities: liabilities.length,
    income: incomeSources.length,
    expenses: expenses.length,
    investments: holdings.length,
  }

  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-toast { animation: toast-in 0.2s ease-out; }
      `}</style>

      {/* Progress bar */}
      <div
        className="mb-6 px-5 py-4 rounded-xl flex items-center gap-6 overflow-x-auto"
        style={{ background: '#111827', border: '1px solid #1e2a3a' }}
      >
        {[
          { key: 'members', label: 'Members', count: counts.members, unit: 'people' },
          { key: 'profile', label: 'Profile', count: counts.profile, unit: profileComplete ? 'done' : 'missing' },
          { key: 'assets', label: 'Assets', count: counts.assets, unit: 'items' },
          { key: 'liabilities', label: 'Liabilities', count: counts.liabilities, unit: 'items' },
          { key: 'income', label: 'Income', count: counts.income, unit: 'sources' },
          { key: 'expenses', label: 'Expenses', count: counts.expenses, unit: 'items' },
          { key: 'investments', label: 'Investments', count: counts.investments, unit: 'holdings' },
        ].map((item, i) => (
          <React.Fragment key={item.key}>
            {i > 0 && <div className="h-8 w-px shrink-0" style={{ background: '#1e2a3a' }} />}
            <div className="shrink-0 text-center">
              <p
                className="text-lg font-bold tabular-nums"
                style={{ color: item.count > 0 ? '#10b981' : '#64748b' }}
              >
                {item.count}
              </p>
              <p className="text-xs text-[#64748b]">{item.label}</p>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto"
        style={{ background: '#111827', border: '1px solid #1e2a3a' }}
        role="tablist"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 min-w-max px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
            style={
              activeTab === tab.id
                ? { background: '#3b82f6', color: '#fff' }
                : { color: '#64748b' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div role="tabpanel">
        {activeTab === 'members' && (
          <MembersTab
            initialMembers={members}
            onToast={showToast}
            onMembersChange={setMembers}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileTab
            profiles={profiles}
            profile={profile}
            members={members}
            onToast={showToast}
          />
        )}
        {activeTab === 'assets' && (
          <AssetsTab initialAssets={assets} members={members} onToast={showToast} />
        )}
        {activeTab === 'liabilities' && (
          <LiabilitiesTab initialLiabilities={liabilities} members={members} onToast={showToast} />
        )}
        {activeTab === 'income' && (
          <IncomeTab initialIncome={incomeSources} members={members} onToast={showToast} />
        )}
        {activeTab === 'expenses' && (
          <ExpensesTab initialExpenses={expenses} members={members} onToast={showToast} />
        )}
        {activeTab === 'investments' && (
          <InvestmentsTab initialHoldings={holdings} onToast={showToast} />
        )}
      </div>

      {/* Toasts */}
      <div aria-live="polite" className="pointer-events-none">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} />
        ))}
      </div>
    </>
  )
}
