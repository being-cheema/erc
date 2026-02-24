import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Target, CheckCircle2, Circle, Loader2, Dumbbell, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";
import { useHaptics } from "@/hooks/useHaptics";
import { toast } from "sonner";

interface TrainingPlan {
  id: string;
  name: string;
  description: string | null;
  level: string;
  duration_weeks: number;
  goal_distance: string;
  weeks: TrainingWeek[];
  userProgress: { workout_id: string; completed_at: string }[];
}

interface TrainingWeek {
  id: string;
  week_number: number;
  focus: string | null;
  workouts: TrainingWorkout[];
}

interface TrainingWorkout {
  id: string;
  day_of_week: number;
  workout_type: string;
  distance_km: number | null;
  duration_minutes: number | null;
  notes: string | null;
}

const dayNames = ["Rest", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const getWorkoutTypeStyle = (type: string) => {
  switch (type.toLowerCase()) {
    case "easy":
      return "bg-success/20 text-success";
    case "tempo":
      return "bg-warning/20 text-warning";
    case "interval":
    case "speed":
      return "bg-destructive/20 text-destructive";
    case "long":
      return "bg-primary/20 text-primary";
    case "rest":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-accent/20 text-accent";
  }
};

const TrainingPlanDetail = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { lightImpact, mediumImpact, notificationSuccess } = useHaptics();
  const [selectedWeek, setSelectedWeek] = useState(1);

  // Fetch plan details with weeks, workouts, and progress in one call
  const { data: plan, isLoading } = useQuery({
    queryKey: ["trainingPlan", planId],
    queryFn: async () => {
      return api.get<TrainingPlan>(`/api/training/${planId}`);
    },
    enabled: !!planId,
  });

  const weeks = plan?.weeks || [];
  const completedWorkoutIds = plan?.userProgress?.map(p => p.workout_id) || [];

  // Toggle workout completion
  const toggleWorkoutMutation = useMutation({
    mutationFn: async (workoutId: string) => {
      const isCompleted = completedWorkoutIds.includes(workoutId);

      if (isCompleted) {
        return api.delete(`/api/training/${planId}/progress/${workoutId}`);
      } else {
        return api.post(`/api/training/${planId}/progress/${workoutId}`);
      }
    },
    onSuccess: (_, workoutId) => {
      const wasCompleted = completedWorkoutIds.includes(workoutId);
      if (!wasCompleted) {
        notificationSuccess();
        toast.success("Workout completed! 💪");
      } else {
        lightImpact();
      }
      queryClient.invalidateQueries({ queryKey: ["trainingPlan", planId] });
    },
  });

  const currentWeek = weeks.find(w => w.week_number === selectedWeek);
  const totalWorkouts = weeks.reduce((sum, w) => sum + w.workouts.filter(wo => wo.workout_type.toLowerCase() !== "rest").length, 0);
  const completedWorkouts = completedWorkoutIds.length;
  const progressPercent = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Training plan not found</p>
        <Button onClick={() => navigate("/training")}>Go back</Button>
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            lightImpact();
            navigate("/training");
          }}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{plan.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={getWorkoutTypeStyle(plan.level)}>
                {plan.level}
              </Badge>
              <span className="text-muted-foreground text-sm flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {plan.duration_weeks} weeks
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-white" />
          </div>
        </div>

        {plan.description && (
          <p className="text-muted-foreground text-sm mt-3">{plan.description}</p>
        )}
      </motion.header>

      <div className="px-4 space-y-4">
        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Your Progress</span>
                <span className="text-sm text-muted-foreground">
                  {completedWorkouts}/{totalWorkouts} workouts
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {progressPercent}% complete
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Week Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        >
          {weeks.map((week) => {
            const weekWorkouts = week.workouts.filter(w => w.workout_type.toLowerCase() !== "rest");
            const weekCompleted = weekWorkouts.filter(w => completedWorkoutIds.includes(w.id)).length;
            const isComplete = weekWorkouts.length > 0 && weekCompleted === weekWorkouts.length;

            return (
              <Button
                key={week.id}
                variant={selectedWeek === week.week_number ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  lightImpact();
                  setSelectedWeek(week.week_number);
                }}
                className={`shrink-0 relative ${selectedWeek === week.week_number ? "" : "border-border/50"
                  }`}
              >
                Week {week.week_number}
                {isComplete && (
                  <CheckCircle2 className="w-3 h-3 ml-1 text-success" />
                )}
              </Button>
            );
          })}
        </motion.div>

        {/* Current Week Workouts */}
        {currentWeek && (
          <motion.div
            key={currentWeek.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Week {currentWeek.week_number}
                </CardTitle>
                {currentWeek.focus && (
                  <p className="text-sm text-muted-foreground">{currentWeek.focus}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {currentWeek.workouts.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">
                    No workouts scheduled for this week
                  </p>
                ) : (
                  currentWeek.workouts.map((workout) => {
                    const isCompleted = completedWorkoutIds.includes(workout.id);
                    const isRest = workout.workout_type.toLowerCase() === "rest";

                    return (
                      <motion.div
                        key={workout.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (!isRest) {
                            mediumImpact();
                            toggleWorkoutMutation.mutate(workout.id);
                          }
                        }}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isRest
                            ? "bg-muted/50 cursor-default"
                            : isCompleted
                              ? "bg-success/10"
                              : "bg-card hover:bg-muted/50"
                          }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isRest
                            ? "bg-muted"
                            : isCompleted
                              ? "bg-success"
                              : "bg-muted"
                          }`}>
                          {isRest ? (
                            <span className="text-lg">😴</span>
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {dayNames[workout.day_of_week]}
                            </span>
                            <Badge variant="outline" className={`text-xs ${getWorkoutTypeStyle(workout.workout_type)}`}>
                              {workout.workout_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {workout.distance_km && (
                              <span className="text-sm font-medium text-foreground">
                                {workout.distance_km} km
                              </span>
                            )}
                            {workout.duration_minutes && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {workout.duration_minutes} min
                              </span>
                            )}
                          </div>
                          {workout.notes && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {workout.notes}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TrainingPlanDetail;
