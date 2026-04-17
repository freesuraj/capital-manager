import { createClient, createAdminClient } from '@/lib/supabase/server'
import type {
  Asset,
  Liability,
  IncomeSource,
  Expense,
  InvestmentHolding,
  FinancialProfile,
} from '@/types'
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

function buildFinancialContext(
  profile: FinancialProfile | null,
  assets: Asset[],
  liabilities: Liability[],
  incomeSources: IncomeSource[],
  expenses: Expense[],
  holdings: InvestmentHolding[]
): string {
  const totalAssets = assets.reduce((s, a) => s + a.value, 0)
  const totalLiabilities = liabilities.reduce((s, l) => s + l.balance, 0)
  const netWorth = totalAssets - totalLiabilities

  const totalMonthlyIncome = incomeSources
    .filter((i) => i.is_active)
    .reduce((s, i) => s + i.monthly_amount, 0)

  const totalMonthlyExpenses = expenses.reduce((s, e) => s + e.monthly_equivalent, 0)
  const monthlyCashFlow = totalMonthlyIncome - totalMonthlyExpenses

  const totalDebtPayments = liabilities.reduce((s, l) => s + l.monthly_payment, 0)
  const debtToIncomeRatio =
    totalMonthlyIncome > 0 ? (totalDebtPayments / totalMonthlyIncome) * 100 : 0

  const cashAssets = assets
    .filter((a) => ['cash', 'savings'].includes(a.type))
    .reduce((s, a) => s + a.value, 0)
  const emergencyFundMonths =
    totalMonthlyExpenses > 0 ? cashAssets / totalMonthlyExpenses : 0

  const sections: string[] = []

  sections.push('## User Current Financial Situation')
  sections.push('')

  // Profile
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
      profileParts.push(
        `Risk tolerance: ${profile.risk_tolerance.charAt(0).toUpperCase() + profile.risk_tolerance.slice(1)}`
      )
    }
    if (profile.investment_experience) {
      profileParts.push(
        `Investment experience: ${profile.investment_experience.charAt(0).toUpperCase() + profile.investment_experience.slice(1)}`
      )
    }
    if (profile.time_horizon) profileParts.push(`Time horizon: ${profile.time_horizon}`)
    if (profile.dependents !== null) profileParts.push(`Dependents: ${profile.dependents}`)
    if (profile.tax_jurisdiction) profileParts.push(`Tax jurisdiction: ${profile.tax_jurisdiction}`)
    if (profile.emergency_fund_target) {
      profileParts.push(`Emergency fund target: ${formatCurrency(profile.emergency_fund_target)}`)
    }
    if (profile.goal_priorities) profileParts.push(`Goal priorities: ${profile.goal_priorities}`)
    if (profile.restrictions) profileParts.push(`Restrictions/constraints: ${profile.restrictions}`)

    sections.push(`**Profile**: ${profileParts.join(', ')}`)
    sections.push('')
  }

  // Assets
  sections.push(`**Assets** (Total: ${formatCurrency(totalAssets)}):`)
  if (assets.length === 0) {
    sections.push('- No assets recorded')
  } else {
    for (const a of assets) {
      const typeLabel = a.type.charAt(0).toUpperCase() + a.type.slice(1).replace('_', ' ')
      sections.push(`- ${typeLabel} (${a.name}): ${formatCurrency(a.value)}${a.notes ? ` — ${a.notes}` : ''}`)
    }
  }
  sections.push('')

  // Liabilities
  sections.push(`**Liabilities** (Total: ${formatCurrency(totalLiabilities)}):`)
  if (liabilities.length === 0) {
    sections.push('- No liabilities recorded')
  } else {
    for (const l of liabilities) {
      const typeLabel = l.type.charAt(0).toUpperCase() + l.type.slice(1).replace('_', ' ')
      sections.push(
        `- ${typeLabel} (${l.name}, ${formatPercent(l.interest_rate)} interest, ${formatCurrency(l.monthly_payment)}/mo): Balance ${formatCurrency(l.balance)}`
      )
    }
  }
  sections.push('')

  // Income
  const activeIncome = incomeSources.filter((i) => i.is_active)
  sections.push(`**Monthly Income** (Total: ${formatCurrency(totalMonthlyIncome)}):`)
  if (activeIncome.length === 0) {
    sections.push('- No income sources recorded')
  } else {
    for (const i of activeIncome) {
      const typeLabel = i.type.charAt(0).toUpperCase() + i.type.slice(1).replace('_', ' ')
      sections.push(`- ${typeLabel} (${i.name}): ${formatCurrency(i.monthly_amount)}/mo`)
    }
  }
  sections.push('')

  // Expenses
  sections.push(`**Monthly Expenses** (Total: ${formatCurrency(totalMonthlyExpenses)}):`)
  if (expenses.length === 0) {
    sections.push('- No expenses recorded')
  } else {
    // Group by category
    const byCategory: Record<string, Expense[]> = {}
    for (const e of expenses) {
      if (!byCategory[e.category]) byCategory[e.category] = []
      byCategory[e.category].push(e)
    }
    for (const [cat, items] of Object.entries(byCategory)) {
      const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')
      const catTotal = items.reduce((s, e) => s + e.monthly_equivalent, 0)
      sections.push(`- ${catLabel}: ${formatCurrency(catTotal)}/mo (${items.map((e) => e.name).join(', ')})`)
    }
  }
  sections.push('')

  // Investment holdings
  if (holdings.length > 0) {
    const totalHoldingsValue = holdings.reduce((s, h) => s + h.current_value, 0)
    sections.push(`**Investment Holdings** (Total: ${formatCurrency(totalHoldingsValue)}):`)
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

  // Key metrics
  sections.push('**Key Financial Metrics**:')
  sections.push(`- Net Worth: ${formatCurrency(netWorth)}`)
  sections.push(`- Monthly Cash Flow: ${formatCurrency(monthlyCashFlow)}`)
  sections.push(`- Debt-to-Income Ratio: ${formatPercent(debtToIncomeRatio)}`)
  sections.push(`- Emergency Fund: ${formatCurrency(cashAssets)} (${emergencyFundMonths.toFixed(1)} months of expenses)`)
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
    { data: profileData },
    { data: assetsData },
    { data: liabilitiesData },
    { data: incomeData },
    { data: expensesData },
    { data: holdingsData },
  ] = await Promise.all([
    adminSupabase.from('financial_profiles').select('*').eq('user_id', user!.id).single(),
    adminSupabase.from('assets').select('*').eq('user_id', user!.id),
    adminSupabase.from('liabilities').select('*').eq('user_id', user!.id),
    adminSupabase.from('income_sources').select('*').eq('user_id', user!.id),
    adminSupabase.from('expenses').select('*').eq('user_id', user!.id),
    adminSupabase.from('investment_holdings').select('*').eq('user_id', user!.id),
  ])

  const profile = profileData as FinancialProfile | null
  const assets = (assetsData as Asset[]) ?? []
  const liabilities = (liabilitiesData as Liability[]) ?? []
  const incomeSources = (incomeData as IncomeSource[]) ?? []
  const expenses = (expensesData as Expense[]) ?? []
  const holdings = (holdingsData as InvestmentHolding[]) ?? []

  const financialContext = buildFinancialContext(
    profile,
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
    profileRiskTolerance: profile?.risk_tolerance ?? null,
    profileAge: profile?.age ?? null,
  }

  return (
    <AdvisorChat
      financialContext={financialContext}
      initialData={initialData}
    />
  )
}
