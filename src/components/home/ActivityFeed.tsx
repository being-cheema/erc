import { useState } from "react";
import { useRecentActivities, formatPace, formatDuration } from "@/hooks/useActivities";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ChevronRight, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const categories = ["All", "Morning", "Evening", "Long Run"] as const;
type Category = typeof categories[number];

function classifyActivity(activity: { start_date: string; distance: number }): Category[] {
  const tags: Category[] = ["All"];
  const hour = new Date(activity.start_date).getHours();
  if (hour < 12) tags.push("Morning");
  else tags.push("Evening");
  if (activity.distance >= 10000) tags.push("Long Run");
  return tags;
}

const ActivityFeed = () => {
  const { data: activities, isLoading } = useRecentActivities();
  const [activeFilter, setActiveFilter] = useState<Category>("All");
  const navigate = useNavigate();

  const filtered = activities?.filter((a) => {
    if (activeFilter === "All") return true;
    return classifyActivity({
      start_date: a.start_date,
      distance: a.distance,
    }).includes(activeFilter);
  }).slice(0, 5);

  if (isLoading) {
    return (
      <div className="glass-card p-4">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground">Recent Activity</h3>
        <button
          onClick={() => navigate("/stats")}
          className="flex items-center gap-0.5 text-xs font-semibold text-primary"
        >
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Activity List */}
      {filtered && filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-pointer"
              onClick={() => navigate("/stats")}
            >
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {activity.name || "Run"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(activity.start_date), "MMM d")} · {formatDuration(activity.moving_time)}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-foreground">
                  {(activity.distance / 1000).toFixed(1)} km
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPace(activity.average_pace)}/km
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-6">
          No activities yet. Connect Strava to get started!
        </p>
      )}
    </motion.div>
  );
};

export default ActivityFeed;
