import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useHaptics } from "@/hooks/useHaptics";

export const usePullToRefresh = (onRefreshComplete?: () => void) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredHaptic = useRef(false);
  const threshold = 80;
  const { mediumImpact, notificationSuccess, notificationError, selectionChanged } = useHaptics();

  const syncStrava = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to sync");
        notificationError();
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
      notificationSuccess();
      onRefreshComplete?.();
    } catch (error: any) {
      console.error("Sync error:", error);
      toast.error(error.message || "Failed to sync Strava data");
      notificationError();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      hasTriggeredHaptic.current = false;
    }
  }, [onRefreshComplete, notificationSuccess, notificationError]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      hasTriggeredHaptic.current = false;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop !== 0 || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      const newDistance = Math.min(diff * 0.5, threshold * 1.5);
      setPullDistance(newDistance);
      
      // Trigger haptic when crossing threshold
      if (newDistance >= threshold && !hasTriggeredHaptic.current) {
        selectionChanged();
        hasTriggeredHaptic.current = true;
      } else if (newDistance < threshold && hasTriggeredHaptic.current) {
        hasTriggeredHaptic.current = false;
      }
    }
  }, [isRefreshing, selectionChanged, threshold]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= threshold && !isRefreshing) {
      mediumImpact();
      syncStrava();
    } else {
      setPullDistance(0);
      hasTriggeredHaptic.current = false;
    }
  }, [pullDistance, isRefreshing, syncStrava, mediumImpact, threshold]);

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
