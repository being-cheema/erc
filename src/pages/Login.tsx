import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const StravaIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-6 h-6"
    fill="currentColor"
  >
    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
  </svg>
);

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStravaLogin = async () => {
    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strava-auth?action=authorize&redirect_uri=${encodeURIComponent(redirectUri)}`;
      
      const response = await fetch(functionUrl);
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No auth URL received");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to initiate Strava login:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 safe-area-inset-top safe-area-inset-bottom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Logo & Title */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-24 h-24 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center glow-primary"
            >
              <span className="text-4xl">🏃</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h1 className="text-2xl font-bold text-foreground">Erode Runners Club</h1>
              <p className="text-muted-foreground mt-2">Connect with Strava to continue</p>
            </motion.div>
          </div>

          {/* Strava Login Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Button
              onClick={handleStravaLogin}
              disabled={isLoading}
              className="w-full h-14 text-base font-semibold bg-[#FC4C02] hover:bg-[#e64500] text-white disabled:opacity-50"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                />
              ) : (
                <>
                  <StravaIcon />
                  <span className="ml-3">Continue with Strava</span>
                </>
              )}
            </Button>
          </motion.div>

          {/* Info text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center text-xs text-muted-foreground"
          >
            By continuing, you agree to sync your running data from Strava.
            We only access your activity data.
          </motion.p>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="py-6 text-center"
      >
        <p className="text-xs text-muted-foreground">
          Powered by Strava API
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
