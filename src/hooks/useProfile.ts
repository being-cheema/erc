import { useQuery } from '@tanstack/react-query';
import { api } from '@/integrations/supabase/client';

export function useCurrentUser() {
  const rawUser = api.getUser();
  // Keep both id and user_id for compatibility across existing hooks/pages.
  const user = rawUser ? { id: rawUser.user_id, user_id: rawUser.user_id, email: rawUser.email, role: rawUser.role } : null;
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
