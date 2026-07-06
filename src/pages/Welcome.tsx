import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

// Slim native onboarding screen (Q12) — no marketing content, no download
// buttons. Web users keep the full /landing page.
const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 safe-area-inset-top">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm mx-auto"
        >
          <div className="glass-card p-8 space-y-8 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex justify-center"
            >
              <img src={logo} alt="Erode Runners Club" className="h-24 w-auto object-contain" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-3"
            >
              <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground leading-none">
                Run to Live.
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Track your runs, climb the leaderboard, and earn achievements with Erode Runners Club.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-3"
            >
              <Button
                onClick={() => navigate("/signup")}
                className="w-full h-14 text-base font-bold uppercase tracking-wide bg-strava hover:bg-strava-dark text-white rounded-xl transition-all"
              >
                Sign up
              </Button>
              <Button
                onClick={() => navigate("/login")}
                variant="outline"
                className="w-full h-12 text-sm font-bold uppercase tracking-wide rounded-xl border-border/50"
              >
                Log in
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="py-6 safe-area-inset-bottom text-center"
      >
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Erode Runners Club
        </p>
      </motion.div>
    </div>
  );
};

export default Welcome;
