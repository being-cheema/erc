import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useRecentActivities } from "@/hooks/useActivities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Mountain } from "lucide-react";
import { format } from "date-fns";

const ElevationChart = () => {
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

  // Get activities with elevation and reverse for chronological order
  const elevationData = activities
    ?.filter((a) => a.elevation_gain && a.elevation_gain > 0)
    .slice(0, 10)
    .reverse()
    .map((a) => ({
      date: format(new Date(a.start_date), "M/d"),
      elevation: Math.round(a.elevation_gain),
      distance: (a.distance / 1000).toFixed(1),
      name: a.name,
    })) || [];

  const hasData = elevationData.length > 0;

  // Calculate total elevation
  const totalElevation = hasData
    ? elevationData.reduce((sum, a) => sum + a.elevation, 0)
    : 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Mountain className="w-4 h-4 text-success" />
            Elevation Gain
          </CardTitle>
          {hasData && (
            <span className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{totalElevation}m</span>
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={elevationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  tickFormatter={(value) => `${value}m`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  formatter={(value: number) => [`${value}m`, "Elevation"]}
                  labelFormatter={(label) => `Run on ${label}`}
                />
                <Bar
                  dataKey="elevation"
                  fill="hsl(var(--success))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center">
            <Mountain className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">No elevation data yet</p>
            <p className="text-muted-foreground text-xs mt-1">
              Run some hills!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ElevationChart;
