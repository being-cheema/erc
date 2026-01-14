import { motion } from "framer-motion";
import { Loader2, Activity } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import StatsTabs from "@/components/stats/StatsTabs";
import { Card, CardContent } from "@/components/ui/card";

const Stats = () => {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-area-inset-top pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-4"
      >
        <h1 className="text-2xl font-bold text-foreground">Statistics</h1>
        <p className="text-muted-foreground text-sm">Your running journey in numbers</p>
      </motion.header>

      <div className="px-4 space-y-4">
        {/* Stats Tabs with Charts */}
        <StatsTabs />

        {/* Strava Status */}
        {profile?.strava_id ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-strava/10 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-strava" fill="currentColor">
                      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground font-sans">Strava Connected</h3>
                    <p className="text-muted-foreground text-sm">
                      Your data syncs automatically
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full gradient-primary flex items-center justify-center mb-4 glow-primary">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 font-sans">No Activity Data</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Connect your Strava account to see your running statistics here.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Stats;
