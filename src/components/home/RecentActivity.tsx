import { Card, CardContent } from "@/components/ui/card";
import { useRecentActivities, formatPace, formatDuration } from "@/hooks/useActivities";
import { format } from "date-fns";
import { ChevronRight, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const RecentActivity = () => {
  const { data: activities, isLoading } = useRecentActivities();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasActivities = activities && activities.length > 0;
  const displayActivities = activities?.slice(0, 3) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Card 
        className="border-border/50 cursor-pointer active:scale-[0.99] transition-transform"
        onClick={() => navigate("/stats")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Recent Activity
            </h3>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>

          {hasActivities ? (
            <div className="space-y-2">
              {displayActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.name || "Run"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.start_date), "MMM d")} • {formatPace(activity.average_pace)} /km
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {(activity.distance / 1000).toFixed(1)} km
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDuration(activity.moving_time)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No recent activities
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecentActivity;
