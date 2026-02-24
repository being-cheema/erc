import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useProfile";

export function useUserRank() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ['user-rank', user?.user_id],
    queryFn: async () => {
      return api.get('/api/leaderboard/me');
    },
    enabled: !!user,
  });
}
