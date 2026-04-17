-- =============================================================================
-- Capital Manager - Seed Data
-- =============================================================================
-- Run directly in the Supabase SQL Editor, or via:
--   supabase db seed   (after supabase link)
--   ./scripts/seed-remote.sh   (uses psql)
--
-- No manual UUID replacement needed — the script picks the first user
-- in auth.users automatically. Sign up in the app first, then run this.
-- =============================================================================

do $$
declare
  v_user_id         uuid;
  v_conversation_id uuid;
begin

-- Auto-detect the first signed-up user. Raises a clear error if none exists.
select id into v_user_id from auth.users order by created_at asc limit 1;

if v_user_id is null then
  raise exception 'No users found in auth.users. Sign up in the app first, then re-run this seed.';
end if;

raise notice 'Seeding data for user: %', v_user_id;

-- ---------------------------------------------------------------------------
-- Financial Profile
-- ---------------------------------------------------------------------------
insert into financial_profiles (
  user_id, age, country, tax_jurisdiction, employment_status,
  monthly_income, risk_tolerance, investment_experience, time_horizon,
  emergency_fund_target, dependents, insurance_coverage, restrictions,
  goal_priorities
) values (
  v_user_id,
  34,
  'United States',
  'Federal + California',
  'employed',
  12500.00,
  'moderate',
  'intermediate',
  '10-20 years',
  30000.00,
  1,
  'Health, Life ($500k term), Home, Auto',
  'No tobacco stocks. Prefer ESG-aligned funds where available.',
  'Emergency fund, then retirement max, then taxable investing, then early mortgage payoff'
)
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Assets (5 records)
-- ---------------------------------------------------------------------------
insert into assets (user_id, name, type, value, currency, institution, account_number, notes) values
  (v_user_id, 'Primary Checking Account',    'cash',        8500.00,   'USD', 'Chase Bank',        'CHK-****4821', 'Day-to-day operating account'),
  (v_user_id, 'High-Yield Savings Account',  'savings',     22500.00,  'USD', 'Marcus by Goldman', 'SAV-****3309', 'Emergency fund + short-term goals. 4.5% APY.'),
  (v_user_id, 'Taxable Brokerage Portfolio', 'investment',  85400.00,  'USD', 'Fidelity',          'BRK-****7712', 'Diversified ETF portfolio — see investment holdings'),
  (v_user_id, 'Primary Residence',           'real_estate', 520000.00, 'USD', null,                null,           'Single-family home. Purchased 2021. Estimated market value via Zillow.'),
  (v_user_id, '401(k) Retirement Account',   'retirement',  97800.00,  'USD', 'Fidelity',          '401-****1155', 'Employer plan. 6% contribution + 3% employer match.');

-- ---------------------------------------------------------------------------
-- Liabilities (3 records)
-- ---------------------------------------------------------------------------
insert into liabilities (user_id, name, type, balance, interest_rate, monthly_payment, original_amount, term_months, start_date, institution, notes) values
  (v_user_id, 'Home Mortgage',     'mortgage',    387000.00, 0.0675, 2540.00, 440000.00, 360, '2021-06-01', 'Chase Bank',       '30-year fixed at 6.75%. ~26 years remaining.'),
  (v_user_id, 'Toyota Camry Loan', 'car_loan',     14200.00, 0.0499,  385.00,  22000.00,  60, '2022-09-01', 'Toyota Financial', '5-year loan. Payoff in ~3 years.'),
  (v_user_id, 'Visa Rewards Card', 'credit_card',   3100.00, 0.2199,  400.00,      null, null, null,        'Chase Bank',       'Paid monthly to avoid interest. Current cycle balance.');

-- ---------------------------------------------------------------------------
-- Income Sources (3 records)
-- ---------------------------------------------------------------------------
insert into income_sources (user_id, name, type, monthly_amount, is_active, start_date, notes) values
  (v_user_id, 'Software Engineer Salary', 'salary',    10000.00, true, '2020-03-15', 'Net after federal/state tax, 401k, and health insurance premiums.'),
  (v_user_id, 'Freelance Consulting',     'freelance',  2000.00, true, '2023-01-01', 'Part-time technical consulting. Varies between $1,500–$3,000/month.'),
  (v_user_id, 'Dividend Income',          'dividends',   500.00, true, '2021-06-01', 'Quarterly distributions from ETF holdings, averaged to monthly.');

-- ---------------------------------------------------------------------------
-- Expenses (8 records)
-- ---------------------------------------------------------------------------
insert into expenses (user_id, name, category, amount, frequency, monthly_equivalent, is_essential, notes) values
  (v_user_id, 'Mortgage Payment',          'housing',       2540.00, 'monthly',  2540.00, true,  'Principal + interest only. Taxes and insurance escrowed separately.'),
  (v_user_id, 'Property Tax & Insurance',  'housing',       4800.00, 'annual',    400.00, true,  'Escrowed. Annual estimate.'),
  (v_user_id, 'Car Loan Payment',          'transport',      385.00, 'monthly',   385.00, true,  'Toyota Financial auto loan.'),
  (v_user_id, 'Groceries',                'food',            600.00, 'monthly',   600.00, true,  'Household groceries for 2 adults + 1 child.'),
  (v_user_id, 'Utilities Bundle',          'utilities',      220.00, 'monthly',   220.00, true,  'Electric, gas, water, internet combined estimate.'),
  (v_user_id, 'Health Insurance Premium',  'insurance',      280.00, 'monthly',   280.00, true,  'Employee share after employer subsidy.'),
  (v_user_id, 'Streaming & Subscriptions', 'entertainment',   65.00, 'monthly',    65.00, false, 'Netflix, Spotify, YouTube Premium, iCloud.'),
  (v_user_id, 'Online Courses & Books',    'education',      600.00, 'annual',     50.00, false, 'Technical skill development. Udemy, O''Reilly, books.');

