import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";

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
