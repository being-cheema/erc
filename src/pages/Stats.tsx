import { motion } from "framer-motion";
import { TrendingUp, Timer, Footprints, Flame, Zap, Award, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";

const Stats = () => {
  const { data: profile, isLoading } = useProfile();

  const totalDistance = profile?.total_distance || 0;
  const totalRuns = profile?.total_runs || 0;
  const currentStreak = profile?.current_streak || 0;
  const longestStreak = profile?.longest_streak || 0;

  const statCards = [
    { 
      label: "Total Distance", 
      value: `${(Number(totalDistance) / 1000).toFixed(1)}`, 
      unit: "km", 
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      label: "Total Runs", 
      value: `${totalRuns}`, 
      unit: "runs", 
      icon: Footprints,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    { 
      label: "Current Streak", 
      value: `${currentStreak}`, 
      unit: "days", 
      icon: Zap,
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    { 
      label: "Longest Streak", 
      value: `${longestStreak}`, 
      unit: "days", 
      icon: Award,
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    },
  ];

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
        <p className="text-muted-foreground">Your running journey in numbers</p>
      </motion.header>

      <div className="px-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-full ${stat.bgColor} flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-muted-foreground text-xs mb-1">{stat.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                    <span className="text-muted-foreground text-sm">{stat.unit}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Strava Status */}
        {profile?.strava_id ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <span className="text-3xl">✓</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Strava Connected</h3>
                <p className="text-muted-foreground text-sm">
                  Your running data is synced from Strava.
                </p>
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
                <div className="w-16 h-16 mx-auto rounded-full bg-[#FC4C02]/10 flex items-center justify-center mb-4">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">No Activity Data</h3>
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
