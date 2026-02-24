import { useEffect } from "react";
import { api } from "@/integrations/supabase/client";

/**
 * Hook to handle Capacitor app lifecycle events.
 * Checks if the auth token is still valid when the app resumes from background.
 */
export const useAppLifecycle = () => {
  useEffect(() => {
    let appStateListener: { remove: () => void } | null = null;

    const setupCapacitorListeners = async () => {
      try {
        const { App } = await import("@capacitor/app");

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
      } catch (error) {
        // Capacitor not available (running in browser)
        // Silent fail - this is expected in web mode
      }
    };

    setupCapacitorListeners();

    return () => {
      if (appStateListener) {
        appStateListener.remove();
      }
    };
  }, []);
};

export default useAppLifecycle;
