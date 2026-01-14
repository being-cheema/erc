import { motion } from "framer-motion";
import { Loader2, Activity, CheckCircle } from "lucide-react";
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
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Statistics</h1>
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Your running journey</p>
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
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary flex items-center justify-center shrink-0">
                    <CheckCircle className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold uppercase tracking-wide text-foreground text-sm">Strava Connected</h3>
                    <p className="text-muted-foreground text-xs font-medium mt-0.5">
                      Data syncs automatically
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
            <Card className="border-border bg-card">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto bg-primary flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold uppercase tracking-wide text-foreground mb-2 text-sm">No Activity Data</h3>
                <p className="text-muted-foreground text-xs font-medium">
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
