import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useProfile";

export const useUserRank = () => {
  const { data: user } = useCurrentUser();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return useQuery({
    queryKey: ["userRank", user?.id, year, month],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("monthly_leaderboard")
        .select("rank, rank_change")
        .eq("user_id", user.id)
        .eq("year", year)
        .eq("month", month)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};
