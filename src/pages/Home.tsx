import { motion } from "framer-motion";
import { ChevronRight, Calendar, Settings, Dumbbell, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useRaces } from "@/hooks/useRaces";
import { useUserRank } from "@/hooks/useUserRank";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import logo from "@/assets/logo.png";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import { useHaptics } from "@/hooks/useHaptics";
import BentoStatsGrid from "@/components/home/BentoStatsGrid";
import ActivityFeed from "@/components/home/ActivityFeed";
import { Capacitor } from "@capacitor/core";
import { api } from "@/integrations/supabase/client";
import { useState } from "react";

const motivationalLines = [
  { regular: "Keep pushing", bold: "your limits." },
  { regular: "Every mile", bold: "counts." },
  { regular: "Chase the", bold: "next goal." },
  { regular: "Preparing for", bold: "the big move." },
  { regular: "Run further,", bold: "run stronger." },
];

const Home = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: races } = useRaces();
  const { data: userRank } = useUserRank();
  const { lightImpact } = useHaptics();

  const {
    isRefreshing,
    pullDistance,
    threshold,
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = usePullToRefresh(() => {
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["activities"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard", "monthly"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard", "alltime"] });
    queryClient.invalidateQueries({ queryKey: ["userRank"] });
    queryClient.invalidateQueries({ queryKey: ["monthlyDistance"] });
  });

  const upcomingRace = races?.[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const handleCardTap = (path: string) => {
    lightImpact();
    navigate(path);
  };

  const currentStreak = profile?.current_streak || 0;
  
  // Pick a motivational line based on day
  const motLine = motivationalLines[new Date().getDay() % motivationalLines.length];

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-background safe-area-inset-top pb-32 overflow-y-auto relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <PullToRefresh 
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        threshold={threshold}
      />
      
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-6 pb-2"
        style={{ transform: `translateY(${pullDistance * 0.3}px)` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Erode Runners" className="h-10 w-auto" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {getGreeting()}
              </p>
              <h1 className="text-xl font-black text-foreground tracking-tight">
                {profile?.display_name || "Runner"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
              className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/10"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Avatar 
              className="w-10 h-10 cursor-pointer border-2 border-border rounded-full"
              onClick={() => navigate("/settings")}
            >
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-secondary text-foreground font-bold rounded-full">
                {profile?.display_name?.[0]?.toUpperCase() || "R"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </motion.header>

      {/* Motivational Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="px-5 pb-4"
      >
        <p className="text-lg text-muted-foreground">
          {motLine.regular}{" "}
          <span className="font-bold italic text-foreground">{motLine.bold}</span>
        </p>
      </motion.div>

      <div className="px-5 space-y-3">
        {/* Strava Connect Banner — web only, not connected */}
        {!Capacitor.isNativePlatform() && profile && !profile.strava_id && (
          <StravaConnectBanner />
        )}

        {/* Bento Stats - Distance + Calories */}
        <BentoStatsGrid />

        {/* Secondary Stats Row - Rank / Streak / Runs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3"
        >
          <div 
            className="glass-card p-4 text-center press-scale cursor-pointer"
            onClick={() => handleCardTap("/leaderboard")}
          >
            <p className="stat-label mb-1">Rank</p>
            <p className="text-3xl font-black text-foreground tracking-tight">
              {userRank?.rank ? `#${userRank.rank}` : "—"}
            </p>
          </div>

          <div 
            className="glass-card p-4 text-center press-scale cursor-pointer"
            onClick={() => handleCardTap("/stats")}
          >
            <p className="stat-label mb-1">Streak</p>
            <p className="text-3xl font-black text-foreground tracking-tight">
              {currentStreak}<span className="text-xs font-bold text-muted-foreground ml-0.5">D</span>
            </p>
          </div>

          <div 
            className="glass-card p-4 text-center press-scale cursor-pointer"
            onClick={() => handleCardTap("/stats")}
          >
            <p className="stat-label mb-1">Runs</p>
            <p className="text-3xl font-black text-foreground tracking-tight">
              {profile?.total_runs || 0}
            </p>
          </div>
        </motion.div>

        {/* Activity Feed with category filters */}
        <ActivityFeed />

        {/* Quick Actions Row - Next Race + Training */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3"
        >
          <div 
            className="press-scale cursor-pointer"
            onClick={() => handleCardTap("/races")}
          >
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="stat-label">Next Race</p>
                    <p className="text-sm font-bold text-foreground">
                      {upcomingRace 
                        ? format(new Date(upcomingRace.race_date), "MMM d")
                        : "View All"
                      }
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div 
            className="press-scale cursor-pointer"
            onClick={() => handleCardTap("/training")}
          >
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="stat-label">Training</p>
                    <p className="text-sm font-bold text-foreground">View Plans</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ─── Strava Connect Banner (web only) ───
const StravaConnectBanner = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const token = api.getToken();
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strava-auth?action=authorize&redirect_uri=${encodeURIComponent(redirectUri)}&link=1`;
      
      const response = await fetch(functionUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 border border-strava/30 bg-strava/5 cursor-pointer press-scale"
      onClick={handleConnect}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-strava/20 flex items-center justify-center flex-shrink-0">
          <LinkIcon className="w-5 h-5 text-strava" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Connect Strava</p>
          <p className="text-xs text-muted-foreground">Link your account to sync runs & stats</p>
        </div>
        {isLoading ? (
          <div className="w-5 h-5 rounded-full border-2 border-strava border-t-transparent animate-spin" />
        ) : (
          <ChevronRight className="w-5 h-5 text-strava" />
        )}
      </div>
    </motion.div>
  );
};

export default Home;
