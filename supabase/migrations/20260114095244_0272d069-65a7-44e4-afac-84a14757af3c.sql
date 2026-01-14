-- Create activities table to store individual runs
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  strava_id BIGINT UNIQUE,
  name TEXT,
  distance NUMERIC DEFAULT 0,
  moving_time INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  average_pace NUMERIC,
  activity_type TEXT DEFAULT 'Run',
  calories INTEGER DEFAULT 0,
  elevation_gain NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Users can view their own activities
CREATE POLICY "Users can view their own activities"
ON public.activities FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own activities
CREATE POLICY "Users can insert their own activities"
ON public.activities FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own activities
CREATE POLICY "Users can update their own activities"
ON public.activities FOR UPDATE
USING (auth.uid() = user_id);

-- Add monthly_distance_goal to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_distance_goal NUMERIC DEFAULT 100000;

-- Create index for faster queries
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_start_date ON public.activities(start_date DESC);