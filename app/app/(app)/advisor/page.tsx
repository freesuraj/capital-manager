import { createClient, createAdminClient } from '@/lib/supabase/server'
import type {
  Asset,
  Liability,
  IncomeSource,
  Expense,
  InvestmentHolding,
  FinancialProfile,
  HouseholdMember,
} from '@/types'
import type { ConversationSummary, DBMessage } from './advisor-chat'
import { AdvisorChat } from './advisor-chat'

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

// ─── Financial context builder ───────────────────────────────────────────────

function buildMemberSection(
  memberName: string,
  profile: FinancialProfile | null,
  assets: Asset[],
  liabilities: Liability[],
  incomeSources: IncomeSource[],
  expenses: Expense[],
): string[] {
  const lines: string[] = []

  if (profile) {
    const profileParts: string[] = []
    if (profile.age) profileParts.push(`Age: ${profile.age}`)
    if (profile.country) profileParts.push(`Country: ${profile.country}`)
    if (profile.employment_status) {
      const empMap: Record<string, string> = {
        employed: 'Employed',
        'self-employed': 'Self-employed',
        unemployed: 'Unemployed',
        retired: 'Retired',
      }
      profileParts.push(`Employment: ${empMap[profile.employment_status] ?? profile.employment_status}`)
    }
    if (profile.risk_tolerance) {
      profileParts.push(`Risk tolerance: ${profile.risk_tolerance.charAt(0).toUpperCase() + profile.risk_tolerance.slice(1)}`)
    }
    if (profile.investment_experience) {
      profileParts.push(`Investment experience: ${profile.investment_experience.charAt(0).toUpperCase() + profile.investment_experience.slice(1)}`)
    }
    if (profile.time_horizon) profileParts.push(`Time horizon: ${profile.time_horizon}`)
    if (profile.dependents !== null) profileParts.push(`Dependents: ${profile.dependents}`)
    if (profile.goal_priorities) profileParts.push(`Goal priorities: ${profile.goal_priorities}`)
    if (profile.restrictions) profileParts.push(`Restrictions: ${profile.restrictions}`)
    if (profileParts.length > 0) {
      lines.push(`**Profile**: ${profileParts.join(', ')}`)
    }
  }

  if (assets.length > 0) {
    const total = assets.reduce((s, a) => s + a.value, 0)
    lines.push(`**Assets** (${formatCurrency(total)}):`)
    for (const a of assets) {
      const typeLabel = a.type.charAt(0).toUpperCase() + a.type.slice(1).replace('_', ' ')
      lines.push(`  - ${typeLabel} (${a.name}): ${formatCurrency(a.value)}`)
    }
  }

  if (liabilities.length > 0) {
    const total = liabilities.reduce((s, l) => s + l.balance, 0)
    lines.push(`**Liabilities** (${formatCurrency(total)}):`)
    for (const l of liabilities) {
      const typeLabel = l.type.charAt(0).toUpperCase() + l.type.slice(1).replace('_', ' ')
      lines.push(`  - ${typeLabel} (${l.name}, ${formatPercent(l.interest_rate)} APR, ${formatCurrency(l.monthly_payment)}/mo): ${formatCurrency(l.balance)}`)
    }
  }

  const activeIncome = incomeSources.filter((i) => i.is_active)
  if (activeIncome.length > 0) {
    const total = activeIncome.reduce((s, i) => s + i.monthly_amount, 0)
    lines.push(`**Income** (${formatCurrency(total)}/mo):`)
    for (const i of activeIncome) {
      const typeLabel = i.type.charAt(0).toUpperCase() + i.type.slice(1).replace('_', ' ')
      lines.push(`  - ${typeLabel} (${i.name}): ${formatCurrency(i.monthly_amount)}/mo`)
    }
  }

  if (expenses.length > 0) {
    const total = expenses.reduce((s, e) => s + e.monthly_equivalent, 0)
    lines.push(`**Expenses** (${formatCurrency(total)}/mo):`)
    const byCategory: Record<string, Expense[]> = {}
    for (const e of expenses) {
      if (!byCategory[e.category]) byCategory[e.category] = []
      byCategory[e.category].push(e)
    }
    for (const [cat, items] of Object.entries(byCategory)) {
      const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')
      const catTotal = items.reduce((s, e) => s + e.monthly_equivalent, 0)
      lines.push(`  - ${catLabel}: ${formatCurrency(catTotal)}/mo (${items.map((e) => e.name).join(', ')})`)
    }
  }

  return lines
}

