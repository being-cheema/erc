import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";

export function useMyRaceResults() {
  return useQuery({
    queryKey: ['race-results', 'me'],
    queryFn: () => api.get('/api/race-results/me'),
  });
}

export function usePBBoard() {
  return useQuery({
    queryKey: ['race-results', 'pb-board'],
    queryFn: () => api.get('/api/race-results/pb-board'),
  });
}

export function useAddRaceResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      race_name: string;
      race_date: string;
      distance_category: string;
      distance_km?: number;
      finish_time_seconds: number;
      bib_number?: string;
      notes?: string;
    }) => api.post('/api/race-results', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['race-results'] });
    },
  });
}

export function useDeleteRaceResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/race-results/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['race-results'] });
    },
  });
}
