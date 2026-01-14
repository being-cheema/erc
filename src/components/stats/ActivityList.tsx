import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecentActivities, formatPace, formatDuration } from "@/hooks/useActivities";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { MapPin, Clock, Gauge } from "lucide-react";

const ActivityList = () => {
  const { data: activities, isLoading } = useRecentActivities();

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const hasActivities = activities && activities.length > 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {hasActivities ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/30"
              >
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {activity.name || "Run"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(activity.start_date), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="font-semibold text-foreground text-sm">
                    {(activity.distance / 1000).toFixed(2)} km
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDuration(activity.moving_time)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Gauge className="w-3 h-3" />
                      {formatPace(activity.average_pace)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No activities recorded yet
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Your runs will appear here after syncing with Strava
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityList;
