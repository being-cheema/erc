import { useQuery } from '@tanstack/react-query';
import { api } from '@/integrations/supabase/client';

export function useCurrentUser() {
  const rawUser = api.getUser();
  // Map to compatible shape (user.id instead of user.user_id)
  const user = rawUser ? { id: rawUser.user_id, email: rawUser.email, role: rawUser.role } : null;
  return { user, isAuthenticated: api.isAuthenticated() };
}

export function useProfile() {
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      return api.get('/api/profiles/me');
    },
    enabled: !!user,
  });
}
