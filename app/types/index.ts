export interface FinancialProfile {
  id: string
  user_id: string
  age: number | null
  country: string | null
  tax_jurisdiction: string | null
  employment_status: 'employed' | 'self-employed' | 'unemployed' | 'retired' | null
  monthly_income: number | null
  risk_tolerance: 'low' | 'moderate' | 'high' | null
  investment_experience: 'beginner' | 'intermediate' | 'advanced' | null
  time_horizon: string | null
  emergency_fund_target: number | null
  dependents: number | null
  insurance_coverage: string | null
  restrictions: string | null
  goal_priorities: string | null
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  user_id: string
  name: string
  type: 'cash' | 'savings' | 'investment' | 'real_estate' | 'retirement' | 'business' | 'other'
  value: number
  currency: string
  institution: string | null
  account_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Liability {
  id: string
  user_id: string
  name: string
  type: 'mortgage' | 'car_loan' | 'student_loan' | 'credit_card' | 'personal_loan' | 'business_loan' | 'other'
  balance: number
  interest_rate: number
  monthly_payment: number
  original_amount: number | null
  term_months: number | null
  start_date: string | null
  institution: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface IncomeSource {
  id: string
  user_id: string
  name: string
  type: 'salary' | 'freelance' | 'rental' | 'dividends' | 'business' | 'side_hustle' | 'other'
  monthly_amount: number
  is_active: boolean
  start_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  user_id: string
  name: string
  category: 'housing' | 'transport' | 'food' | 'utilities' | 'insurance' | 'healthcare' | 'entertainment' | 'education' | 'savings' | 'debt_payment' | 'other'
  amount: number
  frequency: 'monthly' | 'annual' | 'quarterly' | 'weekly'
  monthly_equivalent: number
  is_essential: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InvestmentHolding {
  id: string
  user_id: string
  ticker: string | null
  name: string
  type: 'stock' | 'etf' | 'bond' | 'mutual_fund' | 'crypto' | 'real_estate' | 'commodity' | 'cash_equivalent' | 'other'
  account_type: 'taxable' | 'ira' | 'roth_ira' | '401k' | 'other'
  shares: number | null
  cost_basis: number | null
  current_value: number
  currency: string
  institution: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PortfolioSnapshot {
  id: string
  user_id: string
  date: string
  total_assets: number
  total_liabilities: number
  net_worth: number
  total_investments: number
  total_cash: number
  monthly_income: number
  monthly_expenses: number
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  ai_provider: 'claude' | 'gemini'
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  target_value: number
  current_value: number
  unit: string
  deadline: string | null
  status: 'active' | 'achieved' | 'paused'
  created_at: string
  updated_at: string
}

// Computed types
export interface FinancialSummary {
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  totalMonthlyIncome: number
  totalMonthlyExpenses: number
  monthlyCashFlow: number
  totalInvestments: number
  totalCash: number
  debtToIncomeRatio: number
  savingsRate: number
  emergencyFundMonths: number
}

export interface NetWorthHistory {
  date: string
  netWorth: number
  assets: number
  liabilities: number
}
