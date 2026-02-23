import { useProfile } from "@/hooks/useProfile";
import { useMonthlyDistance } from "@/hooks/useMonthlyStats";
import { Target, TrendingUp, Loader2, Flame, Footprints } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const GoalProgress = () => {
  const { data: profile } = useProfile();
  const { data: monthlyDistance, isLoading } = useMonthlyDistance();
  const navigate = useNavigate();

  const monthlyGoal = (profile?.monthly_distance_goal as number) || 100000;
  const currentMonthlyDistance = monthlyDistance || 0;
  
  const progress = Math.min((currentMonthlyDistance / monthlyGoal) * 100, 100);
  const isGoalMet = progress >= 100;
  const currentStreak = profile?.current_streak || 0;
  const totalRuns = profile?.total_runs || 0;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 min-w-[140px] flex items-center justify-center h-24">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  const stats = [
    {
      label: "Dis.Month",
      value: `${(currentMonthlyDistance / 1000).toFixed(1)}`,
      unit: "km",
      icon: isGoalMet ? TrendingUp : Target,
      color: isGoalMet ? "text-success" : "text-primary",
      bgColor: isGoalMet ? "bg-success/15" : "bg-primary/15",
      progress: progress,
    },
    {
      label: "Streak",
      value: `${currentStreak}`,
      unit: "Days",
      icon: Flame,
      color: "text-orange-400",
      bgColor: "bg-orange-400/15",
    },
    {
      label: "Total Runs",
      value: `${totalRuns}`,
      unit: "",
      icon: Footprints,
      color: "text-blue-400",
      bgColor: "bg-blue-400/15",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + index * 0.08 }}
            className="glass-card p-4 min-w-[140px] flex-1 press-scale cursor-pointer"
            onClick={() => navigate("/stats")}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-foreground tracking-tight">
                {stat.value}
              </span>
              {stat.unit && (
                <span className="text-xs font-medium text-muted-foreground">
                  {stat.unit}
                </span>
              )}
            </div>
            {stat.progress !== undefined && (
              <div className="mt-2 h-1 bg-white/5 rounded-full w-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isGoalMet ? "bg-success" : "bg-primary"}`}
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default GoalProgress;
