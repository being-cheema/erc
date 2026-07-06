# Erode Runners Club — Maintenance Solutions & Decisions

**Date:** July 6, 2026
**Companion to:** [MAINTENANCE_AUDIT.md](./MAINTENANCE_AUDIT.md)
**Role of this doc:** All product/architecture decisions are made HERE. The implementing agent should NOT make design choices — follow the specs below. If a spec conflicts with reality (e.g. a column name differs), verify against production DB first, then adapt minimally.

---

## Verified Production Facts (checked July 6, 2026)

These were confirmed by querying the live database (`strava-runners-connect-postgres-1`, db `erode_runners`):

1. **Prod DB is the source of truth, `init.sql` is stale.** Production `personal_records` has `category`, `distance`, `time_seconds`, `pace` (matching route code). `race_results` has `distance_category`, `pace`, `bib_number`, `is_verified`. `password_reset_tokens` exists. `group_runs.max_participants` exists. So audit items C1, C2, C3, H6 are **documentation/schema-file bugs, not runtime bugs** — fix by updating `init.sql`, do NOT touch prod tables.
2. **The achievement unit bug (C4) has already fired.** All 12 Strava-synced users have unlocked ALL 6 distance achievements including "Ultra Champion" (1000 km). Fix requires code change + data cleanup + re-evaluation.
3. **17 users total, 14 Strava-connected, 0 profiles missing `member_id`.** H5 hasn't bitten yet but must be fixed before the next Strava-only signup.
4. **`leaderboard_position` achievements (Top 10, Podium, Champion) have 0 unlocks** — dead seed data, confirmed.
5. **App runs via docker compose**: `strava-runners-connect-api-1` (tsx watch), `strava-runners-connect-postgres-1`, and a dev `web` container. Nginx on the host proxies to the API and serves the SPA from `/var/www/erode-runners/dist`.

---

## Guiding Principles for All Fixes

This is a **small club app (~17 users) on a single VPS, maintained by one person**. Every solution below is chosen for simplicity and low operational burden:

- No Redis, no queues, no microservices. Single API instance is a documented assumption.
- Prefer deleting dead features over building them out.
- Prod DB schema wins over `init.sql`; adopt lightweight migrations going forward.
- `app.eroderunnersclub.com` = user-facing frontend. `api.eroderunnersclub.com` = API only (plus Strava OAuth callbacks + APK downloads, since Strava allows one callback domain). Apex redirects to `app.*`.

---

# Part 1 — Decisions on All 46 Open Questions

## Schema & Data

**Q1. Is production DB already migrated beyond `init.sql`?**
**YES — verified.** Decision: prod is canonical. Regenerate the schema portion of `init.sql` from a prod dump (`pg_dump --schema-only`), keep the seed section, and adopt numbered migrations (see Q45) for all future changes. Never hand-edit prod again without a migration file.

**Q2. Achievement units — km or meters?**
**Kilometers in seeds; convert in code.** Seeds stay `5, 10, 50, 100, 500, 1000` (they read naturally as km). In `checkAndUnlockAchievements`, compare `stats.totalDistance / 1000 >= ach.requirement_value` for `total_distance`. Then run the cleanup in spec C4 below (delete wrong unlocks, re-scan all users).

**Q3. `max_participants` on group runs?**
**Keep the column (it exists in prod) and enforce it.** On RSVP "going": count current "going" RSVPs; if `max_participants` is not null and count >= max, return 409 `{ error: 'This run is full' }`. Frontend shows "Full" badge and disables the RSVP button. Do NOT enforce on check-in (walk-ins at a physical run are fine).

**Q4. `push_tokens` table?**
**Keep the table, defer push to a future release.** It costs nothing. Do not build FCM/APNs now (see Q38). Relabel notification toggles in Settings honestly (see Q20).

## Auth & Security

