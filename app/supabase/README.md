# Supabase Setup — Capital Manager

This directory contains the database schema, seed data, and setup instructions for the Capital Manager Supabase backend.

---

## Prerequisites

- A [Supabase](https://supabase.com) account (free tier works for development)
- Node.js 18+ and the Capital Manager app running locally

---

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New project**.
3. Choose your organization, enter a project name (e.g. `capital-manager`), set a strong database password, and select a region closest to your users.
4. Wait for the project to finish provisioning (roughly 60 seconds).

---

## Step 2: Run the Schema

1. In the Supabase dashboard, open your project and navigate to **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Copy the entire contents of `schema.sql` and paste it into the editor.
4. Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`).
5. Verify in the **Table Editor** that all 10 tables have been created:
   - `financial_profiles`
   - `assets`
   - `liabilities`
   - `income_sources`
   - `expenses`
   - `investment_holdings`
   - `portfolio_snapshots`
   - `conversations`
   - `messages`
   - `goals`

---

## Step 3: Configure Environment Variables

1. In the Supabase dashboard, go to **Settings -> API**.
2. Copy the **Project URL** and the **anon public** key.
3. In the app root directory, copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

4. Open `.env.local` and fill in your values:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   ANTHROPIC_API_KEY=sk-ant-...
   GOOGLE_AI_API_KEY=AIza...

   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. Restart the development server if it is already running:

   ```bash
   npm run dev
   ```

---

## Step 4: (Optional) Load Sample Seed Data

The seed file inserts a realistic sample financial profile so you can explore the app without entering data manually.

1. Find your Supabase **User UID**:
   - Go to **Authentication -> Users** in the dashboard.
   - Sign up or sign in via the app first so your user row exists.
   - Copy the UUID shown in the **User UID** column.

2. Open `seed.sql` in a text editor and replace every occurrence of the placeholder:

   ```
   00000000-0000-0000-0000-000000000000
   ```

   with your actual User UID.

3. Open the **SQL Editor** in Supabase, paste the modified seed contents, and click **Run**.

The seed data includes:

| Category | Records |
|---|---|
| Financial profile | 1 |
| Assets | 5 (checking, savings, brokerage, home, 401k) |
| Liabilities | 3 (mortgage, car loan, credit card) |
| Income sources | 3 (salary, freelance, dividends) |
| Expenses | 8 (housing, transport, food, utilities, insurance, entertainment, education) |
| Investment holdings | 5 (VTI, VXUS, BND, FXAIX, BTC) |
| Portfolio snapshot | 1 (current date baseline) |
| Goals | 3 (emergency fund, double income, $500k portfolio) |
| Conversations + messages | 1 sample AI conversation |

---

## Security Notes

- Row Level Security (RLS) is enabled on every table. All queries are automatically scoped to the authenticated user via `auth.uid()`.
- The `anon` key is safe to expose in the browser because RLS prevents any cross-user data access.
- Never expose the `service_role` key to the client or commit it to version control. It bypasses RLS entirely.
- The `messages` table is secured indirectly: RLS checks that the parent `conversations` row belongs to the requesting user.

---

## Schema Overview

```
auth.users (Supabase managed)
  |
  +-- financial_profiles (1:1)
  +-- assets (1:many)
  +-- liabilities (1:many)
  +-- income_sources (1:many)
  +-- expenses (1:many)
  +-- investment_holdings (1:many)
  +-- portfolio_snapshots (1:many, unique per date)
  +-- goals (1:many)
  +-- conversations (1:many)
        |
        +-- messages (1:many, cascade delete)
```

All tables with an `updated_at` column have a database trigger that automatically sets the value to `now()` on every update, so your application code never needs to set this field manually.

---

## Resetting the Database

To tear down and re-run the schema during development, open the **SQL Editor** and run:

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

Then re-run `schema.sql` to recreate everything from scratch.
