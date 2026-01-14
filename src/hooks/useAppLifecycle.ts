import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to handle Capacitor app lifecycle events.
 * Refreshes the auth session when the app resumes from background.
 */
export const useAppLifecycle = () => {
  useEffect(() => {
    let appStateListener: { remove: () => void } | null = null;

    const setupCapacitorListeners = async () => {
      try {
        // Dynamically import Capacitor App plugin
        const { App } = await import("@capacitor/app");

        appStateListener = await App.addListener("appStateChange", async ({ isActive }) => {
          if (isActive) {
            // App came back to foreground - refresh session
            console.log("App resumed, refreshing session...");
            const { data, error } = await supabase.auth.refreshSession();
            if (error) {
              console.error("Failed to refresh session:", error);
            } else if (data.session) {
              console.log("Session refreshed successfully");
            }
          }
        });
      } catch (error) {
        // Capacitor not available (running in browser)
        console.log("Capacitor App plugin not available - running in web mode");
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
