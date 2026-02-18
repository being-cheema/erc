
# Fix: Leaderboard Monthly Distance Doubling — Root Cause & Complete Fix

## Root Cause (Confirmed)

The DB confirms:
- `activities` table: **1 run, 5,008.9m** (correct)
- `monthly_leaderboard` table: **2 runs, 10,017.8m** (exactly 2×)

The previous fix (querying the DB after upsert) is logically correct but **arrived too late** — the leaderboard row already held `10,017.8m` from a sync that ran using the old doubling code. The fix only corrects future syncs. No sync has run since the fix was deployed, so the stale doubled value is still sitting in the table.

There is also a deeper structural risk: the fix in the edge function does a raw TypeScript query, which is harder to verify and could be silently wrong in edge cases (e.g. server timezone, no-limit row truncation at 1000 rows for users with many runs). Moving the calculation into the database itself is the safest and most reliable approach.

---

## What Will Be Done

### Step 1 — SQL Migration: Fix Stale Data Immediately

A migration that recalculates `total_distance` and `total_runs` in `monthly_leaderboard` directly from the `activities` table for every user for the current month. This corrects the `10,017.8m` to `5,008.9m` right now without needing a sync.

```sql
UPDATE monthly_leaderboard ml
SET
  total_distance = (
    SELECT COALESCE(SUM(a.distance), 0)
    FROM activities a
    WHERE a.user_id = ml.user_id
      AND a.start_date >= date_trunc('month', NOW() AT TIME ZONE 'UTC')
      AND a.start_date <  date_trunc('month', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 month'
  ),
  total_runs = (
    SELECT COUNT(*)
    FROM activities a
    WHERE a.user_id = ml.user_id
      AND a.start_date >= date_trunc('month', NOW() AT TIME ZONE 'UTC')
      AND a.start_date <  date_trunc('month', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 month'
  ),
  updated_at = NOW()
WHERE year  = EXTRACT(YEAR  FROM NOW() AT TIME ZONE 'UTC')
  AND month = EXTRACT(MONTH FROM NOW() AT TIME ZONE 'UTC');
```

### Step 2 — SQL Migration: Create DB Function for Future Syncs

A `recalculate_monthly_leaderboard(target_user_id uuid)` database function (SECURITY DEFINER, called with the service role key from the edge function). It:

1. Calculates the true monthly distance and run count directly from `activities` with a single SQL aggregation — no possibility of double-counting
2. Upserts into `monthly_leaderboard` using the `(user_id, year, month)` unique key conflict — no separate select/insert/update flow needed

```sql
CREATE OR REPLACE FUNCTION public.recalculate_monthly_leaderboard(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year  int := EXTRACT(YEAR  FROM NOW() AT TIME ZONE 'UTC');
  v_month int := EXTRACT(MONTH FROM NOW() AT TIME ZONE 'UTC');
  v_dist  numeric;
  v_runs  int;
BEGIN
  SELECT
    COALESCE(SUM(distance), 0),
    COUNT(*)
  INTO v_dist, v_runs
  FROM activities
  WHERE user_id   = target_user_id
    AND start_date >= date_trunc('month', NOW() AT TIME ZONE 'UTC')
    AND start_date <  date_trunc('month', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 month';

  INSERT INTO monthly_leaderboard (user_id, year, month, total_distance, total_runs, updated_at)
  VALUES (target_user_id, v_year, v_month, v_dist, v_runs, NOW())
  ON CONFLICT (user_id, year, month)
  DO UPDATE SET
    total_distance = EXCLUDED.total_distance,
    total_runs     = EXCLUDED.total_runs,
    updated_at     = NOW();
END;
$$;
```

### Step 3 — Update Edge Function

Replace the TypeScript DB query + manual update logic (lines 730–818 in `sync-strava/index.ts`) with a single call to the new DB function:

```ts
// Replace the entire manual monthly calculation + leaderboard upsert block with:
await supabaseAdmin.rpc('recalculate_monthly_leaderboard', {
  target_user_id: profile.user_id
});
```

This removes ~90 lines of brittle TypeScript arithmetic and delegates it entirely to the database, which is the only reliable source of truth.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/...fix_leaderboard.sql` | New migration: fix stale data + create DB function |
| `supabase/functions/sync-strava/index.ts` | Replace ~90 lines of manual leaderboard calculation with `supabaseAdmin.rpc('recalculate_monthly_leaderboard', ...)` |

No frontend changes needed. The leaderboard will show correct data immediately after the migration runs and will remain correct on all future syncs.
