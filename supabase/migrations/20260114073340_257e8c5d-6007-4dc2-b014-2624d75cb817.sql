-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    strava_id TEXT UNIQUE,
    strava_access_token TEXT,
    strava_refresh_token TEXT,
    strava_token_expires_at TIMESTAMP WITH TIME ZONE,
    display_name TEXT,
    avatar_url TEXT,
    city TEXT,
    total_distance NUMERIC DEFAULT 0,
    total_runs INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Races table
CREATE TABLE public.races (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    race_date DATE NOT NULL,
    distance_type TEXT NOT NULL, -- '5K', '10K', 'Half Marathon', 'Marathon'
    registration_url TEXT,
    image_url TEXT,
    is_published BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Race participants
CREATE TABLE public.race_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    race_id UUID REFERENCES public.races(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (race_id, user_id)
);

-- Blog posts table
CREATE TABLE public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category TEXT NOT NULL, -- 'Nutrition', 'Gear', 'Training', 'Recovery', 'Stories'
    image_url TEXT,
    is_published BOOLEAN DEFAULT false,
    author_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Achievements/Badges table
CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL, -- emoji or icon name
    category TEXT NOT NULL, -- 'distance', 'consistency', 'speed', 'community'
    requirement_type TEXT NOT NULL, -- 'total_distance', 'streak_days', 'leaderboard_position', 'runs_count'
    requirement_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User achievements (unlocked badges)
CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, achievement_id)
);

-- Training plans table
CREATE TABLE public.training_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER NOT NULL,
    level TEXT NOT NULL, -- 'Beginner', 'Intermediate', 'Advanced'
    goal_distance TEXT NOT NULL, -- '5K', '10K', 'Half Marathon', 'Marathon'
    is_published BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Training plan weeks
CREATE TABLE public.training_weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.training_plans(id) ON DELETE CASCADE NOT NULL,
    week_number INTEGER NOT NULL,
    focus TEXT, -- 'Base Building', 'Speed Work', 'Taper', etc.
    UNIQUE (plan_id, week_number)
);

-- Training workouts
CREATE TABLE public.training_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_id UUID REFERENCES public.training_weeks(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL, -- 1-7
    workout_type TEXT NOT NULL, -- 'Easy Run', 'Tempo', 'Intervals', 'Long Run', 'Rest', 'Cross Training'
    distance_km NUMERIC,
    duration_minutes INTEGER,
    notes TEXT
);

-- User training plan progress
CREATE TABLE public.user_training_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.training_plans(id) ON DELETE CASCADE NOT NULL,
    workout_id UUID REFERENCES public.training_workouts(id) ON DELETE CASCADE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, workout_id)
);

-- Monthly leaderboard cache
CREATE TABLE public.monthly_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_distance NUMERIC DEFAULT 0,
    total_runs INTEGER DEFAULT 0,
    rank INTEGER,
    rank_change INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, year, month)
);

-- Push notification tokens
CREATE TABLE public.push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'ios', 'android', 'web'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, token)
);

-- Notification preferences
CREATE TABLE public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    new_races BOOLEAN DEFAULT true,
    leaderboard_changes BOOLEAN DEFAULT true,
    new_blog_posts BOOLEAN DEFAULT true,
    achievements BOOLEAN DEFAULT true,
    training_reminders BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON public.races FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_training_plans_updated_at BEFORE UPDATE ON public.training_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notification_prefs_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON public.monthly_leaderboard FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- User roles: Only admins can view all, users see their own
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: Users can view all profiles (for leaderboard), but only update their own
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Races: Public can view published races, admins can manage all
CREATE POLICY "Anyone can view published races" ON public.races FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert races" ON public.races FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update races" ON public.races FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete races" ON public.races FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Race participants: Users can register themselves, view all
CREATE POLICY "Anyone can view race participants" ON public.race_participants FOR SELECT USING (true);
CREATE POLICY "Users can register for races" ON public.race_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unregister from races" ON public.race_participants FOR DELETE USING (auth.uid() = user_id);

-- Blog posts: Public can view published, admins manage all
CREATE POLICY "Anyone can view published posts" ON public.blog_posts FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert posts" ON public.blog_posts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update posts" ON public.blog_posts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete posts" ON public.blog_posts FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Achievements: Anyone can view
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User achievements: Users see all (for display), system manages
CREATE POLICY "Anyone can view user achievements" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "Users can receive achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Training plans: Public can view published, admins manage
CREATE POLICY "Anyone can view published plans" ON public.training_plans FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage plans" ON public.training_plans FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Training weeks/workouts: Viewable if plan is accessible
CREATE POLICY "Anyone can view training weeks" ON public.training_weeks FOR SELECT USING (true);
CREATE POLICY "Admins can manage weeks" ON public.training_weeks FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view training workouts" ON public.training_workouts FOR SELECT USING (true);
CREATE POLICY "Admins can manage workouts" ON public.training_workouts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User training progress: Users manage their own
CREATE POLICY "Users can view their own progress" ON public.user_training_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.user_training_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own progress" ON public.user_training_progress FOR DELETE USING (auth.uid() = user_id);

-- Monthly leaderboard: Public read, system manages
CREATE POLICY "Anyone can view leaderboard" ON public.monthly_leaderboard FOR SELECT USING (true);
CREATE POLICY "Users can update their own leaderboard entry" ON public.monthly_leaderboard FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their leaderboard" ON public.monthly_leaderboard FOR UPDATE USING (auth.uid() = user_id);

-- Push tokens: Users manage their own
CREATE POLICY "Users can view their own tokens" ON public.push_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tokens" ON public.push_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tokens" ON public.push_tokens FOR DELETE USING (auth.uid() = user_id);

-- Notification preferences: Users manage their own
CREATE POLICY "Users can view their own notification prefs" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notification prefs" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notification prefs" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value) VALUES
-- Distance badges
('First 5K', 'Complete your first 5 kilometers', '🎯', 'distance', 'total_distance', 5),
('10K Warrior', 'Run a total of 10 kilometers', '🏃', 'distance', 'total_distance', 10),
('Half Century', 'Run a total of 50 kilometers', '🌟', 'distance', 'total_distance', 50),
('Century Runner', 'Run a total of 100 kilometers', '💯', 'distance', 'total_distance', 100),
('Marathon Legend', 'Run a total of 500 kilometers', '🏆', 'distance', 'total_distance', 500),
('Ultra Champion', 'Run a total of 1000 kilometers', '👑', 'distance', 'total_distance', 1000),
-- Consistency badges
('Week Warrior', 'Maintain a 7-day running streak', '🔥', 'consistency', 'streak_days', 7),
('Month Master', 'Maintain a 30-day running streak', '⚡', 'consistency', 'streak_days', 30),
('Dedication', 'Complete 10 runs', '💪', 'consistency', 'runs_count', 10),
('Committed', 'Complete 50 runs', '🎖️', 'consistency', 'runs_count', 50),
('Unstoppable', 'Complete 100 runs', '🚀', 'consistency', 'runs_count', 100),
-- Community badges
('Top 10', 'Reach top 10 on the monthly leaderboard', '🥇', 'community', 'leaderboard_position', 10),
('Podium Finish', 'Reach top 3 on the monthly leaderboard', '🏅', 'community', 'leaderboard_position', 3),
('Champion', 'Reach #1 on the monthly leaderboard', '🏆', 'community', 'leaderboard_position', 1);