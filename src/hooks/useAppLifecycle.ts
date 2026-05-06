import { useEffect } from "react";
import { api } from "@/integrations/supabase/client";
import { App } from "@capacitor/app";

/**
 * Hook to handle Capacitor app lifecycle events.
 * Checks if the auth token is still valid when the app resumes from background.
 */
export const useAppLifecycle = () => {
  useEffect(() => {
    let appStateListener: { remove: () => void } | null = null;

    const setupCapacitorListeners = async () => {
      appStateListener = await App.addListener("appStateChange", async ({ isActive }) => {
        if (isActive) {
          // App came back to foreground — check if token is still valid
          const user = api.getUser();
          if (!user) {
            // Token expired or missing — redirect to login
            window.location.href = '/login';
          }
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
