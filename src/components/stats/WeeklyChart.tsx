import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useWeeklyStats } from "@/hooks/useActivities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const WeeklyChart = () => {
  const { data: weeklyData, isLoading } = useWeeklyStats();

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

  const hasData = weeklyData && weeklyData.length > 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Weekly Distance</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [`${value} km`, 'Distance']}
                  labelFormatter={(label) => `Week of ${label}`}
                />
                <Bar 
                  dataKey="distance" 
                  fill="hsl(var(--primary))" 
                  radius={[999, 999, 999, 999]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No activity data yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyChart;
