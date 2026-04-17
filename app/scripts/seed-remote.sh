#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# seed-remote.sh
# Run seed.sql against your remote Supabase project.
#
# Usage:
#   ./scripts/seed-remote.sh <user-id>
#
# Where <user-id> is your Supabase auth user UUID.
# Find it at: Supabase Dashboard → Authentication → Users → your row → User UID
#
# Requires:
#   - psql installed (brew install postgresql)
#   - SUPABASE_DB_URL set in your environment or .env.local
#     Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
#     Find it at: Supabase Dashboard → Settings → Database → Connection string → URI
# -----------------------------------------------------------------------------

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEED_FILE="$SCRIPT_DIR/../supabase/seed.sql"
PLACEHOLDER="00000000-0000-0000-0000-000000000000"

# ── Validate arguments ────────────────────────────────────────────────────────

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <user-id>"
  echo ""
  echo "Example:"
  echo "  $0 a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  echo ""
  echo "Find your user ID at:"
  echo "  Supabase Dashboard → Authentication → Users → your row → User UID"
  exit 1
fi

USER_ID="$1"

# Basic UUID format check
if ! [[ "$USER_ID" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
  echo "Error: '$USER_ID' does not look like a valid UUID."
  echo "Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  exit 1
fi

# ── Resolve DB connection URL ─────────────────────────────────────────────────

# Load from .env.local if SUPABASE_DB_URL not already in environment
if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  ENV_FILE="$SCRIPT_DIR/../.env.local"
  if [[ -f "$ENV_FILE" ]]; then
    SUPABASE_DB_URL=$(grep '^SUPABASE_DB_URL=' "$ENV_FILE" | cut -d '=' -f2-)
  fi
fi

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "Error: SUPABASE_DB_URL is not set."
  echo ""
  echo "Add it to app/.env.local:"
  echo "  SUPABASE_DB_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
  echo ""
  echo "Find the connection string at:"
  echo "  Supabase Dashboard → Settings → Database → Connection string → URI"
  exit 1
fi

# ── Run the seed ──────────────────────────────────────────────────────────────

echo "Seeding remote database..."
echo "  User ID : $USER_ID"
echo "  Target  : $(echo "$SUPABASE_DB_URL" | sed 's/:\/\/[^@]*@/:\/\/***@/')"
echo ""

# Substitute the placeholder UUID and pipe to psql
sed "s/$PLACEHOLDER/$USER_ID/g" "$SEED_FILE" | psql "$SUPABASE_DB_URL" --single-transaction

echo ""
echo "Done. Open the app and check your dashboard."
