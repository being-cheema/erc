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

  const distanceKm = monthlyDistance?.totalDistance ? (monthlyDistance.totalDistance / 1000).toFixed(1) : "0";
  const totalCalories = allTimeStats?.totalCalories || 0;
  const monthlyCalories = totalCalories > 0 ? Math.round(totalCalories / Math.max(1, allTimeStats?.totalRuns || 1)) : 0;

  const miniChartData = weeklyData?.slice(-7).map((d, i) => ({
    day: i,
    value: d.distance,
  })) || [];

  const isLoading = distLoading || weeklyLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
    );
  }

  const ringProgress = Math.min(100, (monthlyCalories / 500) * 100);
  const circumference = 2 * Math.PI * 28;
  const strokeDash = (ringProgress / 100) * circumference;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Distance Tile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 flex flex-col justify-between min-h-[170px]"
      >
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="stat-label">This Month</p>
          </div>
          <p className="text-4xl font-black tracking-tight text-foreground leading-none">
            {distanceKm}
            <span className="text-sm font-bold text-muted-foreground ml-1">km</span>
          </p>
        </div>
        <div className="h-16 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={miniChartData} barGap={3}>
              <Bar
                dataKey="value"
                fill="hsl(var(--primary))"
                radius={[999, 999, 999, 999]}
                maxBarSize={14}
                opacity={0.9}
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
        className="glass-card p-4 flex flex-col justify-between min-h-[170px]"
      >
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Flame className="w-4 h-4 text-primary" />
            <p className="stat-label">Avg Calories</p>
          </div>
          <p className="text-4xl font-black tracking-tight text-foreground leading-none">
            {monthlyCalories.toLocaleString()}
            <span className="text-sm font-bold text-muted-foreground ml-1">kcal</span>
          </p>
        </div>
        {/* Calorie ring visual - enlarged */}
        <div className="flex items-center justify-center mt-3">
          <div className="relative w-[72px] h-[72px]">
            <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
              <circle
                cx="36" cy="36" r="28"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="6"
              />
              <circle
                cx="36" cy="36" r="28"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${strokeDash} ${circumference}`}
              />
            </svg>
            <Flame className="absolute inset-0 m-auto w-5 h-5 text-primary" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BentoStatsGrid;
