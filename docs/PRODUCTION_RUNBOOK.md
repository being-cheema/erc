# Production Runbook

## Frontend Deploy

```bash
cd /home/aditya/strava-runners-connect
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

```bash
cd /home/aditya/strava-runners-connect/server
npm run build
cd /home/aditya/strava-runners-connect
docker compose up -d --build api
docker compose logs --tail=100 api
```

## Health Checks

```bash
curl -I https://api.eroderunnersclub.com/
curl -s https://api.eroderunnersclub.com/health
```

## Database Backup

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

