import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useProfile } from "@/hooks/useProfile";
import { Target, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const GoalProgress = () => {
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  // Default goal is 100km (100000 meters)
  const monthlyGoal = (profile?.monthly_distance_goal as number) || 100000;
  const currentDistance = profile?.total_distance || 0;
  
  // Calculate based on current month's data from profile
  // Note: In a full implementation, we'd fetch monthly_leaderboard data
  const monthlyDistance = currentDistance; // This would be replaced with actual monthly data
  
  const progress = Math.min((Number(monthlyDistance) / monthlyGoal) * 100, 100);
  const remaining = Math.max(monthlyGoal - Number(monthlyDistance), 0);
  const isGoalMet = progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card 
        className={`border-border/50 cursor-pointer active:scale-[0.99] transition-transform overflow-hidden ${
          isGoalMet ? "border-success/30 bg-success/5" : ""
        }`}
        onClick={() => navigate("/settings")}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isGoalMet ? "bg-success" : "gradient-primary"
            }`}>
              {isGoalMet ? (
                <TrendingUp className="w-5 h-5 text-white" />
              ) : (
                <Target className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Monthly Goal
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">
                  {(Number(monthlyDistance) / 1000).toFixed(1)}
                </span>
                <span className="text-muted-foreground text-sm">
                  / {(monthlyGoal / 1000).toFixed(0)} km
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-lg font-bold ${
                isGoalMet ? "text-success" : "text-primary"
              }`}>
                {progress.toFixed(0)}%
              </span>
            </div>
          </div>

          <Progress 
            value={progress} 
            className={`h-2 ${isGoalMet ? "[&>div]:bg-success" : ""}`}
          />

          {!isGoalMet && (
            <p className="text-xs text-muted-foreground mt-2">
              {(remaining / 1000).toFixed(1)} km to reach your goal
            </p>
          )}
          {isGoalMet && (
            <p className="text-xs text-success font-medium mt-2">
              🎉 Goal achieved! Great work!
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GoalProgress;
