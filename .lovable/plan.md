

## Fix: Remove `security_invoker` from `profiles_public` View

### Problem Confirmed

The `profiles_public` view still has `security_invoker=on` in the database. This was confirmed by querying `pg_class.reloptions`. Despite previous approvals, the migration was never actually executed.

This causes:
- Monthly leaderboard shows other users as "ANONYMOUS"
- All-Time leaderboard only shows the logged-in user

### Solution

Run a single database migration to drop and recreate the view without `security_invoker=on`, then reload the API schema cache.

### Technical Details

**Database migration (SQL):**

```sql
-- Drop the existing view with security_invoker=on
DROP VIEW IF EXISTS public.profiles_public;

-- Recreate WITHOUT security_invoker (runs with owner permissions, bypassing base table RLS)
CREATE VIEW public.profiles_public AS
  SELECT id, user_id, display_name, avatar_url, city,
         total_distance, total_runs, current_streak,
         longest_streak, created_at, updated_at
  FROM profiles;

-- Grant read access
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;

-- Force API to pick up the change
NOTIFY pgrst, 'reload schema';
```

The view only exposes non-sensitive columns (names, avatars, distances, streaks). No tokens or private data.

### No Frontend Changes Needed

The existing `useLeaderboard.ts` and `useProfile.ts` hooks already query `profiles_public` correctly. Once the view is fixed, all users will appear with their real names on both leaderboard tabs.

