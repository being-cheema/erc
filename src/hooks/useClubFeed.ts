import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";

export function useClubFeed(limit: number = 30) {
  return useQuery({
    queryKey: ['club-feed', limit],
    queryFn: () => api.get(`/api/feed?limit=${limit}`),
  });
}
