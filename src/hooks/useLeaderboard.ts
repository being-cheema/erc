import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  total_distance: number;
  total_runs: number;
  rank: number | null;
  rank_change: number | null;
  display_name: string | null;
  avatar_url: string | null;
}

export const useMonthlyLeaderboard = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return useQuery({
    queryKey: ["leaderboard", "monthly", year, month],
    queryFn: async () => {
      // Get leaderboard entries with profile info
      const { data: leaderboard, error: lError } = await supabase
        .from("monthly_leaderboard")
        .select("*")
        .eq("year", year)
        .eq("month", month)
        .order("rank", { ascending: true, nullsFirst: false });

      if (lError) throw lError;

      // Get profile info for all users
      const userIds = leaderboard?.map(l => l.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return leaderboard?.map(entry => ({
        ...entry,
        display_name: profileMap.get(entry.user_id)?.display_name || "Anonymous",
        avatar_url: profileMap.get(entry.user_id)?.avatar_url,
      })) as LeaderboardEntry[];
    },
  });
};

export const useAllTimeLeaderboard = () => {
  return useQuery({
    queryKey: ["leaderboard", "alltime"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, total_distance, total_runs")
        .order("total_distance", { ascending: false, nullsFirst: false })
        .limit(50);

      if (error) throw error;

      return data?.map((p, index) => ({
        id: p.user_id,
        user_id: p.user_id,
        total_distance: p.total_distance || 0,
        total_runs: p.total_runs || 0,
        rank: index + 1,
        rank_change: null,
        display_name: p.display_name || "Anonymous",
        avatar_url: p.avatar_url,
      })) as LeaderboardEntry[];
    },
  });
};
