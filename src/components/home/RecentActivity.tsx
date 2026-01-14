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
      <div className="bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
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
      <div 
        className="bg-card border border-border p-5 press-scale cursor-pointer"
        onClick={() => navigate("/stats")}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Recent Activity
          </h3>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>

        {hasActivities ? (
          <div className="space-y-3">
            {displayActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-3 bg-secondary/50"
              >
                <div className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate uppercase tracking-wide">
                    {activity.name || "Run"}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {format(new Date(activity.start_date), "MMM d")} • {formatPace(activity.average_pace)} /km
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-foreground">
                    {(activity.distance / 1000).toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground font-bold uppercase">
                    KM
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-medium">
              No recent activities
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RecentActivity;
