-- =============================================================================
-- Migration: Add household_members support
-- =============================================================================

-- 1. household_members table
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

-- 2. Add member_id to financial tables (nullable = joint/household)
alter table assets          add column if not exists member_id uuid references household_members(id) on delete set null;
alter table liabilities     add column if not exists member_id uuid references household_members(id) on delete set null;
alter table income_sources  add column if not exists member_id uuid references household_members(id) on delete set null;
alter table expenses        add column if not exists member_id uuid references household_members(id) on delete set null;

create index if not exists idx_assets_member         on assets(user_id, member_id);
create index if not exists idx_liabilities_member    on liabilities(user_id, member_id);
create index if not exists idx_income_sources_member on income_sources(user_id, member_id);
create index if not exists idx_expenses_member       on expenses(user_id, member_id);

-- 3. Allow multiple profiles per user (one per member)
--    Drop the unique constraint on user_id and add member_id
alter table financial_profiles drop constraint if exists financial_profiles_user_id_key;
alter table financial_profiles add column if not exists member_id uuid references household_members(id) on delete cascade;

create unique index if not exists idx_financial_profiles_member
  on financial_profiles(member_id) where member_id is not null;
