import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useProfile";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface MonthStats {
  distance: number;
  runs: number;
  avgPace: number | null;
}

const MonthComparison = () => {
  const { data: user } = useCurrentUser();

  const { data: comparison, isLoading } = useQuery({
    queryKey: ["monthComparison", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      // Current month activities
      const { data: currentData } = await supabase
        .from("activities")
        .select("distance, moving_time, average_pace")
        .eq("user_id", user.id)
        .gte("start_date", currentMonthStart.toISOString());

      // Last month activities
      const { data: lastData } = await supabase
        .from("activities")
        .select("distance, moving_time, average_pace")
        .eq("user_id", user.id)
        .gte("start_date", lastMonthStart.toISOString())
        .lte("start_date", lastMonthEnd.toISOString());

      const calculateStats = (data: any[]): MonthStats => {
        if (!data || data.length === 0) {
          return { distance: 0, runs: 0, avgPace: null };
        }
        const totalDistance = data.reduce((sum, a) => sum + (a.distance || 0), 0);
        const totalTime = data.reduce((sum, a) => sum + (a.moving_time || 0), 0);
        const avgPace = totalDistance > 0 ? (totalTime / (totalDistance / 1000)) : null;
        return {
          distance: totalDistance,
          runs: data.length,
          avgPace,
        };
      };

      return {
        current: calculateStats(currentData || []),
        previous: calculateStats(lastData || []),
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading || !comparison) {
    return null;
  }

  const { current, previous } = comparison;

  const calculateChange = (current: number, previous: number): { value: number; direction: "up" | "down" | "same" } => {
    if (previous === 0) {
      return { value: current > 0 ? 100 : 0, direction: current > 0 ? "up" : "same" };
    }
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change)),
      direction: change > 0 ? "up" : change < 0 ? "down" : "same",
    };
  };

  const distanceChange = calculateChange(current.distance, previous.distance);
  const runsChange = calculateChange(current.runs, previous.runs);

  const metrics = [
    {
      label: "Distance",
      current: `${(current.distance / 1000).toFixed(1)} km`,
      previous: `${(previous.distance / 1000).toFixed(1)} km`,
      change: distanceChange,
    },
    {
      label: "Runs",
      current: `${current.runs}`,
      previous: `${previous.runs}`,
      change: runsChange,
    },
  ];

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          vs Last Month
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-1"
            >
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="text-lg font-bold text-foreground">{metric.current}</p>
              <div className="flex items-center gap-1">
                {metric.change.direction === "up" ? (
                  <TrendingUp className="w-3 h-3 text-success" />
                ) : metric.change.direction === "down" ? (
                  <TrendingDown className="w-3 h-3 text-destructive" />
                ) : (
                  <Minus className="w-3 h-3 text-muted-foreground" />
                )}
                <span
                  className={`text-xs font-medium ${
                    metric.change.direction === "up"
                      ? "text-success"
                      : metric.change.direction === "down"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {metric.change.value}%
                </span>
                <span className="text-xs text-muted-foreground">
                  from {metric.previous}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthComparison;
