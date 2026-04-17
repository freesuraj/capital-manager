# CapitalManager

Personal finance portfolio manager. Track net worth, analyse cash flow, manage investments, and get AI-powered capital advice from Claude or Gemini — all aimed at doubling income in 4–6 months.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS · Supabase · Recharts · Anthropic Claude · Google Gemini Flash · Fly.io

---

## Table of Contents

1. [Local development](#local-development)
2. [Supabase setup](#supabase-setup)
   - [Create project](#1-create-project)
   - [Configure auth](#2-configure-auth)
   - [Run the schema](#3-run-the-schema)
   - [Get your API keys](#4-get-your-api-keys)
   - [Optional: load seed data](#5-optional-load-seed-data)
3. [Environment variables](#environment-variables)
4. [GitHub Secrets](#github-secrets)
5. [Deploy to Fly.io](#deploy-to-flyio)
6. [Architecture](#architecture)
7. [Database schema](#database-schema)
8. [Resetting the database](#resetting-the-database)

---

## Local development

```bash
# 1. Clone and install
git clone https://github.com/freesuraj/capital-manager
cd capital-manager
npm install          # installs nothing — delegates to app/

# 2. Set up environment
cp app/.env.example app/.env.local
# Fill in app/.env.local with your keys (see below)

# 3. Run schema in Supabase (see Supabase setup section)

# 4. Start dev server
npm run dev          # runs on http://localhost:3000
```

> All `npm` commands delegate to `app/`. You can also `cd app && npm run dev` — both work.

---

## Supabase setup

No Edge Functions are used. All AI and server logic runs in Next.js API routes. Supabase provides:
- Postgres database
- Row Level Security (RLS) — data is isolated per user automatically
- Auth (email/password sign-up)

### 1. Create project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New project**.
3. Set a name (e.g. `capital-manager`), choose a strong database password, and pick the region closest to you.
4. Wait ~60 seconds for provisioning to finish.

### 2. Configure auth

The app uses email/password auth. You need to whitelist your local and production URLs so Supabase redirects correctly after sign-in.

1. In the dashboard go to **Authentication → URL Configuration**.
2. Set **Site URL** to your production URL (e.g. `https://capital-manager.fly.dev`).
3. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/auth/callback
   https://capital-manager.fly.dev/auth/callback
   ```
4. Click **Save**.

No email templates need changing. The default confirmation email works out of the box.

> If you want to skip email confirmation during development, go to **Authentication → Providers → Email** and turn off **Confirm email**.

### 3. Run the schema

The schema creates all 10 tables, enables RLS on each, adds policies, indexes, and `updated_at` triggers. There are **no migrations** — it is a single idempotent SQL file.

1. In the dashboard open **SQL Editor → New query**.
2. Paste the entire contents of `supabase/schema.sql`.
3. Click **Run** (or `Cmd+Enter`).

Verify in **Table Editor** that these tables were created:

| Table | Purpose |
|---|---|
| `financial_profiles` | Age, country, risk tolerance, employment |
| `assets` | Everything you own (cash, property, investments) |
| `liabilities` | Everything you owe (mortgage, loans, credit cards) |
| `income_sources` | Salary, freelance, rental, dividends, etc. |
| `expenses` | Monthly and annual outgoings by category |
| `investment_holdings` | Individual holdings (ticker, shares, cost basis) |
| `portfolio_snapshots` | Daily net worth history for charts |
| `conversations` | AI advisor conversation threads |
| `messages` | Messages within each conversation |
| `goals` | Financial goals with progress tracking |

### 4. Get your API keys

Go to **Settings → API** in the Supabase dashboard. You need two keys:

| Key | Where | Used for |
|---|---|---|
| **Project URL** | Settings → API → Project URL | All clients |
| **anon / public** | Settings → API → Project API keys | Browser client + auth proxy |
| **secret** (`service_role`) | Settings → API → Project API keys | Server-side data queries (bypasses RLS) |

> The **secret** key is labelled `service_role` in the dashboard and has a "Reveal" button. Never put it in client-side code or commit it.

Copy these into `app/.env.local` (see [Environment variables](#environment-variables)).

### 5. Optional: load seed data

The seed file inserts a realistic financial profile so you can explore the app without typing in your own data first.

1. Sign up in the app at `http://localhost:3000/signup` so your user row exists in Supabase.
2. Find your **User UID** under **Authentication → Users** in the dashboard.
3. Open `supabase/seed.sql` and replace the placeholder UUID:
   ```
   00000000-0000-0000-0000-000000000000
   ```
   with your actual UID.
4. Run the modified file in **SQL Editor**.

Seed data summary:

| Category | Count |
|---|---|
| Financial profile | 1 |
| Assets | 5 — checking, savings, brokerage, home, 401k |
| Liabilities | 3 — mortgage, car loan, credit card |
| Income sources | 3 — salary, freelance, dividends |
| Expenses | 8 — across all categories |
| Investment holdings | 5 — VTI, VXUS, BND, FXAIX, BTC |
| Goals | 3 — emergency fund, double income, $500k portfolio |

---

## Environment variables

Copy `app/.env.example` to `app/.env.local` and fill in every value:

```env
# ── Supabase ────────────────────────────────────────────────────────────────
# Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

# Settings → API → Project API keys → anon / public
# Safe to expose — RLS prevents cross-user access
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Settings → API → Project API keys → secret (service_role)
# Server-only. Never expose to the browser.
SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── AI providers ────────────────────────────────────────────────────────────
# https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-api03-...

# https://aistudio.google.com/app/apikey
GOOGLE_AI_API_KEY=AIzaSy...

# ── App ─────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### How each key is used

| Variable | Build time | Runtime | Where |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (build arg) | Yes | Browser + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (build arg) | Yes | Browser client, auth proxy |
| `SUPABASE_SECRET_KEY` | No | Yes (server only) | Data queries in server components |
| `ANTHROPIC_API_KEY` | No | Yes (server only) | `/api/chat` route |
| `GOOGLE_AI_API_KEY` | No | Yes (server only) | `/api/chat` route |
| `NEXT_PUBLIC_APP_URL` | Yes (build arg) | Yes | Redirects |

---

## GitHub Secrets

Add these under **github.com/freesuraj/capital-manager → Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `FLY_API_TOKEN` | Output of `flyctl auth token` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SECRET_KEY` | Your Supabase secret (service_role) key |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `GOOGLE_AI_API_KEY` | Your Google AI Studio key |
| `NEXT_PUBLIC_APP_URL` | `https://capital-manager.fly.dev` |

The deploy workflow (`.github/workflows/deploy.yml`) automatically:
- Passes `NEXT_PUBLIC_*` vars as Docker build args (baked into the JS bundle at build time)
- Stages `SUPABASE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY` as Fly.io runtime secrets

---

## Deploy to Fly.io

### First deploy (one-time setup)

```bash
# Install flyctl if you haven't
brew install flyctl

# Log in
flyctl auth login

# Create the app (run from repo root or app/)
cd app
flyctl launch --no-deploy --name capital-manager --region syd

# Set runtime secrets on Fly directly (also managed via GitHub Actions after this)
flyctl secrets set \
  SUPABASE_SECRET_KEY="eyJ..." \
  ANTHROPIC_API_KEY="sk-ant-..." \
  GOOGLE_AI_API_KEY="AIza..."

# Get your Fly API token and add it to GitHub Secrets as FLY_API_TOKEN
flyctl auth token

# Add all 7 secrets to GitHub (see GitHub Secrets section above)

# First deploy
flyctl deploy --remote-only \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..." \
  --build-arg NEXT_PUBLIC_APP_URL="https://capital-manager.fly.dev"
```

### Subsequent deploys

Push to `master` — GitHub Actions handles it automatically.

```bash
git push origin master
```

---

## Architecture

```
Browser
  │
  ├── Auth pages (/login, /signup)
  │     └── Supabase anon key + cookie session
  │
  └── App pages (/dashboard, /portfolio, /cash-flow, /balance-sheet, /goals, /advisor, /setup)
        │
        ├── proxy.ts            Auth gate — refreshes session cookie on every request
        │
        ├── (app)/layout.tsx    Server: verifies user via anon key + cookies
        │
        ├── page.tsx (server)   Fetches data via SUPABASE_SECRET_KEY (bypasses RLS)
        │                       Data is still filtered by user_id in every query
        │
        └── /api/chat           Streams responses from Claude or Gemini
                                Receives financial context built server-side
```

**Two Supabase clients:**

| Client | Key used | Purpose |
|---|---|---|
| `createClient()` in `lib/supabase/server.ts` | Anon key + cookies | `auth.getUser()` in layout and proxy |
| `createAdminClient()` in `lib/supabase/server.ts` | Secret key | All `.from('table')` data queries |

---

## Database schema

```
auth.users  (Supabase managed)
  │
  ├── financial_profiles   (1:1)   Personal details, risk profile
  ├── assets               (1:many) What you own
  ├── liabilities          (1:many) What you owe
  ├── income_sources       (1:many) Money coming in
  ├── expenses             (1:many) Money going out
  ├── investment_holdings  (1:many) Individual positions
  ├── portfolio_snapshots  (1:many, unique per date) Net worth history
  ├── goals                (1:many) Financial targets
  └── conversations        (1:many) AI chat threads
        └── messages       (1:many, cascade delete)
```

**RLS:** Every table has Row Level Security enabled. All policies use `auth.uid() = user_id` so queries from one user can never see another user's data. The `messages` table has no `user_id` column — its policy joins through `conversations` to verify ownership.

**Triggers:** All tables with an `updated_at` column have a `before update` trigger that sets `updated_at = now()` automatically.

---

## Resetting the database

To tear down all tables and start fresh, run this in **SQL Editor**:

```sql
drop table if exists messages cascade;
drop table if exists conversations cascade;
drop table if exists goals cascade;
drop table if exists portfolio_snapshots cascade;
drop table if exists investment_holdings cascade;
drop table if exists expenses cascade;
drop table if exists income_sources cascade;
drop table if exists liabilities cascade;
drop table if exists assets cascade;
drop table if exists financial_profiles cascade;
drop function if exists update_updated_at cascade;
```

Then re-run `supabase/schema.sql`.
