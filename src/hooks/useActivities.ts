import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";
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
  kudos_count: number | null;
  achievement_count: number | null;
  description: string | null;
  workout_type: number | null;
  gear_id: string | null;
  created_at: string;
}

export function useActivities(limit?: number) {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ['activities', user?.user_id, limit],
    queryFn: async () => {
      const params = limit ? `?limit=${limit}` : '';
      return api.get<Activity[]>(`/api/activities${params}`);
    },
    enabled: !!user,
  });
}

export function useRecentActivities(limit: number = 15) {
  return useActivities(limit);
}

export function useAllActivities() {
  return useActivities();
}

export function useMonthActivities() {
  const { user } = useCurrentUser();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return useQuery({
    queryKey: ['activities', 'monthly', user?.user_id],
    queryFn: async () => {
      return api.get<Activity[]>(`/api/activities?after=${startOfMonth.toISOString()}`);
    },
    enabled: !!user,
  });
}

// Alias used by some components
export const useMonthlyActivities = useMonthActivities;

// ── Utility functions ──
export function formatPace(paceInSecondsPerKm: number | null | undefined): string {
  if (!paceInSecondsPerKm || paceInSecondsPerKm <= 0) return '--:--';
  const minutes = Math.floor(paceInSecondsPerKm / 60);
  const seconds = Math.round(paceInSecondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);
  if (hours > 0) return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function useWeeklyStats() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ['activities', 'weekly', user?.user_id],
    queryFn: async () => {
      return api.get(`/api/activities/weekly`);
    },
    enabled: !!user,
  });
}
