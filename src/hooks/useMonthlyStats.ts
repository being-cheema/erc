import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useProfile";

export function useMonthlyStats() {
  const { user } = useCurrentUser();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return useQuery({
    queryKey: ['monthly-stats', user?.user_id],
    queryFn: async () => {
      const activities = await api.get(`/api/activities?after=${startOfMonth.toISOString()}`);
      if (!activities || !activities.length) {
        return { totalDistance: 0, totalRuns: 0, totalCalories: 0, totalElevation: 0, totalMovingTime: 0 };
      }
      return {
        totalDistance: activities.reduce((s: number, a: any) => s + Number(a.distance || 0), 0),
        totalRuns: activities.length,
        totalCalories: activities.reduce((s: number, a: any) => s + Number(a.calories || 0), 0),
        totalElevation: activities.reduce((s: number, a: any) => s + Number(a.elevation_gain || 0), 0),
        totalMovingTime: activities.reduce((s: number, a: any) => s + Number(a.moving_time || 0), 0),
      };
    },
    enabled: !!user,
  });
}

// Alias used by some components
export const useMonthlyDistance = useMonthlyStats;
