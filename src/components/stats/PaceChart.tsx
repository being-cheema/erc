import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { useRecentActivities, formatPace } from "@/hooks/useActivities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Gauge, TrendingDown } from "lucide-react";
import { format } from "date-fns";

const PaceChart = () => {
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

  // Get activities with pace and reverse for chronological order
  const paceData = activities
    ?.filter((a) => a.average_pace && a.average_pace > 0)
    .slice(0, 10)
    .reverse()
    .map((a) => ({
      date: format(new Date(a.start_date), "M/d"),
      pace: Math.round((a.average_pace || 0) / 60 * 100) / 100, // Convert to minutes decimal
      paceFormatted: formatPace(a.average_pace),
      distance: (a.distance / 1000).toFixed(1),
      name: a.name,
    })) || [];

  const hasData = paceData.length > 0;

  // Calculate average pace
  const avgPaceMinutes = hasData
    ? paceData.reduce((sum, a) => sum + a.pace, 0) / paceData.length
    : 0;

  // Check if pace is improving (lower is better)
  const isImproving = hasData && paceData.length >= 2
    ? paceData[paceData.length - 1].pace < paceData[0].pace
    : false;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Gauge className="w-4 h-4 text-accent" />
            Pace Trends
          </CardTitle>
          {hasData && (
            <div className="flex items-center gap-2">
              {isImproving && (
                <span className="text-xs text-success flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  Improving!
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                Avg: <span className="font-semibold text-foreground">{formatPace(avgPaceMinutes * 60)}/km</span>
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={paceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={["dataMin - 0.5", "dataMax + 0.5"]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${Math.floor(value)}:${String(Math.round((value % 1) * 60)).padStart(2, '0')}`}
                  reversed // Lower pace is better, show at top
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    props.payload.paceFormatted + "/km",
                    "Pace",
                  ]}
                  labelFormatter={(label, payload) => 
                    payload?.[0]?.payload?.name || `Run on ${label}`
                  }
                />
                <ReferenceLine
                  y={avgPaceMinutes}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                <Line
                  type="monotone"
                  dataKey="pace"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--accent))", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center">
            <Gauge className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">No pace data yet</p>
            <p className="text-muted-foreground text-xs mt-1">
              Complete some runs to see trends
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaceChart;
