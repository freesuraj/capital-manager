import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { SetupForm } from './setup-form'
import type {
  FinancialProfile,
  Asset,
  Liability,
  IncomeSource,
  Expense,
  InvestmentHolding,
  HouseholdMember,
} from '@/types'

export default async function SetupPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const adminSupabase = createAdminClient()

  const [
    { data: membersData },
    { data: profilesData },
    { data: assetsData },
    { data: liabilitiesData },
    { data: incomeData },
    { data: expensesData },
    { data: holdingsData },
  ] = await Promise.all([
    supabase
      .from('household_members')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('financial_profiles')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('assets')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('liabilities')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('income_sources')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('investment_holdings')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
  ])

  // Legacy: if no member_id on profiles, pick first profile for backward-compat
  const profiles = (profilesData as FinancialProfile[]) ?? []
  const profile = profiles.find((p) => !p.member_id) ?? profiles[0] ?? null

  return (
    <div className="fade-in">
      <PageHeader
        title="Setup"
        subtitle="Enter your financial data to power your dashboard and AI advisor"
      />
      <SetupForm
        members={(membersData as HouseholdMember[]) ?? []}
        profiles={profiles}
        profile={profile}
        assets={(assetsData as Asset[]) ?? []}
        liabilities={(liabilitiesData as Liability[]) ?? []}
        incomeSources={(incomeData as IncomeSource[]) ?? []}
        expenses={(expensesData as Expense[]) ?? []}
        holdings={(holdingsData as InvestmentHolding[]) ?? []}
      />
    </div>
  )
}
