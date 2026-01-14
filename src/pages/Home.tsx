import { motion } from "framer-motion";
import { ChevronRight, Calendar, TrendingUp, Trophy, Zap, LogOut, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useProfile, useCurrentUser } from "@/hooks/useProfile";
import { useRaces } from "@/hooks/useRaces";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import logo from "@/assets/logo.png";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import { useHaptics } from "@/hooks/useHaptics";

const Home = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: races } = useRaces();
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

  const monthlyDistance = profile?.total_distance || 0;
  const monthlyRuns = profile?.total_runs || 0;
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
        {/* Monthly Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-accent shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-primary-foreground/80 text-sm font-semibold uppercase tracking-wider">This Month</span>
                <TrendingUp className="w-5 h-5 text-primary-foreground/60" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-bold text-primary-foreground tracking-tight">
                  {(Number(monthlyDistance) / 1000).toFixed(1)}
                </span>
                <span className="text-primary-foreground/70 text-xl font-medium">km</span>
              </div>
              <p className="text-primary-foreground/70 text-sm mt-2 font-medium">
                {monthlyRuns} runs completed
              </p>
            </CardContent>
          </Card>
        </motion.div>

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
                  <p className="text-2xl font-bold text-foreground">—</p>
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

        {/* Next Race Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card 
            className="cursor-pointer active:scale-[0.98] transition-transform border-border/50 bg-card"
            onClick={() => handleCardTap("/races")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-base">
                      {upcomingRace ? upcomingRace.name : "Upcoming Races"}
                    </h3>
                    <p className="text-muted-foreground text-sm font-medium">
                      {upcomingRace 
                        ? format(new Date(upcomingRace.race_date), "MMM d, yyyy")
                        : "View all events"
                      }
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
                  <div className="w-12 h-12 rounded-full bg-strava/10 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-strava" fill="currentColor">
                      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Strava Connected</h3>
                    <p className="text-muted-foreground text-sm font-medium">
                      Activities synced • Pull down to refresh
                    </p>
                  </div>
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
