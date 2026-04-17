-- =============================================================================
-- Capital Manager - Supabase Database Schema
-- =============================================================================
-- Run this entire file in the Supabase SQL editor to initialize the database.
-- =============================================================================

-- Enable required extensions


-- =============================================================================
-- TRIGGER FUNCTION: updated_at
-- =============================================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =============================================================================
-- TABLE: household_members
-- =============================================================================

create table if not exists household_members (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  relationship text not null check (relationship in ('self','partner','dependent','other')),
  color        text not null default '#3b82f6',
  is_primary   boolean not null default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table household_members enable row level security;

create policy "Users can manage own household_members" on household_members
  for all using (auth.uid() = user_id);

create index if not exists idx_household_members_user_id on household_members(user_id);

create trigger update_household_members_updated_at
  before update on household_members
  for each row execute function update_updated_at();

-- =============================================================================
-- TABLE: financial_profiles
-- =============================================================================

create table if not exists financial_profiles (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users(id) on delete cascade not null,
  member_id            uuid references household_members(id) on delete cascade,
  age                  int,
  country              text,
  tax_jurisdiction     text,
  employment_status    text check (employment_status in ('employed', 'self-employed', 'unemployed', 'retired')),
  monthly_income       numeric(15,2),
  risk_tolerance       text check (risk_tolerance in ('low', 'moderate', 'high')),
  investment_experience text check (investment_experience in ('beginner', 'intermediate', 'advanced')),
  time_horizon         text,
  emergency_fund_target numeric(15,2),
  dependents           int default 0,
  insurance_coverage   text,
  restrictions         text,
  goal_priorities      text,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table financial_profiles enable row level security;

create policy "Users can manage own financial_profiles" on financial_profiles
  for all using (auth.uid() = user_id);

create index if not exists idx_financial_profiles_user_id on financial_profiles(user_id);
create unique index if not exists idx_financial_profiles_member on financial_profiles(member_id) where member_id is not null;

create trigger update_financial_profiles_updated_at
  before update on financial_profiles
  for each row execute function update_updated_at();

-- =============================================================================
-- TABLE: assets
-- =============================================================================

create table if not exists assets (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  member_id      uuid references household_members(id) on delete set null,
  name           text not null,
  type           text not null check (type in ('cash', 'savings', 'investment', 'real_estate', 'retirement', 'business', 'other')),
  value          numeric(15,2) not null default 0,
  currency       text default 'USD',
  institution    text,
  account_number text,
  notes          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

alter table assets enable row level security;

create policy "Users can manage own assets" on assets
  for all using (auth.uid() = user_id);

create index if not exists idx_assets_user_id on assets(user_id);
create index if not exists idx_assets_type on assets(user_id, type);
create index if not exists idx_assets_member on assets(user_id, member_id);

create trigger update_assets_updated_at
  before update on assets
  for each row execute function update_updated_at();

-- =============================================================================
-- TABLE: liabilities
-- =============================================================================

create table if not exists liabilities (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  member_id        uuid references household_members(id) on delete set null,
  name             text not null,
  type             text not null check (type in ('mortgage', 'car_loan', 'student_loan', 'credit_card', 'personal_loan', 'business_loan', 'other')),
  balance          numeric(15,2) not null default 0,
  interest_rate    numeric(6,4) not null default 0,
  monthly_payment  numeric(15,2) not null default 0,
  original_amount  numeric(15,2),
  term_months      int,
  start_date       date,
  institution      text,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table liabilities enable row level security;

create policy "Users can manage own liabilities" on liabilities
  for all using (auth.uid() = user_id);

create index if not exists idx_liabilities_user_id on liabilities(user_id);
create index if not exists idx_liabilities_type on liabilities(user_id, type);
create index if not exists idx_liabilities_member on liabilities(user_id, member_id);

create trigger update_liabilities_updated_at
  before update on liabilities
  for each row execute function update_updated_at();

-- =============================================================================
-- TABLE: income_sources
-- =============================================================================

create table if not exists income_sources (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  member_id      uuid references household_members(id) on delete set null,
  name           text not null,
  type           text not null check (type in ('salary', 'freelance', 'rental', 'dividends', 'business', 'side_hustle', 'other')),
  monthly_amount numeric(15,2) not null default 0,
  is_active      boolean default true,
  start_date     date,
  notes          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

alter table income_sources enable row level security;

create policy "Users can manage own income_sources" on income_sources
  for all using (auth.uid() = user_id);

create index if not exists idx_income_sources_user_id on income_sources(user_id);
create index if not exists idx_income_sources_active on income_sources(user_id, is_active);
create index if not exists idx_income_sources_member on income_sources(user_id, member_id);

create trigger update_income_sources_updated_at
  before update on income_sources
  for each row execute function update_updated_at();

-- =============================================================================
-- TABLE: expenses
-- =============================================================================

create table if not exists expenses (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users(id) on delete cascade not null,
  member_id          uuid references household_members(id) on delete set null,
  name               text not null,
  category           text not null check (category in ('housing', 'transport', 'food', 'utilities', 'insurance', 'healthcare', 'entertainment', 'education', 'savings', 'debt_payment', 'other')),
  amount             numeric(15,2) not null default 0,
  frequency          text not null check (frequency in ('monthly', 'annual', 'quarterly', 'weekly')),
  monthly_equivalent numeric(15,2) not null default 0,
  is_essential       boolean default true,
  notes              text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

alter table expenses enable row level security;

create policy "Users can manage own expenses" on expenses
  for all using (auth.uid() = user_id);

create index if not exists idx_expenses_user_id on expenses(user_id);
create index if not exists idx_expenses_category on expenses(user_id, category);
create index if not exists idx_expenses_essential on expenses(user_id, is_essential);
create index if not exists idx_expenses_member on expenses(user_id, member_id);

create trigger update_expenses_updated_at
  before update on expenses
  for each row execute function update_updated_at();

-- =============================================================================
-- TABLE: investment_holdings
-- =============================================================================

create table if not exists investment_holdings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  ticker        text,
  name          text not null,
  type          text not null check (type in ('stock', 'etf', 'bond', 'mutual_fund', 'crypto', 'real_estate', 'commodity', 'cash_equivalent', 'other')),
  account_type  text not null check (account_type in ('taxable', 'ira', 'roth_ira', '401k', 'other')),
  shares        numeric(20,8),
  cost_basis    numeric(15,2),
  current_value numeric(15,2) not null default 0,
  currency      text default 'USD',
  institution   text,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table investment_holdings enable row level security;

create policy "Users can manage own investment_holdings" on investment_holdings
  for all using (auth.uid() = user_id);

create index if not exists idx_investment_holdings_user_id on investment_holdings(user_id);
create index if not exists idx_investment_holdings_type on investment_holdings(user_id, type);
create index if not exists idx_investment_holdings_account_type on investment_holdings(user_id, account_type);
create index if not exists idx_investment_holdings_ticker on investment_holdings(ticker) where ticker is not null;

create trigger update_investment_holdings_updated_at
  before update on investment_holdings
  for each row execute function update_updated_at();

-- =============================================================================
-- TABLE: portfolio_snapshots
-- =============================================================================

create table if not exists portfolio_snapshots (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users(id) on delete cascade not null,
  date               date not null,
  total_assets       numeric(15,2) not null default 0,
  total_liabilities  numeric(15,2) not null default 0,
  net_worth          numeric(15,2) not null default 0,
  total_investments  numeric(15,2) default 0,
  total_cash         numeric(15,2) default 0,
  monthly_income     numeric(15,2) default 0,
  monthly_expenses   numeric(15,2) default 0,
  created_at         timestamptz default now(),
  unique(user_id, date)
);

alter table portfolio_snapshots enable row level security;

create policy "Users can manage own portfolio_snapshots" on portfolio_snapshots
  for all using (auth.uid() = user_id);

create index if not exists idx_portfolio_snapshots_user_id on portfolio_snapshots(user_id);
create index if not exists idx_portfolio_snapshots_date on portfolio_snapshots(user_id, date desc);

-- =============================================================================
-- TABLE: conversations
-- =============================================================================

create table if not exists conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null default 'New conversation',
  ai_provider text not null default 'claude' check (ai_provider in ('claude', 'gemini')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table conversations enable row level security;

create policy "Users can manage own conversations" on conversations
  for all using (auth.uid() = user_id);

create index if not exists idx_conversations_user_id on conversations(user_id);
create index if not exists idx_conversations_updated_at on conversations(user_id, updated_at desc);

create trigger update_conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at();

-- =============================================================================
-- TABLE: messages
-- =============================================================================
-- Messages are owned indirectly through conversations. The RLS policy joins
-- through conversations to verify the requesting user owns the parent row.
-- =============================================================================

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  created_at      timestamptz default now()
);

alter table messages enable row level security;

create policy "Users can manage own messages" on messages
  for all using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_messages_created_at on messages(conversation_id, created_at asc);

-- =============================================================================
-- TABLE: goals
-- =============================================================================

create table if not exists goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  title         text not null,
  description   text,
  target_value  numeric(15,2) not null,
  current_value numeric(15,2) not null default 0,
  unit          text not null default 'USD',
  deadline      date,
  status        text not null default 'active' check (status in ('active', 'achieved', 'paused')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table goals enable row level security;

create policy "Users can manage own goals" on goals
  for all using (auth.uid() = user_id);

create index if not exists idx_goals_user_id on goals(user_id);
create index if not exists idx_goals_status on goals(user_id, status);
create index if not exists idx_goals_deadline on goals(user_id, deadline asc) where deadline is not null;

create trigger update_goals_updated_at
  before update on goals
  for each row execute function update_updated_at();
