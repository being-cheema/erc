import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useProfile";

export function useMonthlyDistance() {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["monthlyDistance", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data, error } = await supabase
        .from("activities")
        .select("distance")
        .eq("user_id", user.id)
        .gte("start_date", startOfMonth.toISOString());

      if (error) throw error;

      const totalDistance = (data || []).reduce(
        (sum, activity) => sum + (Number(activity.distance) || 0),
        0
      );

      return totalDistance;
    },
    enabled: !!user?.id,
  });
}

export function useMonthlyLeaderboardEntry() {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["monthlyLeaderboardEntry", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const now = new Date();
      const { data, error } = await supabase
        .from("monthly_leaderboard")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", now.getMonth() + 1)
        .eq("year", now.getFullYear())
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}
