import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";

export function useStreakCalendar(year?: number) {
  const y = year || new Date().getFullYear();
  return useQuery({
    queryKey: ['streak-calendar', y],
    queryFn: () => api.get(`/api/streak-calendar?year=${y}`),
  });
}
