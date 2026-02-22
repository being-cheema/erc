import { motion } from "framer-motion";
import { ChevronRight, Calendar, Zap, Settings, Dumbbell } from "lucide-react";
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

      <div className="px-5 space-y-6">
        {/* Hero Stat Banner */}
        <GoalProgress />

        {/* Secondary Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between"
        >
          {/* Rank */}
          <div 
            className="flex-1 text-center press-scale cursor-pointer"
            onClick={() => handleCardTap("/leaderboard")}
          >
            <p className="stat-label">Rank</p>
            <p className="text-3xl font-black text-foreground tracking-tight">
              {userRank?.rank ? `#${userRank.rank}` : "—"}
            </p>
          </div>

          <div className="w-px h-10 bg-border" />

          {/* Streak */}
          <div 
            className="flex-1 text-center press-scale cursor-pointer"
            onClick={() => handleCardTap("/stats")}
          >
            <p className="stat-label">Streak</p>
            <p className="text-3xl font-black text-foreground tracking-tight">
              {currentStreak}<span className="text-sm font-bold text-muted-foreground ml-0.5">D</span>
            </p>
          </div>

          <div className="w-px h-10 bg-border" />

          {/* Total Runs */}
          <div 
            className="flex-1 text-center press-scale cursor-pointer"
            onClick={() => handleCardTap("/stats")}
          >
            <p className="stat-label">Runs</p>
            <p className="text-3xl font-black text-foreground tracking-tight">
              {profile?.total_runs || 0}
            </p>
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

          {/* Training Card */}
          <div 
            className="bg-card p-4 press-scale cursor-pointer border border-border"
            onClick={() => handleCardTap("/training")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-primary" />
                <div>
                  <p className="stat-label">Training</p>
                  <p className="text-sm font-bold text-foreground">View Plans</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