**Q5. Webhook trust model?**
**Secret-path mitigation + ownership validation.** Strava doesn't sign webhook POSTs, so:
1. Move the webhook to `POST /webhook/:secret` where `:secret` = `STRAVA_WEBHOOK_PATH_SECRET` env var (32+ random hex chars). Re-register the Strava subscription with the new URL. Keep the old `/webhook` returning 404 after migration.
2. For `activity.delete`: only delete if the `owner_id` maps to a known connected athlete AND the activity's `strava_id` belongs to that same user. (Already partially true — verify and tighten.)
3. For `athlete.update` with `authorized: false`: keep behavior, but log prominently.
No queue, no HMAC — the secret path is proportionate for this app's size.

**Q6. Native OAuth poll flow?**
**Server-issued state.** Change flow: client calls `GET /functions/v1/strava-auth?action=authorize&native=1` → server generates `state = crypto.randomBytes(32).toString('hex')`, stores it in `pendingTokens` map with `created_at`, returns it inside the authorize URL. `/poll?state=...` only matches server-issued states, is single-use (delete entry on successful poll), 5-minute TTL (already exists). Client no longer invents its own state. This kills guessability (256-bit entropy).

**Q7. Strava-only users get `member_id`?**
**Yes.** Extract the `generateMemberId()` logic from `auth.ts` into `server/src/utils/member-id.ts`, import it in both `auth.ts` and `strava-auth.ts` native callback. Also add a one-time backfill query in the same migration: `UPDATE profiles SET member_id = ... WHERE member_id IS NULL` (currently 0 rows, but belt-and-braces).

**Q8. Password policy?**
**Minimum 8 characters, no complexity rules.** Complexity rules hurt more than help at this scale. For Strava-only users (random UUID hash): remove the "skip verification if hash isn't bcrypt" bypass in `change-password`; instead, they must use "Forgot password" (email reset) to set a real password first. Add copy in Settings: "You signed up with Strava — use 'Forgot password' to set a password."

