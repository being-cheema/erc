import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useProfile";

export interface Activity {
  id: string;
  user_id: string;
  strava_id: number | null;
  name: string | null;
  distance: number;
  moving_time: number;
  elapsed_time: number | null;
  start_date: string;
  average_pace: number | null;
  average_speed: number | null;
  max_speed: number | null;
  activity_type: string;
  calories: number;
  elevation_gain: number;
  average_heartrate: number | null;
  max_heartrate: number | null;
  suffer_score: number | null;
  kudos_count: number;
  achievement_count: number;
  description: string | null;
  workout_type: number | null;
  gear_id: string | null;
  created_at: string;
}

export function useActivities(limit?: number) {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["activities", user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!user?.id,
  });
}

export function useRecentActivities() {
  return useActivities(5);
}

export function useMonthlyActivities() {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["monthlyActivities", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_date", startOfMonth.toISOString())
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!user?.id,
  });
}

export function useWeeklyStats() {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["weeklyStats", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get last 8 weeks of data for chart
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 56); // 8 weeks back

      const { data, error } = await supabase
        .from("activities")
        .select("distance, start_date")
        .eq("user_id", user.id)
        .gte("start_date", startDate.toISOString())
        .order("start_date", { ascending: true });

      if (error) throw error;

      // Group by week
      const weeklyData: { week: string; distance: number; runs: number }[] = [];
      const weeks = new Map<string, { distance: number; runs: number }>();

      (data as { distance: number; start_date: string }[]).forEach((activity) => {
        const date = new Date(activity.start_date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split("T")[0];

        if (!weeks.has(weekKey)) {
          weeks.set(weekKey, { distance: 0, runs: 0 });
        }
        const week = weeks.get(weekKey)!;
        week.distance += activity.distance;
        week.runs += 1;
      });

      // Convert to array and format
      const sortedWeeks = Array.from(weeks.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-8);

      sortedWeeks.forEach(([weekKey, stats]) => {
        const date = new Date(weekKey);
        const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
        weeklyData.push({
          week: monthDay,
          distance: Math.round(stats.distance / 1000 * 10) / 10,
          runs: stats.runs,
        });
      });

      return weeklyData;
    },
    enabled: !!user?.id,
  });
}

// Format pace as min:sec per km
export function formatPace(paceInSecondsPerKm: number | null): string {
  if (!paceInSecondsPerKm) return "--:--";
  const minutes = Math.floor(paceInSecondsPerKm / 60);
  const seconds = Math.floor(paceInSecondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Format duration as h:mm:ss or mm:ss
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
