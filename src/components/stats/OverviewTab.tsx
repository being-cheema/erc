import { motion } from "framer-motion";
import { TrendingUp, Footprints, Zap, Award, Timer, Flame, Heart, Mountain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import { useRecentActivities, formatPace } from "@/hooks/useActivities";
import MonthComparison from "./MonthComparison";

const OverviewTab = () => {
  const { data: profile } = useProfile();
  const { data: activities } = useRecentActivities();

  const totalDistance = profile?.total_distance || 0;
  const totalRuns = profile?.total_runs || 0;
  const currentStreak = profile?.current_streak || 0;
  const longestStreak = profile?.longest_streak || 0;

  // Calculate averages from recent activities
  const activitiesWithPace = activities?.filter(a => a.average_pace) || [];
  const avgPace = activitiesWithPace.length > 0
    ? activitiesWithPace.reduce((sum, a) => sum + (a.average_pace || 0), 0) / activitiesWithPace.length
    : null;

  const activitiesWithHR = activities?.filter(a => a.average_heartrate) || [];
  const avgHeartRate = activitiesWithHR.length > 0
    ? Math.round(activitiesWithHR.reduce((sum, a) => sum + (a.average_heartrate || 0), 0) / activitiesWithHR.length)
    : null;

  // Calculate total elevation and calories from activities
  const totalElevation = activities?.reduce((sum, a) => sum + (a.elevation_gain || 0), 0) || 0;
  const totalCalories = activities?.reduce((sum, a) => sum + (a.calories || 0), 0) || 0;

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
