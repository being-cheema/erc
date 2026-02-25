-- Erode Runners Club - Combined Database Migration
-- Consolidated from 7 Supabase migrations for self-hosted PostgreSQL

-- ============================================================
-- 1. Custom Types
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- ============================================================
-- 2. Users table (replaces Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email_confirmed BOOLEAN DEFAULT true,
    user_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. User roles
-- ============================================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- ============================================================
-- 3b. Refresh Tokens
-- ============================================================
CREATE TABLE public.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);

-- ============================================================
-- 4. Profiles
-- ============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    strava_id TEXT UNIQUE,
    strava_access_token TEXT,
    strava_refresh_token TEXT,
    strava_token_expires_at TIMESTAMPTZ,
    display_name TEXT,
    avatar_url TEXT,
    city TEXT,
    country TEXT,
    sex TEXT,
    weight NUMERIC,
    measurement_preference TEXT DEFAULT 'meters',
    monthly_distance_goal NUMERIC DEFAULT 100000,
    total_distance NUMERIC DEFAULT 0,
    total_runs INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    follower_count INTEGER DEFAULT 0,
    friend_count INTEGER DEFAULT 0,
    premium BOOLEAN DEFAULT false,
    last_synced_at TIMESTAMPTZ,
    last_webhook_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. Activities
-- ============================================================
CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    strava_id BIGINT UNIQUE,
    name TEXT,
    distance NUMERIC DEFAULT 0,
    moving_time INTEGER DEFAULT 0,
    elapsed_time INTEGER,
    start_date TIMESTAMPTZ,
    average_pace NUMERIC,
    average_speed NUMERIC,
    max_speed NUMERIC,
    activity_type TEXT DEFAULT 'Run',
    calories INTEGER DEFAULT 0,
    elevation_gain NUMERIC DEFAULT 0,
    average_heartrate INTEGER,
    max_heartrate INTEGER,
    suffer_score INTEGER,
    kudos_count INTEGER DEFAULT 0,
    achievement_count INTEGER DEFAULT 0,
    description TEXT,
    workout_type INTEGER,
    gear_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_start_date ON public.activities(start_date DESC);
CREATE INDEX idx_activities_strava_id ON public.activities(strava_id);

-- ============================================================
-- 6. Races
-- ============================================================
CREATE TABLE public.races (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    race_date DATE NOT NULL,
    distance_type TEXT NOT NULL,
    registration_url TEXT,
    image_url TEXT,
    is_published BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.race_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    race_id UUID REFERENCES public.races(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (race_id, user_id)
);

-- ============================================================
-- 7. Blog posts
-- ============================================================
CREATE TABLE public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category TEXT NOT NULL,
    image_url TEXT,
    is_published BOOLEAN DEFAULT false,
    author_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. Achievements
-- ============================================================
CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL,
    requirement_type TEXT NOT NULL,
    requirement_value INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, achievement_id)
);

-- ============================================================
-- 9. Training plans
-- ============================================================
CREATE TABLE public.training_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER NOT NULL,
    level TEXT NOT NULL,
    goal_distance TEXT NOT NULL,
    is_published BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.training_weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.training_plans(id) ON DELETE CASCADE NOT NULL,
    week_number INTEGER NOT NULL,
    focus TEXT,
    UNIQUE (plan_id, week_number)
);

CREATE TABLE public.training_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_id UUID REFERENCES public.training_weeks(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL,
    workout_type TEXT NOT NULL,
    distance_km NUMERIC,
    duration_minutes INTEGER,
    notes TEXT
);

CREATE TABLE public.user_training_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.training_plans(id) ON DELETE CASCADE NOT NULL,
    workout_id UUID REFERENCES public.training_workouts(id) ON DELETE CASCADE NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, workout_id)
);

-- ============================================================
-- 10. Monthly leaderboard
-- ============================================================
CREATE TABLE public.monthly_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_distance NUMERIC DEFAULT 0,
    total_runs INTEGER DEFAULT 0,
    rank INTEGER,
    rank_change INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, year, month)
);

-- ============================================================
-- 11. Push tokens & notification preferences
-- ============================================================
CREATE TABLE public.push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL,
    platform TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, token)
);

CREATE TABLE public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    new_races BOOLEAN DEFAULT true,
    leaderboard_changes BOOLEAN DEFAULT true,
    new_blog_posts BOOLEAN DEFAULT true,
    achievements BOOLEAN DEFAULT true,
    training_reminders BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. Views
-- ============================================================
CREATE VIEW public.profiles_public AS
SELECT id, user_id, display_name, avatar_url, city,
       total_distance, total_runs, current_streak,
       longest_streak, created_at, updated_at
FROM profiles;

-- ============================================================
-- 13. Functions
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.recalculate_monthly_leaderboard(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 14. Triggers
-- ============================================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON public.races FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_training_plans_updated_at BEFORE UPDATE ON public.training_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notification_prefs_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON public.monthly_leaderboard FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 15. Seed data - Achievements
-- ============================================================
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value) VALUES
('First 5K', 'Complete your first 5 kilometers', '🎯', 'distance', 'total_distance', 5),
('10K Warrior', 'Run a total of 10 kilometers', '🏃', 'distance', 'total_distance', 10),
('Half Century', 'Run a total of 50 kilometers', '🌟', 'distance', 'total_distance', 50),
('Century Runner', 'Run a total of 100 kilometers', '💯', 'distance', 'total_distance', 100),
('Marathon Legend', 'Run a total of 500 kilometers', '🏆', 'distance', 'total_distance', 500),
('Ultra Champion', 'Run a total of 1000 kilometers', '👑', 'distance', 'total_distance', 1000),
('Week Warrior', 'Maintain a 7-day running streak', '🔥', 'consistency', 'streak_days', 7),
('Month Master', 'Maintain a 30-day running streak', '⚡', 'consistency', 'streak_days', 30),
('Dedication', 'Complete 10 runs', '💪', 'consistency', 'runs_count', 10),
('Committed', 'Complete 50 runs', '🎖️', 'consistency', 'runs_count', 50),
('Unstoppable', 'Complete 100 runs', '🚀', 'consistency', 'runs_count', 100),
('Top 10', 'Reach top 10 on the monthly leaderboard', '🥇', 'community', 'leaderboard_position', 10),
('Podium Finish', 'Reach top 3 on the monthly leaderboard', '🏅', 'community', 'leaderboard_position', 3),
('Champion', 'Reach #1 on the monthly leaderboard', '🏆', 'community', 'leaderboard_position', 1);
