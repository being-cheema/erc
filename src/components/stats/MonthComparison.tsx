import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useProfile";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface MonthStats {
  distance: number; // meters
  runs: number;
  avgPace: number | null; // min/km
}

interface MonthComparisonData {
  current: MonthStats;
  previous: MonthStats;
}

const MonthComparison = () => {
  const { user } = useCurrentUser();

  const { data: comparison, isLoading } = useQuery<MonthComparisonData>({
    queryKey: ["month-comparison", user?.id],
    queryFn: () => api.get("/api/stats/month-comparison"),
    enabled: !!user?.id,
  });

  if (isLoading || !comparison) {
    return null;
  }

  const { current, previous } = comparison;
  const hasPreviousData = (previous?.runs || 0) > 0;

  // Nothing to show at all
  if ((current?.runs || 0) === 0 && !hasPreviousData) {
    return null;
  }

  const calculateChange = (currentValue: number, previousValue: number): { value: number; direction: "up" | "down" | "same" } => {
    if (previousValue === 0) {
      return { value: currentValue > 0 ? 100 : 0, direction: currentValue > 0 ? "up" : "same" };
    }
    const change = ((currentValue - previousValue) / previousValue) * 100;
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
              {hasPreviousData ? (
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
              ) : (
                <p className="text-xs text-muted-foreground">No runs last month</p>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthComparison;
