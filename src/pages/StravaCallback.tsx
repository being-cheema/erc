import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, CheckCircle2, TrendingUp, Trophy, XCircle, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

type SyncStep = "auth" | "syncing" | "calculating" | "achievements" | "complete" | "error";

interface SyncState {
  step: SyncStep;
  message: string;
  activitiesFound?: number;
  progress?: number;
  errorDetails?: string;
}

const StravaCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [syncState, setSyncState] = useState<SyncState>({
    step: "auth",
    message: "Connecting to Strava...",
  });
  const [canRetry, setCanRetry] = useState(false);
  const processedCode = useRef<string | null>(null);
  const isProcessing = useRef(false);

  const handleCallback = useCallback(async () => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const source = searchParams.get("source");

    // When running inside the in-app browser after a native Strava redirect,
    // bounce back to the app via the custom URL scheme so the native WebView handles the callback.
    if (source === "native" && code) {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) {
        window.location.href = `eroderunners://auth/callback?code=${encodeURIComponent(code)}`;
        return;
      }
    }

    // Prevent double processing - Strava codes are single-use
    if (isProcessing.current) {
      console.log("Already processing, skipping...");
      return;
    }

    if (processedCode.current === code) {
      console.log("Code already processed, skipping...");
      return;
    }

    if (error) {
      setSyncState({
        step: "error",
        message: "Authorization was denied",
        errorDetails: "Please try logging in again.",
      });
      setCanRetry(true);
      return;
    }

    if (!code) {
      setSyncState({
        step: "error",
        message: "No authorization code received",
        errorDetails: "Please try logging in again.",
      });
      setCanRetry(true);
      return;
    }

    // Mark as processing immediately
    isProcessing.current = true;
    processedCode.current = code;

    try {
      setSyncState({ step: "auth", message: "Exchanging tokens...", progress: 10 });

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strava-auth?action=callback&code=${code}`;
      const callbackResponse = await fetch(functionUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!callbackResponse.ok) {
        const errorData = await callbackResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${callbackResponse.status}`);
      }

      const data = await callbackResponse.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setSyncState({ step: "auth", message: "Signing you in...", progress: 20 });

      // Use the token to verify and create session
      if (data.token) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: data.token,
          type: "magiclink",
        });

        if (verifyError) {
          console.error("Verify error:", verifyError);
          // Don't fail completely - user might still be created
        }
      }

      const athleteName = data.athlete?.firstname || "Runner";
      const userId = data.user_id;

      // Now trigger sync to check if data needs to be fetched
      setSyncState({
        step: "syncing",
        message: `Welcome, ${athleteName}! Syncing your activities...`,
        progress: 30,
      });

      try {
        // Get the current session for auth header
        const { data: sessionData } = await supabase.auth.getSession();
        const authToken = sessionData?.session?.access_token;

        const syncUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-strava`;
        const syncResponse = await fetch(syncUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({
            user_id: userId,
          }),
        });

        const syncData = await syncResponse.json();

        if (syncData.synced !== undefined) {
          setSyncState({
            step: "calculating",
            message: `Found ${syncData.synced || 0} runs! Calculating your stats...`,
            activitiesFound: syncData.synced,
            progress: 70,
          });

          await new Promise(resolve => setTimeout(resolve, 800));

          setSyncState({
            step: "complete",
            message: `You're all set, ${athleteName}!`,
            activitiesFound: syncData.synced,
            progress: 100,
          });
        } else if (syncData.success && syncData.results?.[0]) {
          const result = syncData.results[0];
          
          if (result.success) {
            setSyncState({
              step: "calculating",
              message: `Found ${result.activities || 0} runs! Calculating your stats...`,
              activitiesFound: result.activities,
              progress: 70,
            });

            await new Promise(resolve => setTimeout(resolve, 800));

            if (result.newAchievements && result.newAchievements.length > 0) {
              setSyncState({
                step: "achievements",
                message: `🏆 Unlocked ${result.newAchievements.length} achievement${result.newAchievements.length > 1 ? 's' : ''}!`,
                activitiesFound: result.activities,
                progress: 90,
              });
              await new Promise(resolve => setTimeout(resolve, 1500));
            }

            setSyncState({
              step: "complete",
              message: `You're all set, ${athleteName}!`,
              activitiesFound: result.activities,
              progress: 100,
            });
          } else {
            // Sync had an error but auth succeeded - still proceed
            console.warn("Sync warning:", result.error);
            setSyncState({
              step: "complete",
              message: `Welcome, ${athleteName}!`,
              progress: 100,
            });
          }
        } else {
          // No sync data but auth succeeded
          setSyncState({
            step: "complete",
            message: `Welcome, ${athleteName}!`,
            progress: 100,
          });
        }
      } catch (syncError) {
        // Sync failed but auth succeeded - still proceed
        console.error("Sync error:", syncError);
        setSyncState({
          step: "complete",
          message: `Welcome, ${athleteName}!`,
          progress: 100,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 1200));
      navigate("/home");
    } catch (err) {
      console.error("Callback error:", err);
      isProcessing.current = false;
      setSyncState({
        step: "error",
        message: "Connection failed",
        errorDetails: err instanceof Error ? err.message : "Please try again.",
      });
      setCanRetry(true);
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  const handleRetry = () => {
    // Clear the processed code so user can try again
    processedCode.current = null;
    isProcessing.current = false;
    navigate("/login");
  };

  const getIcon = () => {
    switch (syncState.step) {
      case "auth":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent"
          />
        );
      case "syncing":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
          >
            <Activity className="w-8 h-8 text-primary-foreground" />
          </motion.div>
        );
      case "calculating":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
          >
            <TrendingUp className="w-8 h-8 text-primary-foreground" />
          </motion.div>
        );
      case "achievements":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center"
          >
            <Trophy className="w-8 h-8 text-white" />
          </motion.div>
        );
      case "complete":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-full bg-success flex items-center justify-center"
          >
            <CheckCircle2 className="w-8 h-8 text-success-foreground" />
          </motion.div>
        );
      case "error":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center"
          >
            <XCircle className="w-8 h-8 text-destructive-foreground" />
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 max-w-sm w-full"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={syncState.step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-center"
          >
            {getIcon()}
          </motion.div>
        </AnimatePresence>

        <motion.p
          key={syncState.message}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-lg text-foreground font-medium"
        >
          {syncState.message}
        </motion.p>

        {syncState.errorDetails && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground"
          >
            {syncState.errorDetails}
          </motion.p>
        )}

        {syncState.activitiesFound !== undefined && syncState.activitiesFound > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground"
          >
            {syncState.activitiesFound} total runs imported
          </motion.p>
        )}

        {syncState.progress !== undefined && syncState.step !== "error" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            <Progress value={syncState.progress} className="h-2" />
          </motion.div>
        )}

        {syncState.step === "syncing" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-muted-foreground"
          >
            This may take a moment for users with lots of activities...
          </motion.p>
        )}

        {canRetry && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default StravaCallback;
