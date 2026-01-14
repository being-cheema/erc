import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useRecentActivities } from "@/hooks/useActivities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame } from "lucide-react";
import { format } from "date-fns";

const CaloriesChart = () => {
  const { data: activities, isLoading } = useRecentActivities();

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Get activities and calculate cumulative calories
  const caloriesData = activities
    ?.filter((a) => a.calories && a.calories > 0)
    .slice(0, 10)
    .reverse()
    .reduce((acc: { date: string; calories: number; cumulative: number; name: string }[], a, i) => {
      const prev = i > 0 ? acc[i - 1].cumulative : 0;
      acc.push({
        date: format(new Date(a.start_date), "M/d"),
        calories: a.calories,
        cumulative: prev + a.calories,
        name: a.name || "Run",
      });
      return acc;
    }, []) || [];

  const hasData = caloriesData.length > 0;

  // Calculate total calories
  const totalCalories = hasData
    ? caloriesData[caloriesData.length - 1].cumulative
    : 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Flame className="w-4 h-4 text-warning" />
            Calories Burned
          </CardTitle>
          {hasData && (
            <span className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{totalCalories.toLocaleString()} kcal</span>
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={caloriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()} kcal`,
                    name === "cumulative" ? "Total" : "This Run",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="hsl(var(--warning))"
                  strokeWidth={2}
                  fill="url(#caloriesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center">
            <Flame className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">No calorie data yet</p>
            <p className="text-muted-foreground text-xs mt-1">
              Start running to burn calories!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CaloriesChart;
