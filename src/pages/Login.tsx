import { motion } from "framer-motion";
import { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

const StravaIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 24 24"
    className="w-5 h-5"
    fill="currentColor"
    {...props}
  >
    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
  </svg>
));
StravaIcon.displayName = "StravaIcon";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStravaLogin = async () => {
    setIsLoading(true);
    try {
      const isNative = Capacitor.isNativePlatform();
      const redirectUri = isNative
        ? `${import.meta.env.VITE_SUPABASE_URL}/auth/strava/callback`
        : `${window.location.origin}/auth/callback`;

      // Generate a random state ID for the polling flow (native only)
      const stateId = isNative ? crypto.randomUUID() : '';
      const stateParam = stateId ? `&state=${stateId}` : '';
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strava-auth?action=authorize&redirect_uri=${encodeURIComponent(redirectUri)}${stateParam}`;

      const response = await fetch(functionUrl);
      const data = await response.json();

      if (data.url) {
        if (isNative) {
          console.log("Opening in-app browser (native):", data.url);
          try {
            await Browser.open({ url: data.url });
          } catch (browserError) {
            console.error("Browser.open failed:", browserError);
            window.open(data.url, "_system");
          }

          // Poll the server for the token — no deep link dependency
          const pollUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strava-auth/poll?state=${stateId}`;
          const maxAttempts = 120; // 3 minutes max (120 * 1.5s)
          let attempts = 0;

          const pollInterval = setInterval(async () => {
            attempts++;
            try {
              const pollRes = await fetch(pollUrl);
              const pollData = await pollRes.json();

              if (pollData.ready && pollData.token) {
                clearInterval(pollInterval);
                api.setToken(pollData.token);
                try { await Browser.close(); } catch { /* may already be closed */ }
                setIsLoading(false);
                window.location.href = "/home";
              }
            } catch {
              // Network error, keep polling
            }

            if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setIsLoading(false);
              console.error("Polling timed out");
            }
          }, 1500);
        } else {
          window.location.href = data.url;
        }
      } else {
        console.error("No auth URL received:", data.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center px-6 safe-area-inset-top">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm mx-auto"
        >
          <div className="glass-card p-8 space-y-10">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex justify-center"
            >
              <img
                src={logo}
                alt="Erode Runners Club"
                className="h-24 w-auto object-contain"
              />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center space-y-4"
            >
              <h1 className="text-6xl font-black uppercase tracking-tighter text-foreground leading-none">
                Run to Live.
              </h1>
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Erode Runners Club
              </p>
              <p className="text-base text-muted-foreground font-medium">
                Track your runs. Compete with the community.
              </p>
            </motion.div>

            {/* Login Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="space-y-4"
            >
              <Button
                onClick={handleStravaLogin}
                disabled={isLoading}
                className="w-full h-16 text-base font-bold uppercase tracking-wide bg-strava hover:bg-strava-dark text-white rounded-xl disabled:opacity-50 transition-all"
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
                    <span className="ml-2">Connect with Strava</span>
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground leading-relaxed">
                We sync your runs from Strava to show stats and rankings.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="py-6 safe-area-inset-bottom"
      >
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-widest">Powered by</span>
          <div className="flex items-center gap-1 text-strava">
            <StravaIcon />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
