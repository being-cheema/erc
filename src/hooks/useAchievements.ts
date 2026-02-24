import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";

export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      return api.get('/api/achievements');
    },
  });
}

// Returns achievements with unlocked status for current user
export function useAchievementsWithStatus() {
  return useQuery({
    queryKey: ['achievements-with-status'],
    queryFn: async () => {
      const data = await api.get('/api/achievements');
      const { achievements, userAchievements } = data;
      const unlockedIds = new Set(userAchievements?.map((ua: any) => ua.achievement_id) || []);

      return achievements.map((ach: any) => ({
        ...ach,
        unlocked: unlockedIds.has(ach.id),
        unlocked_at: userAchievements?.find((ua: any) => ua.achievement_id === ach.id)?.unlocked_at || null,
      }));
    },
    enabled: api.isAuthenticated(),
  });
}
