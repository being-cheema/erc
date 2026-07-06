# Erode Runners Club

A Strava-connected running club app for the Erode Runners Club. Members connect
their Strava account and get a club leaderboard, challenges, group runs with
RSVPs and check-ins, personal records, achievements, training plans, race
listings and results, a blog, and a digital membership card.

- **Web app:** https://app.eroderunnersclub.com
- **API:** https://api.eroderunnersclub.com
- **Android APK:** https://api.eroderunnersclub.com/downloads/erc-latest.apk

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React 18 + TypeScript, Tailwind, shadcn/ui, TanStack Query |
| Mobile | Capacitor (Android APK + iOS TestFlight) loading the hosted SPA (OTA — web deploys update the app) |
| Backend | Express + TypeScript (ESM), `pg`, JWT auth, Strava OAuth + webhooks |
| Database | PostgreSQL 16 (docker), numbered SQL migrations (`server/db/migrations/`) |
| Infra | Single VPS: docker compose (api + postgres), nginx on the host serving the SPA and proxying the API |

## Repo layout

```
src/                  React SPA
server/src/           Express API (routes/, middleware/, utils/, scheduler)
server/db/init.sql    Full schema for a fresh database (regenerated from prod)
server/db/migrations/ Numbered SQL migrations (001 = baseline)
android/, ios/        Capacitor native shells
nginx.conf            Documentation copy of the host nginx config
docker-compose.yml    postgres + api (+ dev web container)
scripts/backup-db.sh  Daily DB backup (cron)
docs/                 Production runbook, maintenance audit/solutions
```

## Local development

Prereqs: Node 20, Docker.

```bash
# 1. Env files
cp .env.example .env                # frontend (VITE_API_URL)
cp server/.env.example server/.env  # server — fill in values

# 2. Database (applies server/db/init.sql on first boot)
docker compose up -d postgres

# 3. API — either in docker or directly:
docker compose up -d api            # compiled, production-like
# or, for hot reload:
cd server && npm ci && npm run dev  # tsx watch src/index.ts

# 4. Frontend
npm ci
npm run dev                         # http://localhost:5173
```

For local dev set `VITE_API_URL=http://localhost:3001` in `.env` and use a
`DATABASE_URL` pointing at `127.0.0.1:5433` if running the API outside docker.

### Database migrations

Schema changes go through numbered SQL files, never hand-run psql:

```bash
cd server
npm run migrate   # applies pending server/db/migrations/*.sql in order
```

## Deploying

Deploys are manual, on the VPS — see [docs/PRODUCTION_RUNBOOK.md](docs/PRODUCTION_RUNBOOK.md)
for the full procedures (frontend build + copy, `docker compose up -d --build api`,
migrations, backups, webhook registration, APK publishing).

Short version:

- **Frontend:** `export VITE_API_URL=https://api.eroderunnersclub.com`, `npm run build`,
  copy `dist/` to `/var/www/erode-runners/dist`, reload nginx.
- **Backend:** `docker compose up -d --build api` (multi-stage build, runs compiled JS).
- **DB:** add a migration file, `npm run migrate` in `server/`.

## Mobile

The Android/iOS apps are thin Capacitor shells that load the hosted SPA
(`server.url` OTA mode), so web deploys update mobile users instantly — a new
APK/TestFlight build is only needed for native-layer changes. The APK is
distributed from `api.eroderunnersclub.com/downloads/` (publish steps in the
runbook); iOS goes through TestFlight (builds expire every 90 days).
