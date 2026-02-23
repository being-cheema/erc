# Erode Runners Club - Complete Backend & Self-Hosting Reference

This document is the **single source of truth** for the entire backend architecture. Any AI building or modifying the backend should read this first.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [RLS Policies](#3-rls-policies)
4. [Database Functions & Triggers](#4-database-functions--triggers)
5. [Edge Functions (Backend API)](#5-edge-functions-backend-api)
6. [Authentication Flow](#6-authentication-flow)
7. [Strava Integration](#7-strava-integration)
8. [Environment Variables & Secrets](#8-environment-variables--secrets)
9. [Frontend Data Hooks](#9-frontend-data-hooks)
10. [Self-Hosting Migration](#10-self-hosting-migration)
11. [Mobile App (Capacitor)](#11-mobile-app-capacitor)

---

## 1. Architecture Overview

```
┌────────────────────────────────────────────────┐
│  React Frontend (Vite + Tailwind + shadcn/ui)  │
│  - TanStack Query for data fetching            │
│  - Supabase JS client for auth + DB            │
│  - Capacitor for native mobile shell           │
└──────────────────┬─────────────────────────────┘
                   │
         ┌─────────▼──────────┐
         │  Supabase Backend  │
         │  (Lovable Cloud)   │
         ├────────────────────┤
         │  Auth (magic link) │
         │  PostgreSQL DB     │
         │  Edge Functions    │
         │  RLS Policies      │
         └────────────────────┘
                   │
         ┌─────────▼──────────┐
         │  Strava API        │
         │  OAuth 2.0         │
         │  Activities sync   │
         └────────────────────┘
```

### Key Design Decisions
- **No email/password auth** — users authenticate exclusively via Strava OAuth
- Auth creates a synthetic email `strava_{athlete_id}@eroderunners.local` with a random password
- A magic link token is generated server-side and verified client-side to establish a Supabase session
- All activity data comes from Strava API; there's no manual activity entry
- `profiles` table stores Strava tokens (access, refresh, expiry) for background sync
- `profiles_public` is a **VIEW** (not a table) that exposes non-sensitive profile fields for leaderboard display

---

## 2. Database Schema

### Enum Types

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'member');
```

### Tables

#### `profiles`
Primary user data table. One row per user. Stores Strava credentials.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | References auth.users (no FK constraint) |
| strava_id | text | YES | — | Strava athlete ID |
| strava_access_token | text | YES | — | Current OAuth access token |
| strava_refresh_token | text | YES | — | OAuth refresh token |
| strava_token_expires_at | timestamptz | YES | — | Token expiry |
| display_name | text | YES | — | User display name |
| avatar_url | text | YES | — | Profile picture URL |
| city | text | YES | — | From Strava |
| country | text | YES | — | From Strava |
| sex | text | YES | — | From Strava |
| weight | numeric | YES | — | From Strava (kg) |
| measurement_preference | text | YES | 'meters' | From Strava |
| monthly_distance_goal | numeric | YES | 100000 | In meters |
| total_distance | numeric | YES | 0 | Cumulative meters |
| total_runs | integer | YES | 0 | Cumulative count |
| current_streak | integer | YES | 0 | Consecutive run days |
| longest_streak | integer | YES | 0 | Best streak ever |
| follower_count | integer | YES | 0 | From Strava |
| friend_count | integer | YES | 0 | From Strava |
| premium | boolean | YES | false | Strava premium status |
| last_synced_at | timestamptz | YES | — | Last Strava sync |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**Unique constraint**: `user_id`

#### `profiles_public` (VIEW)
A read-only view exposing non-sensitive profile fields. Used for leaderboards.

```sql
-- Exposes: id, user_id, display_name, avatar_url, city,
--          total_distance, total_runs, current_streak, longest_streak,
--          created_at, updated_at
-- Excludes: strava tokens, weight, sex, measurement_preference, etc.
```

#### `activities`
Running activities synced from Strava.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | Owner |
| strava_id | bigint | YES | — | Strava activity ID |
| name | text | YES | — | Activity title |
| activity_type | text | YES | 'Run' | Always 'Run' (filtered during sync) |
| distance | numeric | YES | 0 | In meters |
| moving_time | integer | YES | 0 | In seconds |
| elapsed_time | integer | YES | — | In seconds |
| start_date | timestamptz | YES | — | When the activity started |
| average_pace | numeric | YES | — | Seconds per km |
| average_speed | numeric | YES | — | m/s |
| max_speed | numeric | YES | — | m/s |
| elevation_gain | numeric | YES | 0 | In meters |
| calories | integer | YES | 0 | Estimated or from Strava |
| average_heartrate | integer | YES | — | BPM |
| max_heartrate | integer | YES | — | BPM |
| suffer_score | integer | YES | — | Strava suffer score |
| kudos_count | integer | YES | 0 | |
| achievement_count | integer | YES | 0 | |
| description | text | YES | — | |
| workout_type | integer | YES | — | Strava workout type enum |
| gear_id | text | YES | — | Strava gear ID |
| created_at | timestamptz | YES | now() | |

**Unique constraint**: `strava_id` (used for upsert on sync)

#### `monthly_leaderboard`
Monthly distance rankings. Recalculated via DB function after each sync.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | — |
| year | integer | NO | — |
| month | integer | NO | — |
| total_distance | numeric | YES | 0 |
| total_runs | integer | YES | 0 |
| rank | integer | YES | — |
| rank_change | integer | YES | 0 |
| updated_at | timestamptz | NO | now() |

**Unique constraint**: `(user_id, year, month)`

#### `achievements`
Badge/achievement definitions. Admin-managed.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| name | text | NO | — |
| description | text | NO | — |
| icon | text | NO | — |
| category | text | NO | — |
| requirement_type | text | NO | — |
| requirement_value | integer | NO | — |
| created_at | timestamptz | NO | now() |

**requirement_type values**: `total_distance`, `total_runs`, `current_streak`, `longest_streak`

#### `user_achievements`
Tracks which achievements each user has unlocked.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | — |
| achievement_id | uuid | NO | — |
| unlocked_at | timestamptz | NO | now() |

**FK**: `achievement_id → achievements.id`

#### `races`
Upcoming race events. Admin-managed.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| name | text | NO | — |
| description | text | YES | — |
| location | text | YES | — |
| race_date | date | NO | — |
| distance_type | text | NO | — |
| registration_url | text | YES | — |
| image_url | text | YES | — |
| is_published | boolean | YES | false |
| created_by | uuid | YES | — |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

#### `race_participants`
Users registered for races.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| race_id | uuid | NO | — |
| user_id | uuid | NO | — |
| registered_at | timestamptz | NO | now() |

**FK**: `race_id → races.id`

#### `training_plans`
Training program definitions. Admin-managed.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| name | text | NO | — |
| description | text | YES | — |
| level | text | NO | — |
| goal_distance | text | NO | — |
| duration_weeks | integer | NO | — |
| is_published | boolean | YES | false |
| created_by | uuid | YES | — |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

#### `training_weeks`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| plan_id | uuid | NO | — |
| week_number | integer | NO | — |
| focus | text | YES | — |

**FK**: `plan_id → training_plans.id`

#### `training_workouts`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| week_id | uuid | NO | — |
| day_of_week | integer | NO | — |
| workout_type | text | NO | — |
| distance_km | numeric | YES | — |
| duration_minutes | integer | YES | — |
| notes | text | YES | — |

**FK**: `week_id → training_weeks.id`

#### `user_training_progress`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | — |
| plan_id | uuid | NO | — |
| workout_id | uuid | NO | — |
| completed_at | timestamptz | NO | now() |

**FK**: `plan_id → training_plans.id`, `workout_id → training_workouts.id`

#### `blog_posts`
Admin-managed blog content.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| title | text | NO | — |
| slug | text | NO | — |
| content | text | NO | — |
| excerpt | text | YES | — |
| category | text | NO | — |
| image_url | text | YES | — |
| is_published | boolean | YES | false |
| author_id | uuid | YES | — |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

#### `user_roles`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | — |
| role | app_role | NO | 'member' |
| created_at | timestamptz | NO | now() |

#### `notification_preferences`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | — |
| new_races | boolean | YES | true |
| leaderboard_changes | boolean | YES | true |
| new_blog_posts | boolean | YES | true |
| achievements | boolean | YES | true |
| training_reminders | boolean | YES | true |
| updated_at | timestamptz | NO | now() |

#### `push_tokens`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | — |
| token | text | NO | — |
| platform | text | NO | — |
| created_at | timestamptz | NO | now() |

---

## 3. RLS Policies

All tables have RLS **enabled**. Policies use `RESTRICTIVE` mode (all listed as `Permissive: No`).

### User-owned data (profiles, activities, notification_preferences, push_tokens)
- **SELECT**: `auth.uid() = user_id`
- **INSERT**: `auth.uid() = user_id`
- **UPDATE**: `auth.uid() = user_id`
- **DELETE**: Not allowed (except push_tokens)

### Leaderboard (`monthly_leaderboard`)
- **SELECT**: `true` (public)
- **INSERT**: `auth.uid() = user_id`
- **UPDATE**: `auth.uid() = user_id`
- **DELETE**: Not allowed

### Public content (achievements, training_weeks, training_workouts)
- **SELECT**: `true` (public read)
- **ALL** (admin): `has_role(auth.uid(), 'admin')`

### Published content (blog_posts, races, training_plans)
- **SELECT**: `is_published = true OR has_role(auth.uid(), 'admin')`
- **INSERT/UPDATE/DELETE**: `has_role(auth.uid(), 'admin')`

### User achievements
- **SELECT**: `true` (public)
- **INSERT**: `auth.uid() = user_id`
- **UPDATE/DELETE**: Not allowed

### Race participants
- **SELECT**: `true` (public)
- **INSERT**: `auth.uid() = user_id`
- **DELETE**: `auth.uid() = user_id`
- **UPDATE**: Not allowed

### User roles
- **SELECT**: `auth.uid() = user_id`
- **ALL** (admin): `has_role(auth.uid(), 'admin')`

### User training progress
- **SELECT**: `auth.uid() = user_id`
- **INSERT**: `auth.uid() = user_id`
- **DELETE**: `auth.uid() = user_id`
- **UPDATE**: Not allowed

---

## 4. Database Functions & Triggers

### `has_role(_user_id uuid, _role app_role) → boolean`
Checks if a user has a specific role. Used in RLS policies.

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### `recalculate_monthly_leaderboard(target_user_id uuid) → void`
Recalculates a user's monthly leaderboard entry from the `activities` table. Called after every sync.

```sql
CREATE OR REPLACE FUNCTION public.recalculate_monthly_leaderboard(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_year  int := EXTRACT(YEAR FROM NOW() AT TIME ZONE 'UTC');
  v_month int := EXTRACT(MONTH FROM NOW() AT TIME ZONE 'UTC');
  v_dist  numeric;
  v_runs  int;
BEGIN
  SELECT COALESCE(SUM(distance), 0), COUNT(*)::int
  INTO v_dist, v_runs
  FROM activities
  WHERE user_id = target_user_id
    AND start_date >= date_trunc('month', NOW() AT TIME ZONE 'UTC')
    AND start_date < date_trunc('month', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 month';

  INSERT INTO monthly_leaderboard (user_id, year, month, total_distance, total_runs, updated_at)
  VALUES (target_user_id, v_year, v_month, v_dist, v_runs, NOW())
  ON CONFLICT (user_id, year, month)
  DO UPDATE SET
    total_distance = EXCLUDED.total_distance,
    total_runs = EXCLUDED.total_runs,
    updated_at = NOW();
END;
$$;
```

### `update_updated_at_column() → trigger`
Generic trigger function. Currently no triggers are attached.

---

## 5. Edge Functions (Backend API)

Three edge functions deployed as Deno serverless functions:

### `strava-auth`
**Path**: `supabase/functions/strava-auth/index.ts`

Handles Strava OAuth flow via query param `?action=`:

| Action | Method | Description |
|--------|--------|-------------|
| `authorize` | GET | Returns Strava OAuth URL. Requires `redirect_uri` param. Validates against allowlist. |
| `callback` | GET | Exchanges auth code for tokens. Creates/updates user account. Returns magic link token. |
| `refresh` | GET | Refreshes expired Strava access token. Requires Authorization header. |

**Key behavior**:
- Creates synthetic auth user with email `strava_{athlete_id}@eroderunners.local`
- Handles reconnection (user disconnected then reconnects) by checking existing auth users
- Preserves user-set `display_name` and `avatar_url` on re-auth
- Creates `profiles`, `user_roles` (member), and `notification_preferences` for new users
- Generates a magic link token for client-side session establishment

**CORS**: Explicit origin allowlist (preview + production domains)

**Redirect URI allowlist**: Both `/strava-callback` and `/auth/callback` paths for all domains

### `sync-strava`
**Path**: `supabase/functions/sync-strava/index.ts`

Syncs running activities from Strava API.

| Feature | Details |
|---------|---------|
| **Auth** | Requires Bearer token. Validates via `supabase.auth.getUser()` |
| **Full sync** | Fetches ALL historical activities (paginated, up to 50 pages × 200/page) |
| **Incremental sync** | Fetches only activities since last stored activity date |
| **Auto-detection** | Full sync if `total_runs = 0` or `total_distance = 0` |
| **Force full sync** | POST body: `{ "force_full_sync": true }` |
| **Cross-user sync** | Admins can sync other users: `{ "user_id": "..." }` |
| **Bulk sync** | If no user specified and no auth, syncs ALL connected users |

**Sync pipeline**:
1. Check/refresh Strava token if expired
2. Fetch activities from Strava (full or incremental)
3. Filter for `type === "Run"` only
4. Fetch detailed data for up to 50 most recent activities (heart rate, suffer score, etc.)
5. Batch upsert activities (100 per batch, on conflict `strava_id`)
6. Calculate average pace: `moving_time / (distance / 1000)` → seconds per km
7. Estimate calories if not provided: `(distance_km) * weight_kg * 0.9`
8. Fetch Strava athlete profile (name, city, weight, premium status, etc.)
9. Calculate running streaks (current + longest)
10. Call `recalculate_monthly_leaderboard` RPC
11. Update `profiles` with totals, streaks, athlete data
12. Update leaderboard ranks (sort by `total_distance` desc)
13. Check and unlock achievements

**Achievement types checked**: `total_distance`, `total_runs`, `current_streak`, `longest_streak`

### `disconnect-strava`
**Path**: `supabase/functions/disconnect-strava/index.ts`

Disconnects a user from Strava by deleting their data.

| Step | Details |
|------|---------|
| Auth | Validates JWT via `supabase.auth.getClaims()` |
| Deletes | `activities`, `monthly_leaderboard`, `user_achievements` for the user |
| Uses | Service role key to bypass RLS (tables lack DELETE policies) |

**Note**: Does NOT delete the auth user or profile — just clears Strava-related data.

---

## 6. Authentication Flow

```
User clicks "Connect with Strava"
  → Frontend calls strava-auth?action=authorize&redirect_uri=...
  → Gets Strava OAuth URL, redirects user
  → User authorizes on Strava
  → Strava redirects to /strava-callback?code=...
  → Frontend calls strava-auth?action=callback&code=...
  → Edge function:
      1. Exchanges code for Strava tokens
      2. Creates/finds auth user (strava_{id}@eroderunners.local)
      3. Creates profile, user_roles, notification_preferences
      4. Generates magic link token
      5. Returns token + user_id + is_new_user
  → Frontend calls supabase.auth.verifyOtp({ token, type: 'magiclink' })
  → Supabase session established
  → Frontend redirects to /home (or /onboarding for new users)
```

---

## 7. Strava Integration

### Credentials
- **Client ID**: `168531`
- **Client Secret**: Stored as `STRAVA_CLIENT_SECRET` secret

### Domains
- Production: `strava-runners-connect.lovable.app`
- Preview: `id-preview--7b78d716-a91e-4441-86b0-b30684e91214.lovable.app`

### OAuth Scopes
`read,activity:read_all,profile:read_all`

### API Endpoints Used
| Endpoint | Purpose |
|----------|---------|
| `POST /oauth/token` | Exchange code / refresh token |
| `GET /api/v3/athlete` | Fetch athlete profile |
| `GET /api/v3/athlete/activities` | Fetch activity list (paginated) |
| `GET /api/v3/activities/{id}` | Fetch activity details |

### Rate Limiting
- Detailed activity fetches are batched in groups of 10 with 500ms delays between batches
- Maximum 50 detailed activity fetches per sync
- Page limit: 50 pages for full sync, 20 pages for incremental

---

## 8. Environment Variables & Secrets

### Edge Function Secrets (Deno.env)
| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Auto-provided |
| `SUPABASE_ANON_KEY` | Auto-provided |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided |
| `STRAVA_CLIENT_ID` | Strava app client ID (168531) |
| `STRAVA_CLIENT_SECRET` | Strava app client secret |
| `LOVABLE_API_KEY` | Lovable AI gateway key |

### Frontend Environment (.env)
| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Project ID |

---

## 9. Frontend Data Hooks

Key React hooks and their data sources:

| Hook | Table/Source | Notes |
|------|-------------|-------|
| `useCurrentUser` | `auth.getUser()` | Current auth session |
| `useProfile` | `profiles` | Full profile for current user |
| `useActivities(limit?)` | `activities` | User's activities, ordered by start_date desc |
| `useRecentActivities` | `activities` | Last 15 activities |
| `useMonthlyActivities` | `activities` | Current month's activities |
| `useWeeklyStats` | `activities` | Last 8 weeks grouped by week |
| `useMonthlyStats` | `monthly_leaderboard` | Current user's monthly entry |
| `useAllTimeStats` | `profiles` | total_distance, total_runs, streaks |
| `useLeaderboard` | `monthly_leaderboard` + `profiles_public` | Rankings with names/avatars |
| `useUserRank` | `monthly_leaderboard` | Current user's rank |
| `useAchievements` | `achievements` + `user_achievements` | All badges + user's unlocked |
| `useRaces` | `races` + `race_participants` | Published races |
| `useTrainingPlans` | `training_plans` | Published plans |
| `useBlogPosts` | `blog_posts` | Published posts |
| `useIsAdmin` | `user_roles` | Check admin role |

### Data Units
- **Distance**: Always stored/queried in **meters**. Displayed as km (`distance / 1000`).
- **Pace**: Stored as **seconds per km**. Displayed as `mm:ss`.
- **Duration**: Stored as **seconds**. Displayed as `h:mm:ss` or `mm:ss`.
- **Monthly goal**: Stored in **meters** (default 100,000 = 100km).

---

## 10. Self-Hosting Migration

### Prerequisites
- Node.js 18+, PostgreSQL 15+, Docker (recommended)
- Strava Developer Account
- For mobile: Android Studio / Xcode

### Steps

#### 1. Export & Clone
```bash
# Export from Lovable to GitHub, then:
git clone https://github.com/YOUR_USERNAME/erode-runners-club.git
cd erode-runners-club
```

#### 2. Database Setup

**Option A: Supabase (easiest)**
```bash
npm install -g supabase
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

**Option B: Self-hosted PostgreSQL**
```bash
sudo -u postgres psql
CREATE USER erode_runners WITH PASSWORD 'your-password';
CREATE DATABASE erode_runners OWNER erode_runners;
# Apply migrations in order from supabase/migrations/
```

#### 3. Convert Edge Functions to Express.js

The 3 edge functions need to be converted to Express routes:

| Edge Function | Express Route |
|---------------|---------------|
| `strava-auth` | `/functions/v1/strava-auth` |
| `sync-strava` | `/functions/v1/sync-strava` |
| `disconnect-strava` | `/functions/v1/disconnect-strava` |

Key conversion notes:
- Replace `Deno.env.get()` with `process.env`
- Replace `Deno.serve()` with Express router handlers
- Replace Supabase admin client with direct `pg` Pool queries
- Replace `supabase.auth.admin.createUser()` with JWT-based auth
- The sync function is ~850 lines — preserve all logic (token refresh, pagination, streaks, achievements, leaderboard recalc)

#### 4. Server Environment
```env
DATABASE_URL=postgres://erode_runners:password@localhost:5432/erode_runners
STRAVA_CLIENT_ID=168531
STRAVA_CLIENT_SECRET=your-secret
JWT_SECRET=your-jwt-secret-at-least-32-chars
PORT=3001
FRONTEND_URL=http://localhost:5173
```

#### 5. Docker Deployment
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: erode_runners
      POSTGRES_USER: erode_runners
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: ./server
    environment:
      DATABASE_URL: postgres://erode_runners:${DB_PASSWORD}@postgres:5432/erode_runners
      STRAVA_CLIENT_ID: ${STRAVA_CLIENT_ID}
      STRAVA_CLIENT_SECRET: ${STRAVA_CLIENT_SECRET}
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: https://app.${DOMAIN}
    ports: ["3001:3001"]
    depends_on: [postgres]

  web:
    build: .
    ports: ["80:80", "443:443"]
    depends_on: [api]
```

#### 6. Update Strava App Settings
- Authorization Callback Domain → `your-domain.com`
- Update `ALLOWED_REDIRECT_URIS` in strava-auth route

---

## 11. Mobile App (Capacitor)

### Architecture: Web-Shell + OTA Updates
The native APK/IPA is a thin WebView shell that loads the hosted website. Web updates are instant (OTA); new APK only needed for Capacitor config or native plugin changes.

### Capacitor Plugins Used
- `@capacitor/app` — App lifecycle
- `@capacitor/browser` — In-app browser (Strava OAuth)
- `@capacitor/haptics` — Haptic feedback
- `@capacitor/keyboard` — Keyboard management
- `@capacitor/push-notifications` — Push tokens
- `@capacitor/share` — Native share
- `@capacitor/splash-screen` — Splash screen
- `@capacitor/status-bar` — Status bar styling

### Build Commands
```bash
npm run build
npx cap sync
npx cap run android   # or ios
```

### When to Rebuild APK
| Change | Rebuild? |
|--------|----------|
| UI/CSS/components | ❌ OTA |
| New pages/routes | ❌ OTA |
| Bug fixes | ❌ OTA |
| Add/remove Capacitor plugin | ✅ Yes |
| Change capacitor.config.ts | ✅ Yes |
| Change app icon/splash | ✅ Yes |

---

*Last updated: February 2026*