**Q9. `TOKEN_ENCRYPTION_KEY` required?**
**Yes — fail startup.** In `crypto.ts` (or `index.ts` boot): if `NODE_ENV === 'production'` and the key is missing/invalid, `throw` and exit. Also run a one-time re-encryption script for any plaintext tokens currently in the DB (check: encrypted tokens have the IV-prefix format; plaintext ones don't).

**Q10. JWT role vs DB role?**
**DB check for every admin-gated mutation.** Replace inline `req.user.role === 'admin'` checks in `group-runs.ts`, `races.ts`, `blog.ts`, `training.ts`, `sync-strava.ts` with the existing `requireAdmin` middleware (or a shared `isAdminInDb(userId)` helper for mixed routes). JWT `role` remains a UI hint only. Keep 7-day JWT expiry.

## Product / UX

**Q11. Strava optional or required?**
**Optional, permanently supported.** Some members will never connect. Keep the Home nudge but make it dismissible (store `strava_nudge_dismissed` in localStorage; re-show after 14 days). Everything that needs Strava data must show a graceful "Connect Strava to see this" state — never a blank.

**Q12. Native onboarding?**
**Native gets a slim welcome screen, not the full landing.** On native (`isNativePlatform()`), root redirect for unauthenticated users goes to a new lightweight `/welcome` route: logo, one-line tagline, "Sign up" (primary) and "Log in" (secondary) buttons. No marketing content, no download buttons (they already have the app). Web keeps `/landing`.

**Q13. Terminology?**
**Standardize on "Challenges" and "Profile".** Rename bottom-nav "Dares" → "Challenges". Keep nav label "Profile" for `/settings`, and retitle the Settings page header to "Profile" with a "Settings" section within it. One name per concept everywhere (page titles, tutorial copy, empty states).

**Q14. Bottom nav IA?**
**Keep 5 tabs: Home, Calendar, Challenges, Stats, Profile.** Leaderboard/Blog/Achievements/Group Runs/PRs stay as Home quick links. Rationale: 17 users don't need deeper nav; Home-as-hub is working. Fix D5 (duplicate Group Runs entry) by removing the quick link and keeping the "Next Group Run" tile.

**Q15. Public member profiles?**
**Keep public, limit fields.** `/m/:memberId` shows: display name, avatar, city, member since, member ID, total distance, total runs, current streak. Do NOT expose individual activities, PRs, or race results publicly. This is a membership-card verification page, not a full profile.

**Q16. Offline strategy?**
**Keep full-screen block, add a "Retry" button.** Persisting query cache to localStorage isn't worth the complexity now. Low priority.

**Q17. Post-Strava sync UX?**
**Yes.** In `StravaCallback.tsx`, after sync completes: `queryClient.invalidateQueries()` (all keys — simplest and correct after a full sync), then navigate to `/home`, then `toast.success("Strava connected — your runs are syncing!")`.

**Q18. Tutorial replay?**
**First visit + manual replay from Settings only.** No auto-replay after releases (annoying). Already implemented — no change.

**Q19. Avatar?**
**Keep URL field, add Strava avatar auto-import as default.** When a user connects Strava, if `avatar_url` is empty, copy the Strava profile photo URL. No file upload (needs object storage — out of scope).

**Q20. Notification toggles?**
**Relabel honestly.** Today only email works (SMTP for password reset; no other email sends exist). Change the Settings section to only show toggles for things that actually fire. If nothing fires, replace the section with "Notifications coming soon" and persist preferences silently for future use. Audit `notifications.ts` first: if preferences are stored but never read by any sender, keep storage + honest copy.

## Infrastructure

**Q21. Canonical public URL?**
**Split:** `app.eroderunnersclub.com` = SPA (already live). `api.eroderunnersclub.com` = API + Strava OAuth callbacks + `/downloads/`. Capacitor OTA stays on `api.*` for now (changing `server.url` requires shipping a new APK — do it at the next APK release, see Q35).

**Q22. Which `dist` path is live?**
`/var/www/erode-runners/dist` (verified: nginx on host serves from there). Update repo `nginx.conf` to match reality, and make the runbook's copy step the single documented deploy path.

**Q23. APK publish process?**
Document in runbook: build signed APK locally → `scp` to server → `sudo cp` to `/var/www/erode-runners/downloads/erc-latest.apk` → verify `curl -I` shows `application/vnd.android.package-archive`. Keep the `erc-latest.apk` stable-name convention (links never change). Also keep a versioned copy (`erc-v1.1.apk`) beside it for rollback.

**Q24. API runtime?**
Docker compose with `tsx watch` — confirmed. Fix per spec C10: multi-stage Dockerfile compiling TypeScript, `node dist/index.js`, remove the `src` volume mount, add `restart: unless-stopped` and a healthcheck.

**Q25. `APP_URL` for emails?**
`https://app.eroderunnersclub.com`. Set in `server/.env`, change the code default to the same, and verify the reset-password email link opens the SPA reset page.

**Q26. SMTP long-term?**
**Move to a transactional provider when volume grows; Gmail app password is acceptable now** at ~17 users. Add to the runbook as a known limitation (Gmail daily send caps, deliverability). Recommended future: Brevo or Resend free tier.

**Q27. Backup cron?**
Verify with `crontab -l` (root and aditya). If absent, install: `0 3 * * * /home/aditya/strava-runners-connect/scripts/backup-db.sh >> /var/log/erc-backup.log 2>&1`. Also add a monthly manual restore-test reminder to the runbook.

**Q28. Strava callback domain?**
`api.eroderunnersclub.com` only — already standardized in code. Remove the now-unreachable `app.*` entries from `ALLOWED_REDIRECT_URIS` to reduce confusion (they can't be registered with Strava anyway).

**Q29. CI minimum bar?**
**Yes.** One GitHub Actions workflow on PR + push to main: (1) frontend `npm ci && npm run lint && npx tsc --noEmit && npm run build`, (2) server `npm ci && npx tsc --noEmit`. No deploy automation (deploys stay manual per runbook). Keep Semgrep as-is but also trigger on all pushes to main.

**Q30. Multi-instance?**
**Single instance forever (documented).** Add a note in the runbook: "The API must run as exactly one instance — rate limiting, OAuth poll state, and webhook dedup are in-memory." Revisit only if the club grows 10x.

## Admin & Content

**Q31. Draft content by UUID?**
**Hide from non-admins.** In `challenges.ts`, `training.ts`, `group-runs.ts` detail endpoints: add `AND is_published = true` unless requester is admin (DB check). Return 404 (not 403 — don't reveal existence).

**Q32. Admin member lookup email?**
**Keep.** Admins managing check-ins legitimately need contact info. It's already behind `requireAdmin` (DB-checked).

**Q33. Disconnect Strava?**
**Call Strava deauthorize, best-effort.** `POST https://www.strava.com/oauth/deauthorize` with the access token before clearing local data. Wrap in try/catch — local disconnect must succeed even if the Strava call fails.

**Q34. Admin publish flow cache?**
**Yes.** Every admin mutation invalidates both the admin key AND the member-facing key (see spec F1 for the exact key table).

## Mobile

**Q35. Capacitor OTA vs bundled?**
**Keep OTA (remote URL).** It's the whole reason web deploys don't require APK updates. At the next APK release, change `server.url` to `https://app.eroderunnersclub.com/` so the app loads the canonical frontend. Until then, `api.*` keeps serving the SPA (don't remove SPA serving from `api.*` nginx until that APK ships).

**Q36. Password reset on mobile?**
**Email links open in the mobile browser at `app.*` — that's fine.** The reset page works in any browser; after resetting, the user logs in inside the app. No deep-linking work needed. Verify `APP_URL` change (Q25) makes the link correct.

**Q37. iOS distribution?**
**TestFlight indefinitely.** App Store review isn't worth it for a private club. Renew builds before TestFlight's 90-day expiry — add a recurring reminder to the runbook.

**Q38. Push notifications v1?**
**Out.** Real value would be group-run reminders and challenge nudges, but it needs FCM setup, `google-services.json`, APNs certs, backend send logic, and token lifecycle. Park it as the headline item for the next feature cycle, after this maintenance pass.

## Additional

**Q39. Secrets management?**
**Flat `.env` files with `chmod 600`, plus committed `.env.example` files.** A vault is overkill for one VPS. Rotate `JWT_SECRET` only if leaked (it invalidates all sessions).

**Q40. `leaderboard_position` achievements?**
**Implement, in the scheduler, monthly.** They're motivating for a running club and cheap to build: on the 1st of each month (add a check in the daily scheduler run: `if (now.getDate() === 1)`), compute last month's final leaderboard order and unlock Top 10 / Podium (top 3) / Champion (#1) for qualifying users. Idempotent via `ON CONFLICT DO NOTHING`.

**Q41. `phone` on signup?**
**Remove.** Delete from the signup request handling and any UI field. Nobody stores it, nobody needs it.

**Q42. Env var naming?**
**Rename with fallback.** Frontend: read `VITE_API_URL ?? VITE_SUPABASE_URL` in a single `src/config.ts` export; migrate all `import.meta.env.VITE_SUPABASE_URL` usages to import from config. Update `.env` + compose to set `VITE_API_URL`. Delete `VITE_SUPABASE_PUBLISHABLE_KEY`/`VITE_SUPABASE_PROJECT_ID`. Server: delete dead `FRONTEND_URL` references from docs.

**Q43. Apex domain?**
**301 redirect apex → `app.*`** via a tiny nginx server block (both HTTP and HTTPS; needs a cert for apex — certbot). Update `MembershipCard.tsx` QR/profile URLs from `eroderunnersclub.com/m/...` to `app.eroderunnersclub.com/m/...` (redirect covers old printed cards).

**Q44. Club Activity Feed?**
**Keep the API, add UI as a "Club" tab inside Stats.** The feature was annoying on Home, but a feed has real community value in a place users opt into. Add a third tab in `StatsTabs.tsx` ("Club") rendering the existing `ClubFeed` component. If it's still unloved in 2 months, delete API + component.

**Q45. DB migration strategy?**
**Numbered SQL migrations + tiny runner.** Create `server/db/migrations/NNN_description.sql`, a `schema_migrations(version)` table, and a ~30-line runner (`server/src/migrate.ts`) that applies pending files in order inside transactions, invoked manually via `npm run migrate` (documented in runbook). Migration 001 = everything needed to bring a fresh `init.sql` DB up to current prod (or regenerate init.sql from prod and make 001 a no-op baseline). Don't adopt a heavy framework.

**Q46. CI scope?**
Covered by Q29: build/lint/typecheck workflow on every PR and main push; Semgrep additionally on all main pushes + daily cron.

---

# Part 2 — Implementation Specs (Critical & High)

Each spec: what to change, where, and acceptance criteria (AC). The builder should complete specs in the batch order in Part 3.

## C1/C2/C3/H6 — Bring `init.sql` in line with production

**Change:** `pg_dump --schema-only` from prod; replace the DDL sections of `server/db/init.sql` with the real schema (keep seed data section, updating it where columns changed). Ensure it includes `password_reset_tokens`, prod-shaped `personal_records` and `race_results`, `group_runs.max_participants`, all views/triggers/functions.
**AC:** `docker run postgres:16-alpine` + apply `init.sql` from scratch succeeds; every table/column referenced by any route exists (grep route SQL against schema); no prod DB changes made.

## C4 — Achievement units + data cleanup

**Change (code):** `server/src/routes/sync-strava.ts` `checkAndUnlockAchievements`: for `total_distance`, compare `stats.totalDistance / 1000`.
**Change (data):** One-time script/SQL: delete rows from `user_achievements` where the achievement is `total_distance` type and the user's `profiles.total_distance / 1000 < requirement_value`. Then the next sync re-unlocks legitimately.
**AC:** A user with 87 km total has First 5K, 10K Warrior, Half Century only. No user retains Ultra Champion unless total ≥ 1000 km.

## C5/H7 — Webhook hardening

**Change:** Per Q5 — secret path `POST /webhook/:secret` (env `STRAVA_WEBHOOK_PATH_SECRET`, required in production like Q9), remove the hardcoded verify-token default (require `STRAVA_WEBHOOK_VERIFY_TOKEN` in prod), tighten delete-event ownership check. Update nginx `location /webhook` to pass the path through. Re-register the Strava webhook subscription (manual step — document the curl commands in the runbook).
**AC:** POST to old `/webhook` returns 404; POST to secret path with valid shape processes; server refuses to boot in production without both env vars.

## C6 — Enforce token encryption

**Change:** Startup guard per Q9. Plus a one-time script that finds Strava tokens not in encrypted format and re-encrypts them.
**AC:** API exits with clear error if key missing in prod; all `strava_access_token`/`strava_refresh_token` values in DB are encrypted format; sync still works after re-encryption.

## C7 — Auth guard coherence

**Change:** In `client.ts`, add `async ensureFreshToken(): Promise<boolean>` — returns true if current token valid; if expired but refresh token exists, awaits `tryRefresh()` and returns result. `AuthRouter` becomes a small component that: shows nothing (or a splash) while awaiting `ensureFreshToken()` once on mount, then either renders children or redirects to `/login`. Hooks keep `enabled: !!user` — they'll now only run when the token is genuinely valid.
**AC:** With an expired access token + valid refresh token, opening `/home` silently refreshes and loads data (no blank screen, no login redirect). With both expired, user lands on `/login`.

## C8 — MonthComparison rewrite

**Change:** Fix destructuring (`const { user } = useCurrentUser()`). Replace the `supabase.from()` calls with the existing API: fetch activities via `api.get('/api/activities?...')` filtered client-side by month, or (better) add `GET /api/stats/month-comparison` returning `{ current: {distance, runs, avgPace}, previous: {...} }` computed in SQL. Choose the endpoint approach — it's one query with `date_trunc('month', ...)` grouping.
**AC:** "vs Last Month" card renders on Stats for a user with activities in both months; hides gracefully with data in only one month.

## C9 — Leaderboard highlight

**Change:** `const { user: currentUser } = useCurrentUser();` in `Leaderboard.tsx`. Also fix the pull-to-refresh key `userRank` → `user-rank` in the same file (F1 overlap).
**AC:** Logged-in user's row shows the highlight style on the leaderboard.

## C10 — Production Dockerfile

**Change:** Multi-stage `server/Dockerfile`: stage 1 `npm ci && npm run build` (tsc → `dist/`), stage 2 copies `dist/` + production `node_modules`, `CMD ["node", "dist/index.js"]`. Remove `./server/src:/app/src` volume from `docker-compose.yml`. Add `restart: unless-stopped` and a healthcheck hitting `/health`.
**AC:** `docker compose up -d --build api` runs compiled JS; editing a source file does NOT hot-reload prod; `/health` returns 200.

## H1 — Unify post-sync pipeline

**Change:** Extract from `sync-strava.ts` a shared `runPostSyncPipeline(userId)` in `server/src/services/post-sync.ts`: recompute streaks, `checkAndUnlockAchievements`, challenge progress, `scanUserPRs`, and stats totals (using SQL `SUM/COUNT`, fixing M14 in passing). Call it from: manual sync, webhook activity create/update/delete handler, and the daily scheduler (per affected user).
**AC:** A run synced via webhook updates streak, achievements, challenge progress, and PRs without any manual sync.

## H2 — Webhook rate-limit resilience

**Change:** No queue. When budget is exhausted, insert `(owner_id, object_id, aspect_type)` into a new `webhook_backlog` table instead of dropping. The daily scheduler drains the backlog first (it already re-syncs, so mostly this is just not losing the signal + enabling a faster catch-up: process backlog rows before the general per-user page pull).
**AC:** Simulated budget exhaustion results in a backlog row, and the next scheduler run processes it and clears it.

## H3 — DB-backed admin checks

**Change:** Per Q10 — replace all inline `req.user.role === 'admin'` with `requireAdmin` middleware or shared DB helper.
**AC:** Demoting an admin in `user_roles` immediately blocks their next admin-gated request, without waiting for JWT expiry.

## H4 — Server-issued OAuth state

**Change:** Per Q6. `ConnectStrava.tsx` stops generating its own state; uses the state embedded in the authorize response for polling.
**AC:** Poll with a made-up state returns 404/410; the legit native flow completes end-to-end on Android.

## H5 — member_id for Strava-only signups

**Change:** Per Q7 — shared `generateMemberId()` util used in native callback; backfill statement in migration.
**AC:** New Strava-native signup has an `ERC...` member_id; `SELECT COUNT(*) FROM profiles WHERE member_id IS NULL` = 0.

## H8/H10/H11 — Published/ownership checks

**Change:** Detail endpoints (`challenges/:id`, `training/:id`, `group-runs/:id`) 404 unpublished content for non-admins (Q31). Race registration verifies race exists + `is_published`. Training complete verifies workout belongs to plan (`JOIN` in the UPDATE's WHERE).
**AC:** Non-admin GET of a draft challenge → 404; registering for a draft race → 404; completing a workout with mismatched plan id → 404.

## H9 — Leaderboard achievements

**Change:** Per Q40 — monthly evaluation in scheduler.
**AC:** After the monthly run, last month's #1 has Champion, top-3 have Podium Finish, top-10 have Top 10.

## H12 — Group run check-in rules

**Change:** Check-in only allowed on the run's date (server timezone / IST) or by an admin anytime. Skip capacity enforcement on check-in (Q3). RSVP not required to check in (walk-ins welcome).
**AC:** Self check-in the day before → 400 with friendly message; on the day → success; admin override works any day.

## F1 — Query key normalization

**Change:** Single source: create `src/lib/query-keys.ts` exporting constants (`QK.blogPosts = ['blog-posts']` etc.). Update `Admin.tsx` mutations to invalidate BOTH admin keys and member keys per this table:

| Mutation | Invalidate |
|---|---|
| blog CRUD | `['admin','blog_posts']` + `['blog-posts']` |
| training CRUD | `['admin','training_plans']` + `['training-plans']` |
| group run CRUD | `['admin','group-runs']` + `['group-runs']` (member hook key) |
| challenge CRUD | `['admin','challenges']` + `['challenges']` |
| Leaderboard PTR | `['user-rank']` (not `['userRank']`) |

**AC:** Admin publishes a group run; member's Group Runs page shows it after next focus/refetch without app restart.

## F2/F3/F4 — Strava connect flow parity

**Change:** Extract the native `Browser.open` + poll logic from `ConnectStrava.tsx` into `src/hooks/useStravaConnect.ts`; use it in both `ConnectStrava.tsx` and `Settings.tsx`. `ConnectStrava` logout uses `api.clearToken()`. `StravaCallback` invalidates all queries post-sync (Q17).
**AC:** Reconnect from Settings works on Android APK; after web connect, Home shows synced data without manual refresh.

## F5/F6/F7 — Small flow fixes

**Change:** Login gets "New here? Create account" link → `/signup`. `Admin.tsx` renders a loader until the admin check resolves, redirecting non-admins before any admin UI mounts. `useAppLifecycle` session-expiry path calls `queryClient.clear()` before `window.location.assign('/login')` (export the query client or use an event).
**AC:** Login page links to signup; non-admin visiting `/admin` never sees admin chrome; post-expiry login shows no stale data from the previous user.

## I1–I9 — Ops batch

**Change:**
- `.env.example` at root (`VITE_API_URL=`) and `server/.env.example` (all vars incl. `TOKEN_ENCRYPTION_KEY`, `STRAVA_WEBHOOK_VERIFY_TOKEN`, `STRAVA_WEBHOOK_PATH_SECRET`, `APP_URL`, SMTP) with placeholder values and one-line comments.
- Update `nginx.conf` in repo to mirror the live config (root `/var/www/erode-runners/dist`, `/downloads/` block, `app.*` vhost, apex redirect per Q43). Treat repo copy as documentation of truth.
- Runbook additions: build-time `VITE_API_URL` export before `npm run build`; APK publish steps (Q23); webhook re-registration curls (C5); backup cron verification (Q27); TestFlight renewal reminder (Q37); single-instance assumption (Q30).
- CI workflow per Q29. Fix scheduler comment ("every 24h"). Remove `@supabase/supabase-js` from package.json. Write a README: what the app is, stack, how to develop, how to deploy (link runbook).
**AC:** Fresh clone + `.env.example` copies + docs alone is enough to stand up dev; CI green on a no-op PR.

---

# Part 3 — Build Order for the Implementing Agent

Work top to bottom. Each batch should end with: server `tsc` clean, frontend build clean, and the batch's ACs verified (use the prod DB read-only for verification; make data changes only where a spec explicitly says so).

**Batch 1 — Silently broken (do first):** C8, C9, F1, C4 (code + cleanup), C7, F5.
**Batch 2 — Data correctness:** H1, H2, H5, H8/H10/H11, H12, Q3 (RSVP capacity), Q41 (remove phone).
**Batch 3 — Security:** C5/H7, C6, H3, H4, Q8 (min 8 + remove bypass), Q33 (deauthorize).
**Batch 4 — Ops:** C10, C1/C2/C3/H6 (init.sql regen), Q45 (migrations runner), I1–I9, Q25 (`APP_URL`), Q42 (env rename).
**Batch 5 — UX & polish:** Q12 (native welcome), Q13/D1 (naming), D2, D3, D5, D6, D10, D11, error states on list pages, Q44 (Club tab in Stats), Q43 (QR URL + apex redirect), H9/Q40, accessibility pass (aria-labels, role="alert", keyboard handlers).

**Deferred (explicitly not now):** push notifications (Q38), avatar upload (Q19), offline cache (Q16), SMTP provider migration (Q26), Redis/multi-instance (Q30).

**Deploy notes for every batch:** backend changes need `docker compose up -d --build api`; frontend changes need `npm run build` + copy to `/var/www/erode-runners/dist` + nginx reload; DB changes go through a migration file (Q45) — never psql-by-hand after the migration runner lands.
