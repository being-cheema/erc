-- 001_baseline.sql
--
-- Baseline marker. The current production schema (as captured in
-- server/db/init.sql, regenerated from a prod pg_dump on 2026-07-06) is the
-- starting point for migrations. This file intentionally makes no schema
-- changes beyond creating the bookkeeping table — a fresh database built from
-- init.sql and the production database are both "at baseline".
--
-- All future schema changes go in numbered files (002_*.sql, 003_*.sql, ...)
-- applied via `npm run migrate` in server/. Never hand-edit the prod schema.

CREATE TABLE IF NOT EXISTS schema_migrations (
    version text PRIMARY KEY,
    applied_at timestamptz DEFAULT now()
);
