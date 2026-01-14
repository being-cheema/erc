import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecentActivities, formatPace, formatDuration } from "@/hooks/useActivities";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { MapPin, Clock, Gauge, Heart, Mountain, Flame } from "lucide-react";

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
                className="p-3 rounded-lg bg-muted/50 border border-border/30"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {activity.name || "Run"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.start_date), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground text-lg">
                      {(activity.distance / 1000).toFixed(2)} km
                    </p>
                  </div>
                </div>
                
                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-border/30">
                  <div className="flex flex-col items-center">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground mb-0.5" />
                    <span className="text-xs font-medium text-foreground">{formatDuration(activity.moving_time)}</span>
                    <span className="text-[10px] text-muted-foreground">Duration</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Gauge className="w-3.5 h-3.5 text-muted-foreground mb-0.5" />
                    <span className="text-xs font-medium text-foreground">{formatPace(activity.average_pace)}</span>
                    <span className="text-[10px] text-muted-foreground">Pace</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Heart className="w-3.5 h-3.5 text-muted-foreground mb-0.5" />
                    <span className="text-xs font-medium text-foreground">
                      {activity.average_heartrate ? `${activity.average_heartrate}` : "—"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Avg HR</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Mountain className="w-3.5 h-3.5 text-muted-foreground mb-0.5" />
                    <span className="text-xs font-medium text-foreground">
                      {activity.elevation_gain ? `${Math.round(activity.elevation_gain)}m` : "—"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Elev</span>
                  </div>
                </div>

                {/* Extra stats if available */}
                {(activity.calories > 0 || activity.kudos_count > 0) && (
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {activity.calories > 0 && (
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        {activity.calories} cal
                      </span>
                    )}
                    {activity.kudos_count > 0 && (
                      <span>👏 {activity.kudos_count} kudos</span>
                    )}
                    {activity.achievement_count > 0 && (
                      <span>🏆 {activity.achievement_count} achievements</span>
                    )}
                  </div>
                )}
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
