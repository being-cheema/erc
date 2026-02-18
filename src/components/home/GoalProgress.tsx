import { Progress } from "@/components/ui/progress";
import { useProfile } from "@/hooks/useProfile";
import { useMonthlyDistance } from "@/hooks/useMonthlyStats";
import { Target, TrendingUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const GoalProgress = () => {
  const { data: profile } = useProfile();
  const { data: monthlyDistance, isLoading } = useMonthlyDistance();
  const navigate = useNavigate();

  // Default goal is 100km (100000 meters)
  const monthlyGoal = (profile?.monthly_distance_goal as number) || 100000;
  const currentMonthlyDistance = monthlyDistance || 0;
  
  const progress = Math.min((currentMonthlyDistance / monthlyGoal) * 100, 100);
  const remaining = Math.max(monthlyGoal - currentMonthlyDistance, 0);
  const isGoalMet = progress >= 100;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="bg-card border border-border p-5">
          <div className="flex items-center justify-center h-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div 
        className={`bg-card border p-5 press-scale cursor-pointer ${
          isGoalMet ? "border-success" : "border-border"
        }`}
        onClick={() => navigate("/stats")}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 flex items-center justify-center ${
              isGoalMet ? "bg-success" : "bg-primary"
            }`}>
              {isGoalMet ? (
                <TrendingUp className="w-5 h-5 text-white" />
              ) : (
                <Target className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Monthly Goal
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-black ${
              isGoalMet ? "text-success" : "text-primary"
            }`}>
              {progress.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-4xl font-black text-foreground tracking-tight">
            {(currentMonthlyDistance / 1000).toFixed(1)}
          </span>
          <span className="text-muted-foreground text-sm font-bold">
            / {(monthlyGoal / 1000).toFixed(0)} KM
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-secondary w-full">
          <div 
            className={`h-full transition-all duration-500 ${isGoalMet ? "bg-success" : "bg-primary"}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Footer text */}
        <div className="mt-3">
          {!isGoalMet && (
            <p className="text-xs text-muted-foreground font-medium">
              {(remaining / 1000).toFixed(1)} km remaining
            </p>
          )}
          {isGoalMet && (
            <p className="text-xs text-success font-bold uppercase tracking-widest">
              Goal Achieved
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default GoalProgress;
