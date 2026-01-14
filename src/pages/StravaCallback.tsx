import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, CheckCircle2, Loader2, TrendingUp, Trophy, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type SyncStep = "auth" | "syncing" | "calculating" | "achievements" | "complete" | "error";

interface SyncState {
  step: SyncStep;
  message: string;
  activitiesFound?: number;
  progress?: number;
}

const StravaCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [syncState, setSyncState] = useState<SyncState>({
    step: "auth",
    message: "Connecting to Strava...",
  });
  const syncTriggered = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (syncTriggered.current) return;
      syncTriggered.current = true;

      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        setSyncState({
          step: "error",
          message: "Authorization was denied. Please try again.",
        });
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      if (!code) {
        setSyncState({
          step: "error",
          message: "No authorization code received.",
        });
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      try {
        setSyncState({ step: "auth", message: "Exchanging tokens...", progress: 10 });

        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strava-auth?action=callback&code=${code}`;
        const callbackResponse = await fetch(functionUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await callbackResponse.json();

        if (!callbackResponse.ok || data.error) {
          throw new Error(data.error || "Failed to authenticate");
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
          }
        }

        const athleteName = data.athlete?.firstname || "Runner";

        // Check if this is a new user - need to do full historical sync
        if (data.is_new_user) {
          setSyncState({
            step: "syncing",
            message: `Welcome, ${athleteName}! Fetching your running history...`,
            progress: 30,
          });

          // Trigger full historical sync
          const syncUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-strava`;
          const syncResponse = await fetch(syncUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              initial_sync: true,
              user_id: data.user_id,
            }),
          });

          const syncData = await syncResponse.json();

          if (syncData.success && syncData.results?.[0]) {
            const result = syncData.results[0];
            
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
          }

          setSyncState({
            step: "complete",
            message: `You're all set, ${athleteName}!`,
            progress: 100,
          });

          await new Promise(resolve => setTimeout(resolve, 1200));
          navigate("/home");
        } else {
          // Existing user - just welcome them back
          setSyncState({
            step: "complete",
            message: `Welcome back, ${athleteName}!`,
            progress: 100,
          });

          await new Promise(resolve => setTimeout(resolve, 1200));
          navigate("/home");
        }
      } catch (err) {
        console.error("Callback error:", err);
        setSyncState({
          step: "error",
          message: "Failed to connect. Please try again.",
        });
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

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
            <Activity className="w-8 h-8 text-white" />
          </motion.div>
        );
      case "calculating":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
          >
            <TrendingUp className="w-8 h-8 text-white" />
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
            <CheckCircle2 className="w-8 h-8 text-white" />
          </motion.div>
        );
      case "error":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center"
          >
            <XCircle className="w-8 h-8 text-white" />
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

        {syncState.activitiesFound !== undefined && (
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
      </motion.div>
    </div>
  );
};

export default StravaCallback;
