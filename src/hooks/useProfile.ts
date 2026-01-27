import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Profile type excluding sensitive Strava tokens
// This prevents OAuth tokens from being exposed to client-side code
export type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  sex: string | null;
  weight: number | null;
  total_distance: number | null;
  total_runs: number | null;
  current_streak: number | null;
  longest_streak: number | null;
  monthly_distance_goal: number | null;
  measurement_preference: string | null;
  follower_count: number | null;
  friend_count: number | null;
  premium: boolean | null;
  strava_id: string | null; // Safe to expose - just the Strava user ID, not tokens
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // SECURITY: Explicitly select only non-sensitive columns
      // Excludes: strava_access_token, strava_refresh_token, strava_token_expires_at
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          user_id,
          display_name,
          avatar_url,
          city,
          country,
          sex,
          weight,
          total_distance,
          total_runs,
          current_streak,
          longest_streak,
          monthly_distance_goal,
          measurement_preference,
          follower_count,
          friend_count,
          premium,
          strava_id,
          last_synced_at,
          created_at,
          updated_at
        `)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });
};
