import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";

export function useTrainingPlans() {
  return useQuery({
    queryKey: ['training-plans'],
    queryFn: async () => {
      return api.get('/api/training');
    },
  });
}
