import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";

export function useIsAdmin() {
  const query = useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const data = await api.get('/api/notifications/role');
      return data.role === 'admin';
    },
    enabled: api.isAuthenticated(),
  });

  return {
    isAdmin: query.data === true,
    isLoading: query.isLoading,
  };
}
