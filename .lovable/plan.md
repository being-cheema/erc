

## Fix: Leaderboard Shows "Anonymous" and Missing Users

### Root Cause

The `profiles_public` view was created with `security_invoker=on`. This means it inherits the base `profiles` table's row-level security, which only allows each user to see **their own row** (`auth.uid() = user_id`).

So when User 2 queries the leaderboard:
- **Monthly leaderboard**: fetches entries from `monthly_leaderboard` (public read), then tries to look up names from `profiles_public` -- but can only see their own name. Everyone else shows as "Anonymous".
- **All-time leaderboard**: queries `profiles_public` directly -- only returns 1 row (their own profile). Other users are completely missing.

### Fix

Recreate the `profiles_public` view **without** `security_invoker=on`. This makes the view run with the view owner's (superadmin) permissions, bypassing the restrictive RLS on the base `profiles` table. Since the view already excludes all sensitive columns (tokens, weight, sex, etc.), this is safe.

### Database Migration

```sql
-- Drop and recreate without security_invoker
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
  SELECT id, user_id, display_name, avatar_url, city,
         total_distance, total_runs, current_streak,
         longest_streak, created_at, updated_at
  FROM profiles;

-- Grant access to both roles
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;
```

### No Code Changes Needed

The frontend hooks (`useLeaderboard.ts`, `useProfile.ts`) and the Leaderboard page already query `profiles_public` correctly. Once the view permissions are fixed, all users will be visible with their real names.

### What Users Will See After the Fix

- **Monthly leaderboard**: All participants shown with their actual Strava display names and avatars
- **All-time leaderboard**: All users listed and ranked by total distance, not just the logged-in user
