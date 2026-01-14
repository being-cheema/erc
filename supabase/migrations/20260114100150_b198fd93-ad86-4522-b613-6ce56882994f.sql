-- Add detailed activity fields to activities table
ALTER TABLE public.activities 
  ADD COLUMN IF NOT EXISTS average_heartrate INTEGER,
  ADD COLUMN IF NOT EXISTS max_heartrate INTEGER,
  ADD COLUMN IF NOT EXISTS max_speed NUMERIC,
  ADD COLUMN IF NOT EXISTS average_speed NUMERIC,
  ADD COLUMN IF NOT EXISTS suffer_score INTEGER,
  ADD COLUMN IF NOT EXISTS elapsed_time INTEGER,
  ADD COLUMN IF NOT EXISTS kudos_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS achievement_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS workout_type INTEGER,
  ADD COLUMN IF NOT EXISTS gear_id TEXT;

-- Add athlete profile fields to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weight NUMERIC,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS sex TEXT,
  ADD COLUMN IF NOT EXISTS measurement_preference TEXT DEFAULT 'meters',
  ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS friend_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS premium BOOLEAN DEFAULT false;