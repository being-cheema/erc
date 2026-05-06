import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";

export function useMyPRs() {
  return useQuery({
    queryKey: ['personal-records', 'me'],
    queryFn: () => api.get('/api/personal-records/me'),
  });
}

export function useClubPRs() {
  return useQuery({
    queryKey: ['personal-records', 'club'],
    queryFn: () => api.get('/api/personal-records/club'),
  });
}

export function useScanPRs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/api/personal-records/scan'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personal-records'] });
    },
  });
}
