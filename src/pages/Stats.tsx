import { motion } from "framer-motion";
import { TrendingUp, Timer, Footprints, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Stats = () => {
  // Placeholder stats - will be replaced with Strava data
  const stats = {
    totalDistance: 0,
    totalRuns: 0,
    averagePace: "0:00",
    totalCalories: 0,
  };

  const statCards = [
    { 
      label: "Total Distance", 
      value: `${stats.totalDistance}`, 
      unit: "km", 
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      label: "Total Runs", 
      value: `${stats.totalRuns}`, 
      unit: "runs", 
      icon: Footprints,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    { 
      label: "Avg Pace", 
      value: stats.averagePace, 
      unit: "/km", 
      icon: Timer,
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    { 
      label: "Calories Burned", 
      value: `${stats.totalCalories}`, 
      unit: "kcal", 
      icon: Flame,
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    },
  ];

  return (
    <div className="min-h-screen bg-background safe-area-inset-top">
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

        {/* Connect Strava Prompt */}
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
      </div>
    </div>
  );
};

export default Stats;
