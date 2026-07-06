# Production Runbook

## Frontend Deploy

The API base URL is baked in at build time — always export it before building:

```bash
cd /home/aditya/strava-runners-connect
export VITE_API_URL=https://api.eroderunnersclub.com
npm run build
sudo rm -rf /var/www/erode-runners/dist/*
sudo cp -r /home/aditya/strava-runners-connect/dist/* /var/www/erode-runners/dist/
sudo nginx -t
sudo systemctl reload nginx
```

Verify active asset hashes:

```bash
python3 - <<'PY'
from pathlib import Path
html = Path('/var/www/erode-runners/dist/index.html').read_text()
print(html.split('src="')[1].split('"')[0])
print(html.split('href="')[1].split('"')[0])
PY
```

## Backend Deploy

The api image is a multi-stage build — `docker compose up -d --build api`
compiles TypeScript inside the image and runs `node dist/index.js` (no host
`npm run build` needed):

```bash
cd /home/aditya/strava-runners-connect
docker compose up -d --build api
docker compose logs --tail=100 api
```

## Database Migrations

All schema changes go through numbered SQL files in `server/db/migrations/`
applied by the migration runner — **never hand-psql schema changes into prod**.
Migration `001_baseline.sql` marks the current prod schema (= `server/db/init.sql`)
as the baseline.

```bash
cd /home/aditya/strava-runners-connect/server
# DATABASE_URL from the host: postgres is published on 127.0.0.1:5433
DATABASE_URL='postgres://erode_runner:<POSTGRES_PASSWORD>@127.0.0.1:5433/erode_runners' \
  npm run migrate
```

Each pending file runs in its own transaction and is recorded in
`schema_migrations`; re-running is a no-op. Deploy order for changes that need
both code and schema: run the migration first, then rebuild the api.

## Health Checks

```bash
curl -I https://api.eroderunnersclub.com/
curl -s https://api.eroderunnersclub.com/health
```

## Database Backup

Backups should run nightly via cron. Verify it is installed (check both root
and aditya crontabs with `crontab -l`); if missing, install:

```
0 3 * * * /home/aditya/strava-runners-connect/scripts/backup-db.sh >> /var/log/erc-backup.log 2>&1
```

Do a manual restore test into a throwaway database roughly monthly (see
Restore Drill below).

Manual backup:

```bash
/home/aditya/strava-runners-connect/scripts/backup-db.sh
```

List backups:

```bash
ls -lh /home/aditya/backups/erode_runners_*.sql.gz
```

## Restore Drill (staging/local container)

```bash
gunzip -c /home/aditya/backups/<backup-file>.sql.gz | \
docker compose exec -T postgres psql -U erode_runner -d erode_runners
```

## Rollback Frontend

Keep timestamped snapshots of `/var/www/erode-runners/dist` before deploy.

Example:

```bash
sudo cp -r /var/www/erode-runners/dist /var/www/erode-runners/dist_rollback_$(date +%Y%m%d_%H%M%S)
```

To rollback, copy previous snapshot back to `/var/www/erode-runners/dist` and reload Nginx.

## Nginx Changes

Nginx runs on the host; the repo's `nginx.conf` is a documentation mirror of
`/etc/nginx/sites-available/*`. To change routing: edit the site file on the
host, then `sudo nginx -t && sudo systemctl reload nginx`, then update the repo
copy to match.

## APK Publish

Build the signed APK locally, then publish under the stable name (links never
change) plus a versioned copy for rollback:

```bash
# From the machine that built the APK
scp app-release.apk aditya@<vps>:/home/aditya/

# On the VPS
sudo cp /home/aditya/app-release.apk /var/www/erode-runners/downloads/erc-latest.apk
sudo cp /home/aditya/app-release.apk /var/www/erode-runners/downloads/erc-v<VERSION>.apk

# Verify content type + disposition
curl -I https://api.eroderunnersclub.com/downloads/erc-latest.apk
# Expect: HTTP 200, Content-Type: application/vnd.android.package-archive,
#         Content-Disposition: attachment
```

Note: at the next APK release, switch Capacitor `server.url` to
`https://app.eroderunnersclub.com/` (until then api.* must keep serving the SPA).

## Strava Webhook Registration

The webhook listens on a secret path: `POST /webhook/<STRAVA_WEBHOOK_PATH_SECRET>`
(env var in `server/.env`). After changing the secret (or on first setup) the
Strava push subscription must be re-registered:

```bash
# 1. View the current subscription
curl -G https://www.strava.com/api/v3/push_subscriptions \
  -d client_id=<STRAVA_CLIENT_ID> \
  -d client_secret=<STRAVA_CLIENT_SECRET>

# 2. Delete the old subscription (id from step 1)
curl -X DELETE \
  "https://www.strava.com/api/v3/push_subscriptions/<SUBSCRIPTION_ID>?client_id=<STRAVA_CLIENT_ID>&client_secret=<STRAVA_CLIENT_SECRET>"

# 3. Create the new subscription pointing at the secret path.
#    Strava immediately GETs callback_url with a hub.challenge; the server must
#    be up and STRAVA_WEBHOOK_VERIFY_TOKEN must match.
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -d client_id=<STRAVA_CLIENT_ID> \
  -d client_secret=<STRAVA_CLIENT_SECRET> \
  -d callback_url=https://api.eroderunnersclub.com/webhook/<STRAVA_WEBHOOK_PATH_SECRET> \
  -d verify_token=<STRAVA_WEBHOOK_VERIFY_TOKEN>
```

Afterwards, confirm delivery: save/edit an activity on Strava and check
`docker compose logs api` for the webhook event.

## TestFlight Renewal (recurring)

iOS is distributed via TestFlight only; **builds expire after 90 days**. Set a
recurring reminder to upload a fresh build before expiry — no code changes
needed, just rebuild/re-upload from Xcode.

## Single-Instance Assumption

The API must run as **exactly one instance**. Rate limiting, OAuth poll state
(native Strava connect), and webhook dedup are all in-memory — running two api
replicas would silently break them. Do not scale `api` beyond 1 container;
revisit only if the club grows 10x.

