import { motion } from "framer-motion";
import { ChevronRight, Calendar, Trophy, Zap, Settings, Dumbbell } from "lucide-react";
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
import GoalProgress from "@/components/home/GoalProgress";
import RecentActivity from "@/components/home/RecentActivity";

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
    queryClient.invalidateQueries({ queryKey: ["monthlyLeaderboard"] });
    queryClient.invalidateQueries({ queryKey: ["allTimeLeaderboard"] });
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
          <div className="flex items-center gap-4">
            <img src={logo} alt="Erode Runners" className="h-10 w-auto" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {getGreeting()}
              </p>
              <h1 className="text-xl font-black text-foreground uppercase tracking-tight">
                {profile?.display_name || "Runner"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
              className="rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Avatar 
              className="w-10 h-10 cursor-pointer border-2 border-border"
              onClick={() => navigate("/settings")}
            >
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-secondary text-foreground font-bold">
                {profile?.display_name?.[0]?.toUpperCase() || "R"}
              </AvatarFallback>
            </Avatar>
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
          {/* Rank Card */}
          <div 
            className="bg-card p-4 press-scale cursor-pointer border border-border"
            onClick={() => handleCardTap("/leaderboard")}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rank</p>
                <p className="text-3xl font-black text-foreground tracking-tight">
                  {userRank?.rank ? `#${userRank.rank}` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Streak Card */}
          <div 
            className="bg-card p-4 press-scale cursor-pointer border border-border"
            onClick={() => handleCardTap("/stats")}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-success flex items-center justify-center">
                <Zap className="w-6 h-6 text-success-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Streak</p>
                <p className="text-3xl font-black text-foreground tracking-tight">
                  {currentStreak}<span className="text-sm font-bold text-muted-foreground ml-1">D</span>
                </p>
              </div>
            </div>
          </div>
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
          <div 
            className="bg-card p-4 press-scale cursor-pointer border border-border"
            onClick={() => handleCardTap("/races")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Next Race</p>
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

          {/* Training Card */}
          <div 
            className="bg-card p-4 press-scale cursor-pointer border border-border"
            onClick={() => handleCardTap("/training")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Training</p>
                  <p className="text-sm font-bold text-foreground">View Plans</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </motion.div>

        {/* Strava Connected Status */}
        {profile?.strava_id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-card border border-primary/30 p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-strava flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-sm uppercase tracking-wide">Strava Connected</h3>
                  <p className="text-muted-foreground text-xs">
                    Pull down to sync latest activities
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Home;
