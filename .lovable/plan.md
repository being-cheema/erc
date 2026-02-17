

## Fix: Recreate `profiles_public` View Without `security_invoker`

### Problem

The `profiles_public` view currently has `security_invoker=on` set. This means it inherits the base `profiles` table's RLS policy (`auth.uid() = user_id`), so each user can only see their own row. Result:

- **Monthly tab**: User 1 shows as "ANONYMOUS" because User 2 can't read their profile
- **All Time tab**: Only the logged-in user appears

### What Will Change

A single database migration that:

1. Drops the existing `profiles_public` view
2. Recreates it **without** `security_invoker=on` (so it runs with owner permissions, bypassing the base table's RLS)
3. Re-grants `SELECT` to `authenticated` and `anon` roles
4. Notifies PostgREST to reload its schema cache so the API picks up the change immediately

The view only exposes safe, non-sensitive columns (display_name, avatar_url, city, distances, streaks). No tokens or private data.

### Technical Details

**SQL Migration:**
```sql
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
  SELECT id, user_id, display_name, avatar_url, city,
         total_distance, total_runs, current_streak,
         longest_streak, created_at, updated_at
  FROM profiles;

GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;

NOTIFY pgrst, 'reload schema';
```

### No Frontend Code Changes

The existing hooks (`useLeaderboard.ts`, `useProfile.ts`) already query `profiles_public` correctly. Once the view permissions are fixed, all users will appear with their real Strava names and avatars on both the Monthly and All Time leaderboards.
