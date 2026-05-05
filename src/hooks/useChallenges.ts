import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/supabase/client';

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  target_value: number;
  target_unit: string;
  start_date: string;
  end_date: string | null;
  count_from: string;
  is_published: boolean;
  participant_count: number;
  my_participation_id: string | null;
  my_progress: number | null;
  my_completed: boolean | null;
  created_at: string;
}

export interface ChallengeDetail extends Challenge {
  my_participation: {
    id: string;
    joined_at: string;
    current_progress: number;
    is_completed: boolean;
    completed_at: string | null;
  } | null;
  leaderboard: {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    current_progress: number;
    is_completed: boolean;
    completed_at: string | null;
    joined_at: string;
  }[];
}

export function useChallenges() {
  return useQuery<Challenge[]>({
    queryKey: ['challenges'],
    queryFn: () => api.get('/api/challenges'),
  });
}

export function useChallengeDetail(id: string) {
  return useQuery<ChallengeDetail>({
    queryKey: ['challenge', id],
    queryFn: () => api.get(`/api/challenges/${id}`),
    enabled: !!id,
  });
}

export function useJoinChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/challenges/${id}/join`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenge'] });
    },
  });
}

export function useLeaveChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/challenges/${id}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenge'] });
    },
  });
}
