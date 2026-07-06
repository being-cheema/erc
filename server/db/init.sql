-- Erode Runners Club — Database bootstrap for a fresh PostgreSQL 16 instance.
--
-- The DDL below was regenerated on 2026-07-06 from the PRODUCTION database:
--   docker exec strava-runners-connect-postgres-1 pg_dump -U erode_runner \
--     -d erode_runners --schema-only --no-owner --no-privileges
-- Production is the source of truth for the schema. Do NOT hand-edit prod;
-- all future changes go through server/db/migrations/ (npm run migrate).
--
-- Layout: (1) pg_dump schema (types, functions, tables, views, constraints,
-- indexes, triggers, FKs), (2) seed data (achievements).

--
-- PostgreSQL database dump
--


-- Dumped from database version 16.12
-- Dumped by pg_dump version 16.12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'member'
);


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: recalculate_monthly_leaderboard(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.recalculate_monthly_leaderboard(target_user_id uuid) RETURNS void
    LANGUAGE plpgsql
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


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    category text NOT NULL,
    requirement_type text NOT NULL,
    requirement_value integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    strava_id bigint,
    name text,
    distance numeric DEFAULT 0,
    moving_time integer DEFAULT 0,
    elapsed_time integer,
    start_date timestamp with time zone,
    average_pace numeric,
    average_speed numeric,
    max_speed numeric,
    activity_type text DEFAULT 'Run'::text,
    calories integer DEFAULT 0,
    elevation_gain numeric DEFAULT 0,
    average_heartrate integer,
    max_heartrate integer,
    suffer_score integer,
    kudos_count integer DEFAULT 0,
    achievement_count integer DEFAULT 0,
    description text,
    workout_type integer,
    gear_id text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content text NOT NULL,
    excerpt text,
    category text NOT NULL,
    image_url text,
    is_published boolean DEFAULT false,
    author_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: challenge_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenge_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    challenge_id uuid,
    user_id uuid,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    current_progress numeric DEFAULT 0,
    is_completed boolean DEFAULT false,
    completed_at timestamp with time zone
);


--
-- Name: challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    challenge_type text NOT NULL,
    target_value numeric NOT NULL,
    target_unit text NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    count_from text DEFAULT 'challenge_start'::text NOT NULL,
    is_published boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: group_run_attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_run_attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_run_id uuid NOT NULL,
    user_id uuid NOT NULL,
    checked_in_at timestamp with time zone DEFAULT now(),
    checked_in_by uuid
);


--
-- Name: group_run_rsvps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_run_rsvps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_run_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'going'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT group_run_rsvps_status_check CHECK ((status = ANY (ARRAY['going'::text, 'maybe'::text, 'not_going'::text])))
);


