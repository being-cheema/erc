import { motion } from "framer-motion";
import { RefreshCw, Loader2 } from "lucide-react";

interface PullToRefreshProps {
  isRefreshing: boolean;
  pullDistance: number;
  threshold: number;
}

const PullToRefresh = ({ isRefreshing, pullDistance, threshold }: PullToRefreshProps) => {
  const progress = Math.min(pullDistance / threshold, 1);
  const shouldShow = pullDistance > 10 || isRefreshing;

  if (!shouldShow) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ 
        opacity: progress, 
        y: pullDistance - 40,
      }}
      className="absolute top-0 left-0 right-0 flex justify-center z-50 pointer-events-none"
    >
      <div className="w-10 h-10 rounded-full glass flex items-center justify-center border border-primary/20">
        {isRefreshing ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <motion.div
            animate={{ rotate: progress * 180 }}
          >
            <RefreshCw 
              className={`w-5 h-5 transition-colors ${
                pullDistance >= threshold ? "text-primary" : "text-muted-foreground"
              }`} 
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default PullToRefresh;
