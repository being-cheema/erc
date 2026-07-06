import { useEffect } from "react";
import { api } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/query-client";
import { App } from "@capacitor/app";

/**
 * Hook to handle Capacitor app lifecycle events.
 * Checks if the auth token is still valid when the app resumes from background.
 */
export const useAppLifecycle = () => {
  useEffect(() => {
    let appStateListener: { remove: () => void } | null = null;
    const publicAuthPrefixes = ["/landing", "/login", "/signup", "/forgot-password", "/reset-password", "/auth/callback"];

    const setupCapacitorListeners = async () => {
      appStateListener = await App.addListener("appStateChange", async ({ isActive }) => {
        if (isActive) {
          const path = window.location.pathname || "/";
          const isPublicAuthRoute = publicAuthPrefixes.some((prefix) => path.startsWith(prefix));
          if (isPublicAuthRoute) return;

          // For signed-out users we allow public routes (e.g., landing/signup/login).
          const token = api.getToken();
          if (!token) return;

          // App came back to foreground — check if token is still valid
          const user = api.getUser();
          if (user) return;

          // Try silent refresh before forcing logout navigation.
          const refreshed = await api.tryRefresh();
          if (refreshed) return;

          api.clearToken();
          // Drop the previous user's cached data before the hard redirect
          queryClient.clear();
          window.location.assign('/login');
        }
      });
    };

    setupCapacitorListeners().catch(() => {
      // Capacitor listener unavailable in non-native contexts.
    });

    return () => {
      if (appStateListener) {
        appStateListener.remove();
      }
    };
  }, []);
};

export default useAppLifecycle;
