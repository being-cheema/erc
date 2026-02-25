import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/integrations/supabase/client";
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

    if (isProcessing.current) return;
    if (processedCode.current === code) return;

    if (error) {
      setSyncState({ step: "error", message: "Authorization was denied", errorDetails: "Please try logging in again." });
      setCanRetry(true);
      return;
    }

    if (!code) {
      setSyncState({ step: "error", message: "No authorization code received", errorDetails: "Please try logging in again." });
      setCanRetry(true);
      return;
    }

    isProcessing.current = true;
    processedCode.current = code;

    try {
      setSyncState({ step: "auth", message: "Exchanging tokens...", progress: 10 });

      // Call our self-hosted API (same paths as Supabase edge functions)
      const callbackResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strava-auth?action=callback&code=${code}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );

      if (!callbackResponse.ok) {
        const errorData = await callbackResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${callbackResponse.status}`);
      }

      const data = await callbackResponse.json();
      if (data.error) throw new Error(data.error);

      setSyncState({ step: "auth", message: "Signing you in...", progress: 20 });

      // Store JWT token (replaces Supabase magic link)
      if (data.token) {
        api.setToken(data.token);
      }

      const athleteName = data.athlete?.firstname || "Runner";
      const userId = data.user_id;
      const isNewUser = data.is_new_user;

      // Show sync screen immediately
      setSyncState({
        step: "syncing",
        message: isNewUser
          ? `Welcome, ${athleteName}! Pulling your activities from Strava...`
          : `Welcome back, ${athleteName}! Refreshing your data...`,
        progress: 25,
      });

      // Fire sync request (fire-and-forget — server also triggers sync during auth)
      const syncUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-strava`;
      fetch(syncUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(data.token ? { Authorization: `Bearer ${data.token}` } : {}),
        },
        body: JSON.stringify({ user_id: userId, force_full_sync: true }),
      }).catch(() => { }); // fire-and-forget

      // Poll for data — wait until activities appear in the DB
      const maxWaitMs = 90_000; // 90 seconds max
      const pollIntervalMs = 3_000;
      const startTime = Date.now();
      let activitiesFound = 0;

      while (Date.now() - startTime < maxWaitMs) {
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

        // Update progress animation
        const elapsed = Date.now() - startTime;
        const progress = Math.min(25 + (elapsed / maxWaitMs) * 65, 85);
        setSyncState(prev => ({
          ...prev,
          progress,
          message: elapsed > 15_000
            ? `Still syncing... this can take a minute for lots of activities`
            : prev.message,
        }));

        try {
          const profileRes = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/api/profile`,
            { headers: { Authorization: `Bearer ${data.token}` } }
          );
          if (profileRes.ok) {
            const profile = await profileRes.json();
            if (profile.total_runs && profile.total_runs > 0) {
              activitiesFound = profile.total_runs;
              break;
            }
          }
        } catch { /* keep polling */ }
      }

      if (activitiesFound > 0) {
        setSyncState({
          step: "calculating",
          message: `Found ${activitiesFound} runs! Calculating your stats...`,
          activitiesFound,
          progress: 90,
        });
        await new Promise(resolve => setTimeout(resolve, 800));
        setSyncState({
          step: "complete",
          message: `You're all set, ${athleteName}!`,
          activitiesFound,
          progress: 100,
        });
      } else {
        setSyncState({
          step: "complete",
          message: `Welcome, ${athleteName}! Your data is still syncing — it'll appear shortly.`,
          progress: 100,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
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

  useEffect(() => { handleCallback(); }, [handleCallback]);

  const handleRetry = () => {
    processedCode.current = null;
    isProcessing.current = false;
    navigate("/login");
  };

  const getIcon = () => {
    switch (syncState.step) {
      case "auth":
        return (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent" />
        );
      case "syncing":
        return (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Activity className="w-8 h-8 text-primary-foreground" />
          </motion.div>
        );
      case "calculating":
        return (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-primary-foreground" />
          </motion.div>
        );
      case "achievements":
        return (
          <motion.div initial={{ scale: 0 }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </motion.div>
        );
      case "complete":
        return (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-full bg-success flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success-foreground" />
          </motion.div>
        );
      case "error":
        return (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
            <XCircle className="w-8 h-8 text-destructive-foreground" />
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 max-w-sm w-full">
        <AnimatePresence mode="wait">
          <motion.div key={syncState.step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} className="flex justify-center">
            {getIcon()}
          </motion.div>
        </AnimatePresence>
        <motion.p key={syncState.message} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-lg text-foreground font-medium">{syncState.message}</motion.p>
        {syncState.errorDetails && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground">{syncState.errorDetails}</motion.p>
        )}
        {syncState.activitiesFound !== undefined && syncState.activitiesFound > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground">{syncState.activitiesFound} total runs imported</motion.p>
        )}
        {syncState.progress !== undefined && syncState.step !== "error" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
            <Progress value={syncState.progress} className="h-2" />
          </motion.div>
        )}
        {syncState.step === "syncing" && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-xs text-muted-foreground">This may take a moment for users with lots of activities...</motion.p>
        )}
        {canRetry && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" /> Try Again
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default StravaCallback;
