import { useRecentActivities, formatPace } from "@/hooks/useActivities";
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
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="h-4 w-16 rounded-lg" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
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
      <div className="glass-card p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Recent Activity
          </h3>
          <button 
            onClick={() => navigate("/stats")}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            View all
          </button>
        </div>

        {hasActivities ? (
          <div className="space-y-2">
            {displayActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] press-scale cursor-pointer"
                onClick={() => navigate("/stats")}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
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
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">
                    KM
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-muted-foreground" />
            </div>
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