function buildFinancialContext(
  members: HouseholdMember[],
  profiles: FinancialProfile[],
  assets: Asset[],
  liabilities: Liability[],
  incomeSources: IncomeSource[],
  expenses: Expense[],
  holdings: InvestmentHolding[]
): string {
  const sections: string[] = []
  const isHousehold = members.length > 1

  sections.push(isHousehold ? '## Household Financial Situation' : '## Financial Situation')
  sections.push('')

  if (members.length > 0) {
    // Per-member sections
    for (const member of members) {
      sections.push(`### ${member.name} (${member.relationship})`)
      const memberProfile = profiles.find((p) => p.member_id === member.id) ?? null
      const memberAssets = assets.filter((a) => a.member_id === member.id)
      const memberLiabilities = liabilities.filter((l) => l.member_id === member.id)
      const memberIncome = incomeSources.filter((i) => i.member_id === member.id)
      const memberExpenses = expenses.filter((e) => e.member_id === member.id)

      const memberLines = buildMemberSection(member.name, memberProfile, memberAssets, memberLiabilities, memberIncome, memberExpenses)
      if (memberLines.length === 0) {
        sections.push('_(no data entered for this member yet)_')
      } else {
        sections.push(...memberLines)
      }
      sections.push('')
    }

    // Joint / Household section
    const jointAssets = assets.filter((a) => !a.member_id)
    const jointLiabilities = liabilities.filter((l) => !l.member_id)
    const jointIncome = incomeSources.filter((i) => !i.member_id)
    const jointExpenses = expenses.filter((e) => !e.member_id)

    if (jointAssets.length > 0 || jointLiabilities.length > 0 || jointIncome.length > 0 || jointExpenses.length > 0) {
      sections.push('### Joint / Household')
      const jointLines = buildMemberSection('Joint', null, jointAssets, jointLiabilities, jointIncome, jointExpenses)
      sections.push(...jointLines)
      sections.push('')
    }
  } else {
    // No members — legacy single-person mode
    const profile = profiles[0] ?? null
    const legacyLines = buildMemberSection('User', profile, assets, liabilities, incomeSources, expenses)
    sections.push(...legacyLines)
    sections.push('')
  }

  // Investment holdings (shared)
  if (holdings.length > 0) {
    const totalHoldingsValue = holdings.reduce((s, h) => s + h.current_value, 0)
    sections.push(`### Investment Holdings (Total: ${formatCurrency(totalHoldingsValue)})`)
    for (const h of holdings) {
      const typeLabel = h.type.charAt(0).toUpperCase() + h.type.slice(1).replace('_', ' ')
      const costBasis = h.cost_basis ? `, cost basis ${formatCurrency(h.cost_basis)}` : ''
      const gain =
        h.cost_basis != null
          ? `, ${h.current_value >= h.cost_basis ? '+' : ''}${formatPercent(((h.current_value - h.cost_basis) / h.cost_basis) * 100)} gain/loss`
          : ''
      sections.push(
        `- ${h.ticker ? `${h.ticker} ` : ''}${h.name} (${typeLabel}, ${h.account_type}): ${formatCurrency(h.current_value)}${costBasis}${gain}`
      )
    }
    sections.push('')
  }

  // Combined household totals
  const totalAssets = assets.reduce((s, a) => s + a.value, 0)
  const totalLiabilities = liabilities.reduce((s, l) => s + l.balance, 0)
  const netWorth = totalAssets - totalLiabilities
  const totalMonthlyIncome = incomeSources.filter((i) => i.is_active).reduce((s, i) => s + i.monthly_amount, 0)
  const totalMonthlyExpenses = expenses.reduce((s, e) => s + e.monthly_equivalent, 0)
  const monthlyCashFlow = totalMonthlyIncome - totalMonthlyExpenses
  const totalDebtPayments = liabilities.reduce((s, l) => s + l.monthly_payment, 0)
  const debtToIncomeRatio = totalMonthlyIncome > 0 ? (totalDebtPayments / totalMonthlyIncome) * 100 : 0
  const cashAssets = assets.filter((a) => ['cash', 'savings'].includes(a.type)).reduce((s, a) => s + a.value, 0)
  const emergencyFundMonths = totalMonthlyExpenses > 0 ? cashAssets / totalMonthlyExpenses : 0

  sections.push(`### ${isHousehold ? 'Combined Household' : ''} Key Metrics`)
  sections.push(`- Net Worth: ${formatCurrency(netWorth)}`)
  sections.push(`- Monthly Cash Flow: ${formatCurrency(monthlyCashFlow)}`)
  sections.push(`- Debt-to-Income Ratio: ${formatPercent(debtToIncomeRatio)}`)
  sections.push(`- Emergency Fund: ${formatCurrency(cashAssets)} (${emergencyFundMonths.toFixed(1)} months)`)
  if (totalMonthlyIncome > 0) {
    const savingsRate = (monthlyCashFlow / totalMonthlyIncome) * 100
    sections.push(`- Savings Rate: ${formatPercent(Math.max(0, savingsRate))}`)
  }
  sections.push('')

  return sections.join('\n')
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AdvisorPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const adminSupabase = createAdminClient()

  // Parallel data fetch
  const [
    { data: membersData },
    { data: profilesData },
    { data: assetsData },
    { data: liabilitiesData },
    { data: incomeData },
    { data: expensesData },
    { data: holdingsData },
    { data: conversationsData },
  ] = await Promise.all([
    adminSupabase.from('household_members').select('*').eq('user_id', user!.id).order('created_at', { ascending: true }),
    adminSupabase.from('financial_profiles').select('*').eq('user_id', user!.id),
    adminSupabase.from('assets').select('*').eq('user_id', user!.id),
    adminSupabase.from('liabilities').select('*').eq('user_id', user!.id),
    adminSupabase.from('income_sources').select('*').eq('user_id', user!.id),
    adminSupabase.from('expenses').select('*').eq('user_id', user!.id),
    adminSupabase.from('investment_holdings').select('*').eq('user_id', user!.id),
    adminSupabase
      .from('conversations')
      .select('id, title, ai_provider, updated_at')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false })
      .limit(10),
  ])

  const members = (membersData as HouseholdMember[]) ?? []
  const profiles = (profilesData as FinancialProfile[]) ?? []
  const assets = (assetsData as Asset[]) ?? []
  const liabilities = (liabilitiesData as Liability[]) ?? []
  const incomeSources = (incomeData as IncomeSource[]) ?? []
  const expenses = (expensesData as Expense[]) ?? []
  const holdings = (holdingsData as InvestmentHolding[]) ?? []
  const recentConversations = (conversationsData as ConversationSummary[]) ?? []

  // Load messages from the most recent conversation for AI memory
  let initialMessages: DBMessage[] = []
  let initialConversationId: string | null = null
  if (recentConversations.length > 0) {
    const latest = recentConversations[0]
    initialConversationId = latest.id
    const { data: msgData } = await adminSupabase
      .from('messages')
      .select('id, role, content')
      .eq('conversation_id', latest.id)
      .order('created_at', { ascending: true })
      .limit(100)
    initialMessages = (msgData as DBMessage[]) ?? []
  }

  const financialContext = buildFinancialContext(
    members,
    profiles,
    assets,
    liabilities,
    incomeSources,
    expenses,
    holdings
  )

  // Compute summary stats for sidebar
  const totalAssets = assets.reduce((s, a) => s + a.value, 0)
  const totalLiabilities = liabilities.reduce((s, l) => s + l.balance, 0)
  const netWorth = totalAssets - totalLiabilities
  const totalMonthlyIncome = incomeSources
    .filter((i) => i.is_active)
    .reduce((s, i) => s + i.monthly_amount, 0)
  const totalMonthlyExpenses = expenses.reduce((s, e) => s + e.monthly_equivalent, 0)
  const monthlyCashFlow = totalMonthlyIncome - totalMonthlyExpenses
  const cashAssets = assets
    .filter((a) => ['cash', 'savings'].includes(a.type))
    .reduce((s, a) => s + a.value, 0)
  const totalInvestments = assets
    .filter((a) => ['investment', 'retirement'].includes(a.type))
    .reduce((s, a) => s + a.value, 0)
  const debtToIncomeRatio =
    totalMonthlyIncome > 0
      ? (liabilities.reduce((s, l) => s + l.monthly_payment, 0) / totalMonthlyIncome) * 100
      : 0
  const emergencyFundMonths =
    totalMonthlyExpenses > 0 ? cashAssets / totalMonthlyExpenses : 0

  // Primary profile for sidebar display
  const primaryProfile = profiles.find((p) => p.member_id === (members[0]?.id ?? null)) ?? profiles[0] ?? null

  const initialData = {
    netWorth,
    totalAssets,
    totalLiabilities,
    totalMonthlyIncome,
    totalMonthlyExpenses,
    monthlyCashFlow,
    cashAssets,
    totalInvestments,
    debtToIncomeRatio,
    emergencyFundMonths,
    hasData: assets.length > 0 || incomeSources.length > 0,
    profileRiskTolerance: primaryProfile?.risk_tolerance ?? null,
    profileAge: primaryProfile?.age ?? null,
  }

  return (
    <AdvisorChat
      financialContext={financialContext}
      initialData={initialData}
      userId={user!.id}
      initialConversationId={initialConversationId}
      initialMessages={initialMessages}
      recentConversations={recentConversations}
    />
  )
}