-- ---------------------------------------------------------------------------
-- Investment Holdings (5 records)
-- ---------------------------------------------------------------------------
insert into investment_holdings (user_id, ticker, name, type, account_type, shares, cost_basis, current_value, currency, institution, notes) values
  (v_user_id, 'VTI',   'Vanguard Total Stock Market ETF',        'etf',         'taxable',  210.500, 52000.00, 62150.00, 'USD', 'Fidelity', 'Core US equity holding. Buy-and-hold.'),
  (v_user_id, 'VXUS',  'Vanguard Total International Stock ETF', 'etf',         'taxable',  185.000, 14500.00, 16800.00, 'USD', 'Fidelity', 'International diversification.'),
  (v_user_id, 'BND',   'Vanguard Total Bond Market ETF',         'bond',        'taxable',   98.250,  7800.00,  6450.00, 'USD', 'Fidelity', 'Fixed income allocation.'),
  (v_user_id, 'FXAIX', 'Fidelity 500 Index Fund',                'mutual_fund', '401k',    1250.000, 68000.00, 87400.00, 'USD', 'Fidelity', 'Primary 401k holding. Large-cap US index.'),
  (v_user_id, 'BTC',   'Bitcoin',                                'crypto',      'taxable',    0.350,  9200.00, 10400.00, 'USD', 'Coinbase', 'Speculative 5% allocation. Cold storage backup.');

-- ---------------------------------------------------------------------------
-- Portfolio Snapshot (current day baseline)
-- ---------------------------------------------------------------------------
insert into portfolio_snapshots (user_id, date, total_assets, total_liabilities, net_worth, total_investments, total_cash, monthly_income, monthly_expenses)
values (
  v_user_id,
  current_date,
  734200.00,  -- 8500 + 22500 + 85400 + 520000 + 97800
  404300.00,  -- 387000 + 14200 + 3100
  329900.00,  -- net worth
  183200.00,  -- brokerage + 401k
   31000.00,  -- checking + savings
   12500.00,
    4540.00
)
on conflict (user_id, date) do update set
  total_assets      = excluded.total_assets,
  total_liabilities = excluded.total_liabilities,
  net_worth         = excluded.net_worth,
  total_investments = excluded.total_investments,
  total_cash        = excluded.total_cash,
  monthly_income    = excluded.monthly_income,
  monthly_expenses  = excluded.monthly_expenses;

-- ---------------------------------------------------------------------------
-- Goals (3 records)
-- ---------------------------------------------------------------------------
insert into goals (user_id, title, description, target_value, current_value, unit, deadline, status) values
  (
    v_user_id,
    'Fully-Funded Emergency Fund',
    'Maintain 6 months of essential expenses ($4,540/mo) in the high-yield savings account before deploying additional capital to investments.',
    27240.00, 22500.00, 'USD', '2025-09-30', 'active'
  ),
  (
    v_user_id,
    'Double Monthly Income to $25,000',
    'Grow total gross monthly income from $12,500 to $25,000 through career advancement, freelance expansion, and passive income growth.',
    25000.00, 12500.00, 'USD/month', '2028-12-31', 'active'
  ),
  (
    v_user_id,
    'Reach $500,000 Investment Portfolio',
    'Grow total invested assets (brokerage + retirement) to $500,000 through consistent contributions and compounding.',
    500000.00, 183200.00, 'USD', '2032-01-01', 'active'
  );

-- ---------------------------------------------------------------------------
-- Sample Conversation + Messages
-- ---------------------------------------------------------------------------
insert into conversations (id, user_id, title, ai_provider)
values (gen_random_uuid(), v_user_id, 'How do I double my income?', 'gemini')
returning id into v_conversation_id;

insert into messages (conversation_id, role, content) values
  (
    v_conversation_id,
    'user',
    'Based on my current financial situation, what is the most realistic path for me to double my monthly income to $25,000?'
  ),
  (
    v_conversation_id,
    'assistant',
    'Looking at your profile, you have three parallel levers to reach $25,000/month: (1) Career advancement — a Staff or Principal Engineer role typically pays $160k–$200k base in your market, adding $3k–$5k net/month. (2) Freelance scaling — your current $2,000/month consulting can realistically grow to $5,000–$8,000/month by raising your rate and dedicating 10–15 hours/week. (3) Passive income growth — at your current savings rate, your investment portfolio can generate $1,500–$2,500/month in dividends and distributions within 7–8 years. Combining all three gets you to $25,000/month by 2028 without requiring a dramatic lifestyle change. Want me to build a detailed roadmap for any of these tracks?'
  );

raise notice 'Seed complete for user: %', v_user_id;

end $$;
