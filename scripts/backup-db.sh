#!/bin/bash
# Erode Runners Club — Daily Database Backup
# Run via cron: 0 3 * * * /home/aditya/strava-runners-connect/scripts/backup-db.sh
set -euo pipefail

BACKUP_DIR="/home/aditya/backups"
COMPOSE_DIR="/home/aditya/strava-runners-connect"
KEEP_DAYS=7

mkdir -p "$BACKUP_DIR"

FILENAME="erode_runners_$(date +%Y%m%d_%H%M%S).sql.gz"

docker compose -f "$COMPOSE_DIR/docker-compose.yml" exec -T postgres \
  pg_dump -U erode_runner erode_runners | gzip > "$BACKUP_DIR/$FILENAME"

# Delete backups older than $KEEP_DAYS days
find "$BACKUP_DIR" -name "erode_runners_*.sql.gz" -mtime +$KEEP_DAYS -delete

echo "[$(date)] Backup done: $FILENAME ($(du -h "$BACKUP_DIR/$FILENAME" | cut -f1))"
