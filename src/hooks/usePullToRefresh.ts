import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const usePullToRefresh = (onRefreshComplete?: () => void) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const threshold = 80;

  const syncStrava = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to sync");
        return;
      }

      const response = await supabase.functions.invoke("sync-strava", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      toast.success("Strava data synced successfully!");
      onRefreshComplete?.();
    } catch (error: any) {
      console.error("Sync error:", error);
      toast.error(error.message || "Failed to sync Strava data");
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefreshComplete]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop !== 0 || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= threshold && !isRefreshing) {
      syncStrava();
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, syncStrava]);

  return {
    isRefreshing,
    pullDistance,
    threshold,
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    syncStrava,
  };
};
