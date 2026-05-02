import { motion } from "framer-motion";
import { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { Link as LinkIcon, LogOut, BarChart3, Trophy, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StravaIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
  <svg ref={ref} viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" {...props}>
    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
  </svg>
));
StravaIcon.displayName = "StravaIcon";

const ConnectStrava = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const token = api.getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strava-auth?action=authorize&redirect_uri=${encodeURIComponent(redirectUri)}`;

      const response = await fetch(functionUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to start Strava connection");
        setIsLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/home");
  };

  const handleLogout = () => {
    api.setToken("");
    api.setRefreshToken("");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 safe-area-inset-top">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm mx-auto"
        >
          <div className="glass-card p-8 space-y-8">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex justify-center"
            >
              <img src={logo} alt="Erode Runners Club" className="h-20 w-auto object-contain" />
            </motion.div>

            {/* Strava Icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex justify-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-strava/10 border border-strava/30 flex items-center justify-center">
                <StravaIcon className="w-10 h-10 text-strava" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-center space-y-3"
            >
              <h2 className="text-2xl font-bold text-foreground">Connect Strava</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Link your Strava account to sync your runs, track stats, and compete on the leaderboard.
              </p>
            </motion.div>

            {/* Connect Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="space-y-3"
            >
              <Button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full h-14 text-base font-bold uppercase tracking-wide bg-strava hover:bg-strava-dark text-white rounded-xl disabled:opacity-50 transition-all gap-2"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                  />
                ) : (
                  <>
                    <LinkIcon className="w-5 h-5" />
                    Connect with Strava
                  </>
                )}
              </Button>

              <button
                onClick={handleSkip}
                className="w-full text-sm text-muted-foreground hover:text-foreground font-medium transition-colors py-2"
              >
                Skip for now
              </button>

              {error && (
                <p className="text-sm text-center text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  {error}
                </p>
              )}
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="space-y-3"
            >
              {[
                { icon: BarChart3, text: "Auto-sync all your running activities" },
                { icon: Trophy, text: "Compete on the club leaderboard" },
                { icon: Flame, text: "Track streaks, achievements & stats" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-strava shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Logout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center mt-4"
          >
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-3 h-3" /> Log out
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ConnectStrava;
