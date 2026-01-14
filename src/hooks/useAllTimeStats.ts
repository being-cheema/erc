import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useProfile";

export interface AllTimeStats {
  totalDistance: number;
  totalRuns: number;
  totalElevation: number;
  totalCalories: number;
  avgPace: number | null;
  avgHeartRate: number | null;
  currentStreak: number;
  longestStreak: number;
}

function calculateStreaks(dates: Date[]): { currentStreak: number; longestStreak: number } {
  if (dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Get unique dates (day-level) and sort descending
  const uniqueDates = [...new Set(dates.map(d => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }))].sort((a, b) => b - a);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < uniqueDates.length; i++) {
    const dateTime = uniqueDates[i];

    if (i === 0) {
      const daysDiff = Math.floor((todayTime - dateTime) / oneDayMs);
      if (daysDiff <= 1) {
        tempStreak = 1;
        currentStreak = 1;
      } else {
        tempStreak = 1;
      }
    } else {
      const prevDateTime = uniqueDates[i - 1];
      const daysDiff = Math.floor((prevDateTime - dateTime) / oneDayMs);
      
      if (daysDiff === 1) {
        tempStreak++;
        if (currentStreak > 0) {
          currentStreak = tempStreak;
        }
      } else {
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return { currentStreak, longestStreak };
}

export function useAllTimeStats() {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["allTimeStats", user?.id],
    queryFn: async (): Promise<AllTimeStats> => {
      if (!user?.id) {
        return {
          totalDistance: 0,
          totalRuns: 0,
          totalElevation: 0,
          totalCalories: 0,
          avgPace: null,
          avgHeartRate: null,
          currentStreak: 0,
          longestStreak: 0,
        };
      }

      // Fetch all activities for the user
      const { data: activities, error } = await supabase
        .from("activities")
        .select("distance, elevation_gain, calories, average_pace, average_heartrate, start_date")
        .eq("user_id", user.id);

      if (error) throw error;

      if (!activities || activities.length === 0) {
        return {
          totalDistance: 0,
          totalRuns: 0,
          totalElevation: 0,
          totalCalories: 0,
          avgPace: null,
          avgHeartRate: null,
          currentStreak: 0,
          longestStreak: 0,
        };
      }

      // Calculate totals
      const totalDistance = activities.reduce((sum, a) => sum + (Number(a.distance) || 0), 0);
      const totalRuns = activities.length;
      const totalElevation = activities.reduce((sum, a) => sum + (Number(a.elevation_gain) || 0), 0);
      const totalCalories = activities.reduce((sum, a) => sum + (Number(a.calories) || 0), 0);

      // Calculate averages
      const activitiesWithPace = activities.filter(a => a.average_pace != null);
      const avgPace = activitiesWithPace.length > 0
        ? activitiesWithPace.reduce((sum, a) => sum + (Number(a.average_pace) || 0), 0) / activitiesWithPace.length
        : null;

      const activitiesWithHR = activities.filter(a => a.average_heartrate != null);
      const avgHeartRate = activitiesWithHR.length > 0
        ? Math.round(activitiesWithHR.reduce((sum, a) => sum + (Number(a.average_heartrate) || 0), 0) / activitiesWithHR.length)
        : null;

      // Calculate streaks
      const runDates = activities.map(a => new Date(a.start_date));
      const { currentStreak, longestStreak } = calculateStreaks(runDates);

      return {
        totalDistance,
        totalRuns,
        totalElevation,
        totalCalories,
        avgPace,
        avgHeartRate,
        currentStreak,
        longestStreak,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
