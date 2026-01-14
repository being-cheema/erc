import { motion } from "framer-motion";
import { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const StravaIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 24 24"
    className="w-6 h-6"
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
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 safe-area-inset-top safe-area-inset-bottom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Logo & Title */}
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex justify-center"
            >
              <img 
                src={logo} 
                alt="Erode Runners Club" 
                className="h-32 w-auto object-contain drop-shadow-lg"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <p className="text-muted-foreground mt-2 text-lg">Run to Live. Live to Run.</p>
            </motion.div>
          </div>

          {/* Strava Login Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-4"
          >
            <Button
              onClick={handleStravaLogin}
              disabled={isLoading}
              className="w-full h-14 text-base font-semibold bg-strava hover:bg-strava-dark text-white disabled:opacity-50 transition-all"
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

            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              By continuing, you agree to sync your running data from Strava.
              We only access your activity data to show your stats and rankings.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer - Strava branding compliance */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="py-6 text-center relative z-10"
      >
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <span className="text-xs">Powered by</span>
          <div className="flex items-center gap-1 text-strava">
            <StravaIcon />
            <span className="text-xs font-semibold">Strava</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
