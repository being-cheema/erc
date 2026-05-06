import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";

export function useGroupRuns() {
  return useQuery({
    queryKey: ['group-runs'],
    queryFn: () => api.get('/api/group-runs'),
  });
}

export function useGroupRunDetail(id: string) {
  return useQuery({
    queryKey: ['group-runs', id],
    queryFn: () => api.get(`/api/group-runs/${id}`),
    enabled: !!id,
  });
}

export function useRsvpGroupRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.post(`/api/group-runs/${id}/rsvp`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-runs'] });
    },
  });
}

export function useCheckinGroupRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, user_id }: { id: string; user_id?: string }) =>
      api.post(`/api/group-runs/${id}/checkin`, { user_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-runs'] });
    },
  });
}
