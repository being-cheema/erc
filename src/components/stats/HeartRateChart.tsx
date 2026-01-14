import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { useRecentActivities } from "@/hooks/useActivities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart } from "lucide-react";
import { format } from "date-fns";

const HeartRateChart = () => {
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

  // Filter activities with heart rate data and reverse for chronological order
  const hrActivities = activities
    ?.filter((a) => a.average_heartrate)
    .slice(0, 10)
    .reverse()
    .map((a) => ({
      date: format(new Date(a.start_date), "M/d"),
      avgHR: a.average_heartrate,
      maxHR: a.max_heartrate,
      name: a.name,
    })) || [];

  const hasData = hrActivities.length > 0;

  // Calculate average HR across all activities
  const overallAvgHR = hasData
    ? Math.round(hrActivities.reduce((sum, a) => sum + (a.avgHR || 0), 0) / hrActivities.length)
    : 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Heart className="w-4 h-4 text-destructive" />
            Heart Rate Trends
          </CardTitle>
          {hasData && (
            <span className="text-sm text-muted-foreground">
              Avg: <span className="font-semibold text-foreground">{overallAvgHR} bpm</span>
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hrActivities} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={["dataMin - 10", "dataMax + 10"]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} bpm`,
                    name === "avgHR" ? "Avg HR" : "Max HR",
                  ]}
                />
                <ReferenceLine
                  y={overallAvgHR}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                <Line
                  type="monotone"
                  dataKey="avgHR"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--destructive))", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="maxHR"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={1}
                  strokeOpacity={0.4}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center">
            <Heart className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">No heart rate data yet</p>
            <p className="text-muted-foreground text-xs mt-1">
              Wear a HR monitor to track
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HeartRateChart;
