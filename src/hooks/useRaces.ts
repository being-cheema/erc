import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";

export interface Race {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  race_date: string;
  distance_type: string;
  registration_url: string | null;
  image_url: string | null;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  participant_count?: number;
}

export function useRaces() {
  return useQuery({
    queryKey: ['races'],
    queryFn: async () => {
      return api.get<Race[]>('/api/races');
    },
  });
}

export function useMyRegistrations() {
  return useQuery({
    queryKey: ['races', 'my-registrations'],
    queryFn: async () => {
      return api.get<string[]>('/api/races/my-registrations');
    },
    enabled: api.isAuthenticated(),
  });
}

export function useRegisterForRace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (raceId: string) => {
      return api.post(`/api/races/${raceId}/register`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
      queryClient.invalidateQueries({ queryKey: ['races', 'my-registrations'] });
    },
  });
}

export function useUnregisterFromRace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (raceId: string) => {
      return api.delete(`/api/races/${raceId}/register`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
      queryClient.invalidateQueries({ queryKey: ['races', 'my-registrations'] });
    },
  });
}
