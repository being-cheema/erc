import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Browser } from "@capacitor/browser";
import { api } from "@/integrations/supabase/client";
import { API_URL } from "@/config";
import { isNativePlatform } from "@/utils/platform";

/**
 * Shared Strava connect flow (F2/F3/F4).
 * - Web: redirects to the Strava authorize URL.
 * - Native: opens the in-app browser and polls the backend with the
 *   SERVER-issued state returned by the authorize endpoint (H4) —
 *   the client never generates its own state.
 */
export function useStravaConnect() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollNativeAuthResult = async (state: string): Promise<boolean> => {
    const maxAttempts = 120;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const pollRes = await fetch(
        `${API_URL}/functions/v1/strava-auth/poll?state=${encodeURIComponent(state)}`
      );
      if (!pollRes.ok) {
        continue;
      }
      const pollData = await pollRes.json();
      if (!pollData.ready) {
        continue;
      }
      if (pollData.token) {
        api.setToken(pollData.token);
      }
      if (pollData.refresh_token) {
        api.setRefreshToken(pollData.refresh_token);
      }
      await Browser.close().catch(() => undefined);
      queryClient.invalidateQueries();
      navigate("/home", { replace: true });
      return true;
    }
    return false;
  };

  const connect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setError(null);

    try {
      const token = api.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const native = isNativePlatform();
      const redirectUri = native
        ? `${API_URL}/auth/strava/callback`
        : `${API_URL}/auth/callback`;

      const functionUrl = `${API_URL}/functions/v1/strava-auth?action=authorize&redirect_uri=${encodeURIComponent(redirectUri)}${native ? "&native=1" : ""}`;

      const response = await fetch(functionUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to start Strava connection");
        setIsConnecting(false);
        return;
      }

      if (data.url) {
        if (native) {
          const pollState = data.state ?? data.poll_state;
          if (!pollState) {
            setError("Strava connection is unavailable right now. Please try again.");
            setIsConnecting(false);
            return;
          }
          await Browser.open({ url: data.url, presentationStyle: "fullscreen" });
          const completed = await pollNativeAuthResult(pollState);
          if (!completed) {
            setError("Strava auth timed out. Please try again.");
            setIsConnecting(false);
          }
          return;
        }
        window.location.href = data.url;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsConnecting(false);
    }
  };

  return { connect, isConnecting, error };
}
