
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
  SELECT id, user_id, display_name, avatar_url, city,
         total_distance, total_runs, current_streak,
         longest_streak, created_at, updated_at
  FROM profiles;

GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;

NOTIFY pgrst, 'reload schema';
