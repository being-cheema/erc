import { motion } from "framer-motion";
import { TrendingUp, Footprints, Zap, Award, Timer, Flame, Heart, Mountain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAllTimeStats } from "@/hooks/useAllTimeStats";
import { formatPace } from "@/hooks/useActivities";
import MonthComparison from "./MonthComparison";

const OverviewTab = () => {
  const { data: stats } = useAllTimeStats();

  const totalDistance = stats?.totalDistance || 0;
  const totalRuns = stats?.totalRuns || 0;
  const currentStreak = stats?.currentStreak || 0;
  const longestStreak = stats?.longestStreak || 0;
  const avgPace = stats?.avgPace || null;
  const avgHeartRate = stats?.avgHeartRate || null;
  const totalElevation = stats?.totalElevation || 0;
  const totalCalories = stats?.totalCalories || 0;

  const statCards = [
    {
      label: "Total Distance",
      value: `${(Number(totalDistance) / 1000).toFixed(1)}`,
      unit: "km",
      icon: TrendingUp,
      gradient: "gradient-primary",
    },
    {
      label: "Total Runs",
      value: `${totalRuns}`,
      unit: "runs",
      icon: Footprints,
      gradient: "bg-success",
    },
    {
      label: "Current Streak",
      value: `${currentStreak}`,
      unit: "days",
      icon: Zap,
      gradient: "bg-warning",
    },
    {
      label: "Longest Streak",
      value: `${longestStreak}`,
      unit: "days",
      icon: Award,
      gradient: "gradient-gold",
    },
    {
      label: "Avg Pace",
      value: formatPace(avgPace),
      unit: "/km",
      icon: Timer,
      gradient: "bg-accent",
    },
    {
      label: "Avg Heart Rate",
      value: avgHeartRate ? `${avgHeartRate}` : "—",
      unit: "bpm",
      icon: Heart,
      gradient: "bg-destructive",
    },
    {
      label: "Total Elevation",
      value: totalElevation > 1000 ? `${(totalElevation / 1000).toFixed(1)}k` : `${Math.round(totalElevation)}`,
      unit: "m",
      icon: Mountain,
      gradient: "bg-success",
    },
    {
      label: "Calories Burned",
      value: totalCalories > 1000 ? `${(totalCalories / 1000).toFixed(1)}k` : `${totalCalories}`,
      unit: "kcal",
      icon: Flame,
      gradient: "bg-warning",
    },
  ];

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-4">
                <div
                  className={`w-10 h-10 rounded-xl ${stat.gradient} flex items-center justify-center mb-3`}
                >
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                  {stat.label}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground font-sans">
                    {stat.value}
                  </span>
                  <span className="text-muted-foreground text-sm">{stat.unit}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Month Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <MonthComparison />
      </motion.div>
    </>
  );
};

export default OverviewTab;
