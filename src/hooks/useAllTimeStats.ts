import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useProfile";

export function useAllTimeStats() {
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['all-time-stats', user?.user_id],
    queryFn: async () => {
      const activities = await api.get('/api/activities');
      if (!activities || !activities.length) {
        return {
          totalDistance: 0, totalRuns: 0, totalCalories: 0, totalElevation: 0,
          totalMovingTime: 0, avgPace: 0, avgDistance: 0, longestRun: 0, fastestPace: 0,
        };
      }

      const totalDistance = activities.reduce((s: number, a: any) => s + Number(a.distance || 0), 0);
      const totalRuns = activities.length;
      const totalCalories = activities.reduce((s: number, a: any) => s + Number(a.calories || 0), 0);
      const totalElevation = activities.reduce((s: number, a: any) => s + Number(a.elevation_gain || 0), 0);
      const totalMovingTime = activities.reduce((s: number, a: any) => s + Number(a.moving_time || 0), 0);

      const paces = activities
        .filter((a: any) => a.average_pace && Number(a.average_pace) > 0)
        .map((a: any) => Number(a.average_pace));
      const avgPace = paces.length > 0 ? paces.reduce((s: number, p: number) => s + p, 0) / paces.length : 0;
      const fastestPace = paces.length > 0 ? Math.min(...paces) : 0;

      const heartRates = activities
        .filter((a: any) => a.average_heartrate && Number(a.average_heartrate) > 0)
        .map((a: any) => Number(a.average_heartrate));
      const avgHeartRate = heartRates.length > 0
        ? Math.round(heartRates.reduce((s: number, h: number) => s + h, 0) / heartRates.length)
        : null;

      return {
        totalDistance,
        totalRuns,
        totalCalories,
        totalElevation,
        totalMovingTime,
        avgPace,
        avgHeartRate,
        avgDistance: totalRuns > 0 ? totalDistance / totalRuns : 0,
        longestRun: Math.max(...activities.map((a: any) => Number(a.distance || 0))),
        fastestPace,
      };
    },
    enabled: !!user,
  });
}
