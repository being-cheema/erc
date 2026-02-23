import { BarChart, Bar, ResponsiveContainer } from "recharts";
import { useMonthlyDistance } from "@/hooks/useMonthlyStats";
import { useWeeklyStats } from "@/hooks/useActivities";
import { useAllTimeStats } from "@/hooks/useAllTimeStats";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Flame, TrendingUp } from "lucide-react";

const BentoStatsGrid = () => {
  const { data: monthlyDistance, isLoading: distLoading } = useMonthlyDistance();
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyStats();
  const { data: allTimeStats, isLoading: statsLoading } = useAllTimeStats();

  const distanceKm = monthlyDistance ? (monthlyDistance / 1000).toFixed(1) : "0";
  const totalCalories = allTimeStats?.totalCalories || 0;
  const monthlyCalories = totalCalories > 0 ? Math.round(totalCalories / Math.max(1, allTimeStats?.totalRuns || 1)) : 0;

  // Get last 7 data points for mini chart
  const miniChartData = weeklyData?.slice(-7).map((d, i) => ({
    day: i,
    value: d.distance,
  })) || [];

  const isLoading = distLoading || weeklyLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Distance Tile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <p className="stat-label">This Month</p>
          </div>
          <p className="text-3xl font-black tracking-tight text-foreground leading-none">
            {distanceKm}
            <span className="text-sm font-bold text-muted-foreground ml-1">km</span>
          </p>
        </div>
        <div className="h-16 mt-2 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={miniChartData} barGap={2}>
              <Bar
                dataKey="value"
                fill="hsl(var(--primary))"
                radius={[999, 999, 999, 999]}
                maxBarSize={12}
                opacity={0.85}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Calories Tile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-4 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="w-3.5 h-3.5 text-primary" />
            <p className="stat-label">Avg Calories</p>
          </div>
          <p className="text-3xl font-black tracking-tight text-foreground leading-none">
            {monthlyCalories.toLocaleString()}
            <span className="text-sm font-bold text-muted-foreground ml-1">kcal</span>
          </p>
        </div>
        {/* Calorie ring visual */}
        <div className="flex items-center justify-center mt-3">
          <div className="relative w-14 h-14">
            <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
              <circle
                cx="28" cy="28" r="22"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="5"
              />
              <circle
                cx="28" cy="28" r="22"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(100, (monthlyCalories / 500) * 100) * 1.38} 138.2`}
              />
            </svg>
            <Flame className="absolute inset-0 m-auto w-4 h-4 text-primary" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BentoStatsGrid;
