
# Complete Logical Bug Fix Plan — Final

This fixes all 9 confirmed bugs found across the codebase, plus the newly confirmed leaderboard distance doubling bug. Here is every bug, its root cause confirmed by exact line numbers, and the precise fix.

---

## BUG 0 — Leaderboard Monthly Distance is Doubled (Critical — newly added)

**Root cause:** `sync-strava/index.ts` lines 616-631 (incremental sync path):

```ts
// monthlyRuns = new Strava runs THIS month
monthlyRuns = newRuns.filter(a => new Date(a.start_date) >= startOfMonth);

// Then ADDS all stored monthly runs from DB
const storedMonthlyRuns = storedRunData.filter(a => ...startOfMonth);
monthlyRuns = [...monthlyRuns, ...storedMonthlyRuns...];
```

Then line 649:
```ts
const monthlyDistance = monthlyRuns.reduce((sum, a) => sum + a.distance, 0);
```

The problem: `newRuns` are immediately upserted into the DB (line 705-713), so the very next sync will have those same runs in `storedRunData`. But even within a SINGLE sync, if `newRuns` contains runs that were already stored (e.g., yesterday's run from the -1 day lookback window on line 556), they exist in BOTH `newRuns` AND `storedMonthlyRuns`. Result: distance counted twice.

**Fix:** After upserting activities, calculate `monthlyDistance` directly from a fresh DB query instead of from the in-memory `monthlyRuns` array. This is the only guaranteed-accurate source:

```ts
// After upsert, query the DB for the real monthly total
const { data: monthlyActivities } = await supabaseAdmin
  .from("activities")
  .select("distance")
  .eq("user_id", profile.user_id)
  .gte("start_date", startOfMonth.toISOString());

const monthlyDistance = (monthlyActivities || [])
  .reduce((sum, a) => sum + Number(a.distance), 0);
const monthlyRunsCount = monthlyActivities?.length || 0;
```

This applies to BOTH the full sync and incremental sync paths, replacing the in-memory calculation entirely.

---

## BUG 1 — Pull-to-Refresh Never Refetches Leaderboard or Rank (Critical)

**Root cause:**

`Home.tsx` lines 37-38 invalidates:
- `["monthlyLeaderboard"]` — does NOT match stored key `["leaderboard", "monthly", year, month]`
- `["allTimeLeaderboard"]` — does NOT match stored key `["leaderboard", "alltime"]`
- `["userRank"]` — NOT invalidated at all on Home

`Leaderboard.tsx` lines 28-29 has the same wrong keys.

**Fix:** In both `Home.tsx` and `Leaderboard.tsx`, update all `invalidateQueries` calls to match the actual keys used in `useLeaderboard.ts` and `useUserRank.ts`:
- `["leaderboard", "monthly"]` (TanStack Query prefix-matches year/month)
- `["leaderboard", "alltime"]`
- `["userRank"]` (add this to `Home.tsx`)
- `["monthlyDistance"]` (add this to `Home.tsx` for goal progress)

---

## BUG 2 — Strava Sync Always Overwrites User-Set Display Name & Avatar (Critical)

**Root cause:** `sync-strava/index.ts` lines 727-739:

```ts
const profileUpdate: any = {
  total_distance: ...,
  // profileUpdate is a FRESH empty object
};
// ...
profileUpdate.display_name = profileUpdate.display_name || `${athlete.firstname}...`
// profileUpdate.display_name is always undefined → always overwrites with Strava name
```

Every sync overwrites whatever the user set in Settings.

**Fix:** Before building `profileUpdate`, fetch the current profile's `display_name` and `avatar_url` from DB. Only fallback to Strava values if DB values are `null` or empty:

```ts
const { data: currentProfile } = await supabaseAdmin
  .from("profiles")
  .select("display_name, avatar_url")
  .eq("user_id", profile.user_id)
  .single();

profileUpdate.display_name = currentProfile?.display_name || `${athlete.firstname} ${athlete.lastname}`.trim();
profileUpdate.avatar_url = currentProfile?.avatar_url || athlete.profile;
```

---

## BUG 3 — Race Date Timezone Bug (Medium)

**Root cause:** `Races.tsx` lines 39 and 48:
```ts
const raceDate = new Date(dateStr); // "2025-03-15" parsed as midnight UTC
if (isPast(raceDate)) return null;  // true at 5:30 AM in IST
```
Race appears as "past" before it starts for IST users.

**Fix:** Parse as local midnight in both `formatDate` and `getCountdown`:
```ts
const date = new Date(dateStr + "T00:00:00"); // local timezone
```

---

## BUG 4 — GoalProgress Card Navigates to Settings Instead of Stats (UX)

**Root cause:** `GoalProgress.tsx` line 47:
```ts
onClick={() => navigate("/settings")}
```

**Fix:** Change to `navigate("/stats")`.

---

## BUG 5 — Race Sheet Shows Stale Registration State (UX)

**Root cause:** `Races.tsx` line 22: `selectedRace` is a copied JS object, not a live reference. After registering and query refetching, the `is_registered` field in the sheet is stale until component re-renders propagate.

**Fix:** Store only `selectedRaceId: string | null` in state, derive the live race object from the `races` array:
```ts
const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
const selectedRace = races?.find(r => r.id === selectedRaceId) ?? null;
```
Update `setSelectedRace` calls to `setSelectedRaceId`.

---

## BUG 6 — Admin Creating/Editing Can Show Both Forms Simultaneously (Medium)

**Root cause:** `Admin.tsx` — clicking "Add" while editing sets `creating = true` without clearing `editing`. The form condition `(creating || editing)` means both forms are truthy simultaneously.

**Fix:** In each admin sub-component (RacesAdmin, BlogAdmin, TrainingAdmin):
- "Add" button: `setCreating(true); setEditing(null); setForm({...defaults})`
- "Edit" button: `setEditing(item.id); setCreating(false); setForm(item)`

---

## BUG 7 — AuthRouter: Logged-In Users Forced Through Onboarding on New Devices (Medium)

**Root cause:** `AuthRouter.tsx` lines 63-68: The `!onboardingComplete` check happens BEFORE the session check. A logged-in user on a new device (no localStorage) is sent to `/onboarding`.

**Fix:** Reorder logic — session existence always takes priority:
```ts
if (session) {
  // Authenticated users never see onboarding or login
  if (["/onboarding", "/login", "/"].includes(currentPath)) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
}
// No session below this point
if (!onboardingComplete) { ... }
```

---

## BUG 8 — Monthly Goal Rounds Decimal Precision Away (Low)

**Root cause:** `Settings.tsx` line 69:
```ts
setMonthlyGoal(Math.round((profile.monthly_distance_goal || 100000) / 1000));
```
A goal of 42.2 km rounds to 42.

**Fix:** Remove `Math.round`, use `parseFloat`:
```ts
setMonthlyGoal(parseFloat(((profile.monthly_distance_goal as number || 100000) / 1000).toFixed(1)));
```

---

## BUG 9 — Blog Post `author_id` Never Set When Creating (Missing Data)

**Root cause:** `Admin.tsx` `BlogAdmin` lines 388-398: The insert payload never includes `author_id`. The column exists in `blog_posts` but is always `null`.

**Fix:** In `BlogAdmin`, fetch the current user via `useCurrentUser()` hook, then include `author_id: user?.id` in the insert payload.

---

## Summary of All Files Changed

| File | Bugs Fixed |
|------|-----------|
| `supabase/functions/sync-strava/index.ts` | Bug #0 (distance doubling), Bug #2 (display_name overwrite) |
| `src/pages/Home.tsx` | Bug #1 (pull-to-refresh query keys) |
| `src/pages/Leaderboard.tsx` | Bug #1 (pull-to-refresh query keys) |
| `src/components/home/GoalProgress.tsx` | Bug #4 (navigate to /stats) |
| `src/pages/Races.tsx` | Bug #3 (timezone), Bug #5 (stale sheet state), Bug #6 (form collision) |
| `src/pages/Admin.tsx` | Bug #6 (form collision all tabs), Bug #9 (author_id) |
| `src/pages/Settings.tsx` | Bug #8 (decimal goal precision) |
| `src/components/AuthRouter.tsx` | Bug #7 (session-first auth routing) |

No database schema changes required. All fixes are code-only. The edge function (`sync-strava`) will be redeployed automatically.