--
-- Name: group_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    location text NOT NULL,
    meeting_point text,
    run_date timestamp with time zone NOT NULL,
    distance_km numeric,
    pace_group text,
    max_participants integer,
    is_published boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: monthly_leaderboard; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monthly_leaderboard (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    total_distance numeric DEFAULT 0,
    total_runs integer DEFAULT 0,
    rank integer,
    rank_change integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    new_races boolean DEFAULT true,
    leaderboard_changes boolean DEFAULT true,
    new_blog_posts boolean DEFAULT true,
    achievements boolean DEFAULT true,
    training_reminders boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: personal_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category text NOT NULL,
    distance numeric NOT NULL,
    time_seconds integer,
    pace numeric,
    activity_id uuid,
    achieved_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT personal_records_category_check CHECK ((category = ANY (ARRAY['5k'::text, '10k'::text, 'half_marathon'::text, 'marathon'::text, 'longest_run'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    strava_id text,
    strava_access_token text,
    strava_refresh_token text,
    strava_token_expires_at timestamp with time zone,
    display_name text,
    avatar_url text,
    city text,
    country text,
    sex text,
    weight numeric,
    measurement_preference text DEFAULT 'meters'::text,
    monthly_distance_goal numeric DEFAULT 100000,
    total_distance numeric DEFAULT 0,
    total_runs integer DEFAULT 0,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    follower_count integer DEFAULT 0,
    friend_count integer DEFAULT 0,
    premium boolean DEFAULT false,
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_webhook_at timestamp with time zone,
    member_id character varying(16)
);


--
-- Name: profiles_public; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.profiles_public AS
 SELECT id,
    user_id,
    display_name,
    avatar_url,
    city,
    member_id,
    total_distance,
    total_runs,
    current_streak,
    longest_streak,
    created_at,
    updated_at
   FROM public.profiles;


--
-- Name: push_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    platform text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: race_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.race_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    race_id uuid NOT NULL,
    user_id uuid NOT NULL,
    registered_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: race_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.race_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    race_name text NOT NULL,
    race_date date NOT NULL,
    distance_category text NOT NULL,
    distance_km numeric,
    finish_time_seconds integer NOT NULL,
    pace numeric,
    bib_number text,
    notes text,
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT race_results_distance_category_check CHECK ((distance_category = ANY (ARRAY['5k'::text, '10k'::text, 'half_marathon'::text, 'marathon'::text, 'ultra'::text, 'other'::text])))
);


--
-- Name: races; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.races (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    location text,
    race_date date NOT NULL,
    distance_type text NOT NULL,
    registration_url text,
    image_url text,
    is_published boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: training_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    duration_weeks integer NOT NULL,
    level text NOT NULL,
    goal_distance text NOT NULL,
    is_published boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: training_weeks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_weeks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    week_number integer NOT NULL,
    focus text
);


--
-- Name: training_workouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_workouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    week_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    workout_type text NOT NULL,
    distance_km numeric,
    duration_minutes integer,
    notes text
);


--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    achievement_id uuid NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'member'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_training_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_training_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    workout_id uuid NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    email_confirmed boolean DEFAULT true,
    user_metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: activities activities_strava_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_strava_id_key UNIQUE (strava_id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);


--
-- Name: challenge_participants challenge_participants_challenge_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_participants
    ADD CONSTRAINT challenge_participants_challenge_id_user_id_key UNIQUE (challenge_id, user_id);


--
-- Name: challenge_participants challenge_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_participants
    ADD CONSTRAINT challenge_participants_pkey PRIMARY KEY (id);


--
-- Name: challenges challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_pkey PRIMARY KEY (id);


--
-- Name: group_run_attendance group_run_attendance_group_run_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_run_attendance
    ADD CONSTRAINT group_run_attendance_group_run_id_user_id_key UNIQUE (group_run_id, user_id);


--
-- Name: group_run_attendance group_run_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_run_attendance
    ADD CONSTRAINT group_run_attendance_pkey PRIMARY KEY (id);


--
-- Name: group_run_rsvps group_run_rsvps_group_run_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_run_rsvps
    ADD CONSTRAINT group_run_rsvps_group_run_id_user_id_key UNIQUE (group_run_id, user_id);


--
-- Name: group_run_rsvps group_run_rsvps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_run_rsvps
    ADD CONSTRAINT group_run_rsvps_pkey PRIMARY KEY (id);


--
-- Name: group_runs group_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_runs
    ADD CONSTRAINT group_runs_pkey PRIMARY KEY (id);


--
-- Name: monthly_leaderboard monthly_leaderboard_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_leaderboard
    ADD CONSTRAINT monthly_leaderboard_pkey PRIMARY KEY (id);


--
-- Name: monthly_leaderboard monthly_leaderboard_user_id_year_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_leaderboard
    ADD CONSTRAINT monthly_leaderboard_user_id_year_month_key UNIQUE (user_id, year, month);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: personal_records personal_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_records
    ADD CONSTRAINT personal_records_pkey PRIMARY KEY (id);


--
-- Name: personal_records personal_records_user_id_category_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_records
    ADD CONSTRAINT personal_records_user_id_category_key UNIQUE (user_id, category);


--
-- Name: profiles profiles_member_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_member_id_key UNIQUE (member_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_strava_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_strava_id_key UNIQUE (strava_id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: push_tokens push_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_tokens
    ADD CONSTRAINT push_tokens_pkey PRIMARY KEY (id);


--
-- Name: push_tokens push_tokens_user_id_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_tokens
    ADD CONSTRAINT push_tokens_user_id_token_key UNIQUE (user_id, token);


--
-- Name: race_participants race_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.race_participants
    ADD CONSTRAINT race_participants_pkey PRIMARY KEY (id);


--
-- Name: race_participants race_participants_race_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.race_participants
    ADD CONSTRAINT race_participants_race_id_user_id_key UNIQUE (race_id, user_id);


--
-- Name: race_results race_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.race_results
    ADD CONSTRAINT race_results_pkey PRIMARY KEY (id);


--
-- Name: races races_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.races
    ADD CONSTRAINT races_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: training_plans training_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_plans
    ADD CONSTRAINT training_plans_pkey PRIMARY KEY (id);


--
-- Name: training_weeks training_weeks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_weeks
    ADD CONSTRAINT training_weeks_pkey PRIMARY KEY (id);


--
-- Name: training_weeks training_weeks_plan_id_week_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_weeks
    ADD CONSTRAINT training_weeks_plan_id_week_number_key UNIQUE (plan_id, week_number);


--
-- Name: training_workouts training_workouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_workouts
    ADD CONSTRAINT training_workouts_pkey PRIMARY KEY (id);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- Name: user_achievements user_achievements_user_id_achievement_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_achievement_id_key UNIQUE (user_id, achievement_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_training_progress user_training_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_training_progress
    ADD CONSTRAINT user_training_progress_pkey PRIMARY KEY (id);


--
-- Name: user_training_progress user_training_progress_user_id_workout_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_training_progress
    ADD CONSTRAINT user_training_progress_user_id_workout_id_key UNIQUE (user_id, workout_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_activities_start_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_start_date ON public.activities USING btree (start_date DESC);


--
-- Name: idx_activities_strava_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_strava_id ON public.activities USING btree (strava_id);


--
-- Name: idx_activities_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_user_id ON public.activities USING btree (user_id);


--
-- Name: idx_cp_challenge; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cp_challenge ON public.challenge_participants USING btree (challenge_id);


--
-- Name: idx_cp_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cp_user ON public.challenge_participants USING btree (user_id);


--
-- Name: idx_group_run_rsvps_run; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_run_rsvps_run ON public.group_run_rsvps USING btree (group_run_id);


--
-- Name: idx_group_runs_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_runs_date ON public.group_runs USING btree (run_date);


--
-- Name: idx_personal_records_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_personal_records_user ON public.personal_records USING btree (user_id);


--
-- Name: idx_race_results_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_race_results_category ON public.race_results USING btree (distance_category);


--
-- Name: idx_race_results_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_race_results_user ON public.race_results USING btree (user_id);


--
-- Name: idx_refresh_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens USING btree (token);


--
-- Name: idx_refresh_tokens_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_reset_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_reset_tokens_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reset_tokens_user ON public.password_reset_tokens USING btree (user_id);


--
-- Name: blog_posts update_blog_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: challenges update_challenges_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON public.challenges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: monthly_leaderboard update_leaderboard_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON public.monthly_leaderboard FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notification_preferences update_notification_prefs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notification_prefs_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: races update_races_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON public.races FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: training_plans update_training_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_training_plans_updated_at BEFORE UPDATE ON public.training_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activities activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: blog_posts blog_posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: challenge_participants challenge_participants_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_participants
    ADD CONSTRAINT challenge_participants_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;


--
-- Name: challenge_participants challenge_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_participants
    ADD CONSTRAINT challenge_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: challenges challenges_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: group_run_attendance group_run_attendance_checked_in_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_run_attendance
    ADD CONSTRAINT group_run_attendance_checked_in_by_fkey FOREIGN KEY (checked_in_by) REFERENCES public.users(id);


--
-- Name: group_run_attendance group_run_attendance_group_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_run_attendance
    ADD CONSTRAINT group_run_attendance_group_run_id_fkey FOREIGN KEY (group_run_id) REFERENCES public.group_runs(id) ON DELETE CASCADE;


--
-- Name: group_run_attendance group_run_attendance_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_run_attendance
    ADD CONSTRAINT group_run_attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_run_rsvps group_run_rsvps_group_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_run_rsvps
    ADD CONSTRAINT group_run_rsvps_group_run_id_fkey FOREIGN KEY (group_run_id) REFERENCES public.group_runs(id) ON DELETE CASCADE;


--
-- Name: group_run_rsvps group_run_rsvps_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_run_rsvps
    ADD CONSTRAINT group_run_rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_runs group_runs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_runs
    ADD CONSTRAINT group_runs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: monthly_leaderboard monthly_leaderboard_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_leaderboard
    ADD CONSTRAINT monthly_leaderboard_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: personal_records personal_records_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_records
    ADD CONSTRAINT personal_records_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE SET NULL;


--
-- Name: personal_records personal_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_records
    ADD CONSTRAINT personal_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: push_tokens push_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_tokens
    ADD CONSTRAINT push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: race_participants race_participants_race_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.race_participants
    ADD CONSTRAINT race_participants_race_id_fkey FOREIGN KEY (race_id) REFERENCES public.races(id) ON DELETE CASCADE;


--
-- Name: race_participants race_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.race_participants
    ADD CONSTRAINT race_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: race_results race_results_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.race_results
    ADD CONSTRAINT race_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: races races_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.races
    ADD CONSTRAINT races_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: training_plans training_plans_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_plans
    ADD CONSTRAINT training_plans_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: training_weeks training_weeks_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_weeks
    ADD CONSTRAINT training_weeks_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.training_plans(id) ON DELETE CASCADE;


--
-- Name: training_workouts training_workouts_week_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_workouts
    ADD CONSTRAINT training_workouts_week_id_fkey FOREIGN KEY (week_id) REFERENCES public.training_weeks(id) ON DELETE CASCADE;


--
-- Name: user_achievements user_achievements_achievement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id) ON DELETE CASCADE;


--
-- Name: user_achievements user_achievements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_training_progress user_training_progress_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_training_progress
    ADD CONSTRAINT user_training_progress_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.training_plans(id) ON DELETE CASCADE;


--
-- Name: user_training_progress user_training_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_training_progress
    ADD CONSTRAINT user_training_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_training_progress user_training_progress_workout_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_training_progress
    ADD CONSTRAINT user_training_progress_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.training_workouts(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--



--
-- Seed data — Achievements
-- (columns match production public.achievements; values in km for
-- total_distance, days for streak_days, count for runs_count,
-- rank for leaderboard_position)
--

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
