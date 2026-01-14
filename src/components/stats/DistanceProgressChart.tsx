import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { useMonthlyActivities } from "@/hooks/useActivities";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";
import { format, startOfMonth, eachDayOfInterval, endOfMonth } from "date-fns";

const DistanceProgressChart = () => {
  const { data: activities, isLoading } = useMonthlyActivities();
  const { data: profile } = useProfile();

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

  const monthlyGoal = ((profile?.monthly_distance_goal as number) || 100000) / 1000; // Convert to km
  
  // Create daily cumulative distance for the month
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: now });

  let cumulative = 0;
  const progressData = daysInMonth.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayActivities = activities?.filter(
      (a) => format(new Date(a.start_date), "yyyy-MM-dd") === dayStr
    ) || [];
    
    const dayDistance = dayActivities.reduce((sum, a) => sum + a.distance, 0) / 1000;
    cumulative += dayDistance;

    return {
      date: format(day, "d"),
      distance: Math.round(cumulative * 10) / 10,
      dayDistance: Math.round(dayDistance * 10) / 10,
    };
  });

  const hasData = cumulative > 0;
  const progressPercent = Math.round((cumulative / monthlyGoal) * 100);

  // Calculate expected progress line
  const daysElapsed = daysInMonth.length;
  const totalDays = endOfMonth(now).getDate();
  const expectedProgress = (monthlyGoal / totalDays) * daysElapsed;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Monthly Goal Progress
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{cumulative.toFixed(1)}</span>
            <span className="text-muted-foreground"> / {monthlyGoal} km</span>
            <span className={`ml-2 font-semibold ${progressPercent >= 100 ? 'text-success' : 'text-primary'}`}>
              ({progressPercent}%)
            </span>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="distanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, Math.max(monthlyGoal, cumulative + 10)]}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
                formatter={(value: number, name: string) => [
                  `${value} km`,
                  name === "distance" ? "Total" : "This Day",
                ]}
                labelFormatter={(label) => `Day ${label}`}
              />
              <ReferenceLine
                y={monthlyGoal}
                stroke="hsl(var(--success))"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: "Goal",
                  position: "right",
                  fill: "hsl(var(--success))",
                  fontSize: 11,
                }}
              />
              <ReferenceLine
                y={expectedProgress}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <Area
                type="monotone"
                dataKey="distance"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#distanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>Day 1</span>
          <span className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-muted-foreground opacity-50" style={{ borderStyle: 'dashed' }}></span>
              Expected
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-success"></span>
              Goal
            </span>
          </span>
          <span>Day {totalDays}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DistanceProgressChart;
