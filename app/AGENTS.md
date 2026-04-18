<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Capital Manager — Agent Context

## What This App Is
A personal finance portfolio manager web app. Single-user SaaS with an AI advisor (Claude + Gemini). Goal: track household finances and work toward doubling income in 4–6 months.

## Tech Stack
- **Framework**: Next.js (App Router) — uses `proxy.ts` NOT `middleware.ts`
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 — use `@import "tailwindcss"`, inline hex colors (e.g. `bg-[#111827]`)
- **Database**: Supabase (PostgreSQL + RLS + auth)
- **AI**: Anthropic Claude (`claude-sonnet-4-6`) and Google Gemini (`gemini-2.5-flash-lite`)
- **Charts**: Recharts
- **Deployment**: Fly.io (`capital-manager`, region `syd`) via Docker

## Repository Layout (inside `app/`)
```
app/
  app/
    (auth)/          # login, signup pages
    (app)/           # authenticated pages — layout has auth guard
      dashboard/     # net worth, charts, stats
      portfolio/     # investment holdings
      cash-flow/     # income vs expenses
      balance-sheet/ # assets vs liabilities, ratios
      goals/         # goal tracker
      advisor/       # AI chat (Claude or Gemini), streaming
      setup/         # multi-tab data entry
  api/chat/          # POST streaming chat route
  components/
    ui/              # card, button, badge, input, stat-card, goal-card
    charts/          # Recharts wrappers
    layout/          # sidebar, page-header
  lib/supabase/
    client.ts        # browser Supabase client
    server.ts        # server Supabase client (createClient, createAdminClient)
    middleware.ts    # proxy helper (NOT a Next.js middleware)
  proxy.ts           # auth refresh proxy (replaces middleware.ts — Next.js 16 deprecation)
  types/index.ts     # all TypeScript interfaces
  supabase/
    schema.sql       # full DB schema (single source of truth)
    migrations/      # incremental SQL migration files
    seed.sql         # demo seed data
```

## Database Tables
| Table | Purpose |
|---|---|
| `household_members` | People in the household (self, partner, etc.) — each has a color |
| `financial_profiles` | Per-member profile (age, risk tolerance, etc.) |
| `assets` | Asset holdings — optionally tagged to a member |
| `liabilities` | Debts — optionally tagged to a member |
| `income_sources` | Income streams — optionally tagged to a member |
| `expenses` | Recurring expenses — optionally tagged to a member |
| `investment_holdings` | Portfolio holdings (stocks, ETFs, crypto, etc.) |
| `portfolio_snapshots` | Historical net-worth snapshots |
| `conversations` | AI chat conversations |
| `messages` | Messages within conversations |
| `goals` | Financial goals |

**All tables use RLS**: `auth.uid() = user_id`.

### Multi-member data model
- `household_members` owns a `user_id` (one Supabase user manages all data)
- `assets`, `liabilities`, `income_sources`, `expenses` each have an optional `member_id` FK
- `member_id = NULL` means **joint / household** (no specific owner)
- `financial_profiles` has an optional `member_id`; one profile per member
- Four preset member colors: `#3b82f6` blue, `#a855f7` purple, `#10b981` green, `#f59e0b` amber

## Key Conventions

### Supabase usage
- **Server components**: `createClient()` for user-scoped queries, `createAdminClient()` for bypass-RLS queries
- **Client components**: `createClient()` from `@/lib/supabase/client`
- All data mutations are done client-side via `useTransition` in setup-form tabs

### Auth
- Auth guard is in `app/(app)/layout.tsx` (server component)
- `proxy.ts` handles session refresh (not `middleware.ts`)

### Styling
- Dark theme: background `#0f172a` (card interior), `#111827` (card bg), `#1e2a3a` (borders)
- Text: `#e2e8f0` primary, `#94a3b8` secondary, `#64748b` muted
- Accent colors: `#3b82f6` blue, `#10b981` green, `#ef4444` red, `#f59e0b` amber

### Environment variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
GOOGLE_AI_API_KEY
```

## Pages & What They Do

### `/setup`
Multi-tab data entry. Tabs: **Members → Profile → Assets → Liabilities → Income → Expenses → Investments**.
- Members tab: add/remove household members (name, relationship, color). Must add "self" first.
- Profile tab: member-scoped financial profile (age, employment, risk tolerance, etc.)
- Other tabs: CRUD for financial data; each item has an "Assign to" member selector (NULL = Joint)

### `/advisor`
AI chat with full household financial context injected into the system prompt.
- Context includes per-member sections (if members exist) + joint section + combined metrics
- Supports switching between Claude and Gemini providers via UI toggle
- Conversations and messages are persisted to Supabase

### `/dashboard`
Summary stats (net worth, cash flow, savings rate), charts (net worth over time, allocation pie, cash flow bar), quick actions.

### `/balance-sheet`
Assets vs liabilities with type grouping, financial ratios. Shows member color badge on each line item.

### `/cash-flow`
Income vs expenses with pie charts. Shows member color badge on each line item.

### `/portfolio`
Investment holdings breakdown by account type and asset type.

### `/goals`
Goal tracker with income-doubling challenge hero card.

## AI Advisor Context Format
```
## Household Financial Situation   (or "## Financial Situation" if 1 member)

### Alice (self)
**Profile**: Age: 32, Employment: Employed, ...
**Assets** ($50K): ...
**Income** ($6K/mo): ...
...

### Bob (partner)
...

### Joint / Household
...

### Investment Holdings (Total: $X)
...

### Combined Household Key Metrics
- Net Worth: $X
- Monthly Cash Flow: $X
- Debt-to-Income Ratio: X%
- Emergency Fund: X months
- Savings Rate: X%
```

## Deployment
```bash
cd app
fly deploy          # builds Docker image and deploys to syd
fly secrets set ANTHROPIC_API_KEY=... GOOGLE_AI_API_KEY=...
```

## Common Gotchas
- `financial_profiles` no longer has a unique constraint on `user_id` — upsert by `member_id` when set
- `member_id = NULL` is valid and means "Joint" — always handle this in UI and AI context
- The setup form's `members` state is lifted to the root `SetupForm` component so all tabs can access the current member list without a page reload
- `proxy.ts` is the correct file for auth token refresh — not `middleware.ts`
