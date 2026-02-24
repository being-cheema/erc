import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";

export function useBlogPosts() {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      return api.get('/api/blog');
    },
  });
}

export function useBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      return api.get(`/api/blog/${slug}`);
    },
    enabled: !!slug,
  });
}
