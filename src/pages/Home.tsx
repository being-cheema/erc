import { motion } from "framer-motion";
import { ChevronRight, Calendar, TrendingUp, Trophy, Zap, LogOut, Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useProfile, useCurrentUser } from "@/hooks/useProfile";
import { useRaces } from "@/hooks/useRaces";
import { useUserRank } from "@/hooks/useUserRank";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import logo from "@/assets/logo.png";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import { useHaptics } from "@/hooks/useHaptics";
import GoalProgress from "@/components/home/GoalProgress";
import RecentActivity from "@/components/home/RecentActivity";

const Home = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: races } = useRaces();
  const { data: userRank } = useUserRank();
  const { lightImpact, mediumImpact } = useHaptics();

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
    queryClient.invalidateQueries({ queryKey: ["monthlyLeaderboard"] });
    queryClient.invalidateQueries({ queryKey: ["allTimeLeaderboard"] });
  });

  const upcomingRace = races?.[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleLogout = async () => {
    mediumImpact();
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleCardTap = (path: string) => {
    lightImpact();
    navigate(path);
  };

  const currentStreak = profile?.current_streak || 0;

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-background safe-area-inset-top pb-24 overflow-y-auto relative"
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
        className="px-5 pt-6 pb-4"
        style={{ transform: `translateY(${pullDistance * 0.3}px)` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Erode Runners" className="h-11 w-auto rounded-xl" />
            <div>
              <p className="text-muted-foreground text-sm font-medium">{getGreeting()}</p>
              <h1 className="text-xl font-bold text-foreground">
                {profile?.display_name || "Runner"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Avatar 
              className="w-10 h-10 border-2 border-primary/30 cursor-pointer"
              onClick={() => navigate("/settings")}
            >
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {profile?.display_name?.[0]?.toUpperCase() || "R"}
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="px-5 space-y-4">
        {/* Goal Progress */}
        <GoalProgress />

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card 
            className="cursor-pointer active:scale-[0.98] transition-transform border-border/50 bg-card"
            onClick={() => handleCardTap("/leaderboard")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Rank</p>
                  <p className="text-2xl font-bold text-foreground">{userRank?.rank ? `#${userRank.rank}` : "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer active:scale-[0.98] transition-transform border-border/50 bg-card"
            onClick={() => handleCardTap("/stats")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center shadow-sm">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Streak</p>
                  <p className="text-2xl font-bold text-foreground">
                    {currentStreak}<span className="text-sm font-medium text-muted-foreground ml-1">days</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <RecentActivity />

        {/* Quick Actions Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Next Race Card */}
          <Card 
            className="cursor-pointer active:scale-[0.98] transition-transform border-border/50 bg-card"
            onClick={() => handleCardTap("/races")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Next Race</p>
                  <p className="font-semibold text-foreground text-sm truncate">
                    {upcomingRace 
                      ? format(new Date(upcomingRace.race_date), "MMM d")
                      : "View All"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training Card */}
          <Card 
            className="cursor-pointer active:scale-[0.98] transition-transform border-border/50 bg-card"
            onClick={() => handleCardTap("/training")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Training</p>
                  <p className="font-semibold text-foreground text-sm">
                    View Plans
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Strava Connected Status */}
        {profile?.strava_id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-strava/20 bg-strava/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-strava/10 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-strava" fill="currentColor">
                      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground text-sm">Strava Connected</h3>
                    <p className="text-muted-foreground text-xs">
                      Pull down to sync latest activities
                    </p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-strava" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Home;
