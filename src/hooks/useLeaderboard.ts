import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  id?: string;
  user_id: string;
  member_id?: string;
  display_name: string;
  avatar_url: string | null;
  city?: string;
  total_distance: number;
  total_runs?: number;
  rank?: number;
  rank_change?: number | null;
}

export function useLeaderboard(period: string = 'monthly') {
  return useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      return api.get(`/api/leaderboard?period=${period}`);
    },
  });
}

// Aliases used by components
export function useMonthlyLeaderboard() {
  return useLeaderboard('monthly');
}

export function useAllTimeLeaderboard() {
  return useLeaderboard('alltime');
}

export function useUserRankData() {
  return useQuery({
    queryKey: ['leaderboard', 'me'],
    queryFn: async () => {
      return api.get('/api/leaderboard/me');
    },
    enabled: api.isAuthenticated(),
  });
}
