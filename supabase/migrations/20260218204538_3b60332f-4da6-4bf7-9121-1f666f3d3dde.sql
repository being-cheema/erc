
-- Step 1: Fix stale doubled data for current month
UPDATE monthly_leaderboard ml
SET
  total_distance = (
    SELECT COALESCE(SUM(a.distance), 0)
    FROM activities a
    WHERE a.user_id = ml.user_id
      AND a.start_date >= date_trunc('month', NOW() AT TIME ZONE 'UTC')
      AND a.start_date <  date_trunc('month', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 month'
  ),
  total_runs = (
    SELECT COUNT(*)::integer
    FROM activities a
    WHERE a.user_id = ml.user_id
      AND a.start_date >= date_trunc('month', NOW() AT TIME ZONE 'UTC')
      AND a.start_date <  date_trunc('month', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 month'
  ),
  updated_at = NOW()
WHERE year  = EXTRACT(YEAR  FROM NOW() AT TIME ZONE 'UTC')
  AND month = EXTRACT(MONTH FROM NOW() AT TIME ZONE 'UTC');

-- Step 2: Create atomic DB function for future syncs
CREATE OR REPLACE FUNCTION public.recalculate_monthly_leaderboard(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year  int := EXTRACT(YEAR  FROM NOW() AT TIME ZONE 'UTC');
  v_month int := EXTRACT(MONTH FROM NOW() AT TIME ZONE 'UTC');
  v_dist  numeric;
  v_runs  int;
BEGIN
  SELECT
    COALESCE(SUM(distance), 0),
    COUNT(*)::int
  INTO v_dist, v_runs
  FROM activities
  WHERE user_id   = target_user_id
    AND start_date >= date_trunc('month', NOW() AT TIME ZONE 'UTC')
    AND start_date <  date_trunc('month', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 month';

  INSERT INTO monthly_leaderboard (user_id, year, month, total_distance, total_runs, updated_at)
  VALUES (target_user_id, v_year, v_month, v_dist, v_runs, NOW())
  ON CONFLICT (user_id, year, month)
  DO UPDATE SET
    total_distance = EXCLUDED.total_distance,
    total_runs     = EXCLUDED.total_runs,
    updated_at     = NOW();
END;
$$;
