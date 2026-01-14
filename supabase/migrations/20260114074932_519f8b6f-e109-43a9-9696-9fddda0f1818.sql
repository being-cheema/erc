-- Fix profiles table RLS - protect tokens and PII
-- First drop the overly permissive select policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create a view for public profile data (excluding sensitive tokens)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  city,
  total_distance,
  total_runs,
  current_streak,
  longest_streak,
  created_at,
  updated_at
FROM public.profiles;

-- Users can view their own full profile (including tokens for sync)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Public can view basic profile info via the view for leaderboard
CREATE POLICY "Public can view basic profile info"
ON public.profiles
FOR SELECT
USING (
  -- Only allow selecting non-sensitive columns conceptually
  -- This allows the view to work while protecting direct access
  true
);

-- Actually, we need a different approach - create secure policies
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;

-- For leaderboard, allow viewing only non-sensitive data
-- We'll handle this in the application by only selecting safe columns