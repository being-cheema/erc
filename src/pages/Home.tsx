import { motion } from "framer-motion";
import { ChevronRight, Calendar, TrendingUp, Trophy, Zap, LogOut, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useProfile, useCurrentUser } from "@/hooks/useProfile";
import { useRaces } from "@/hooks/useRaces";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import logo from "@/assets/logo.png";

const Home = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: user } = useCurrentUser();
  const { data: races } = useRaces();

  const upcomingRace = races?.[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const monthlyDistance = profile?.total_distance || 0;
  const monthlyRuns = profile?.total_runs || 0;
  const currentStreak = profile?.current_streak || 0;

  return (
    <div className="min-h-screen bg-background safe-area-inset-top pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Erode Runners" className="h-10 w-auto" />
            <div>
              <p className="text-muted-foreground text-sm">{getGreeting()},</p>
              <h1 className="text-xl font-bold text-foreground font-sans">
                {profile?.display_name || "Runner"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="w-10 h-10 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {profile?.display_name?.[0]?.toUpperCase() || "R"}
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="px-4 space-y-4">
        {/* Monthly Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden border-0 luxury-shadow-lg">
            <CardContent className="p-0">
              <div className="gradient-primary p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white/90 font-medium font-sans text-sm uppercase tracking-wide">This Month</h2>
                  <TrendingUp className="w-5 h-5 text-white/70" />
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-bold text-white">
                    {(Number(monthlyDistance) / 1000).toFixed(1)}
                  </span>
                  <span className="text-white/70 mb-2 text-lg">km</span>
                </div>
                <p className="text-white/70 text-sm mt-2">
                  {monthlyRuns} runs completed
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card 
            className="cursor-pointer card-hover border-border/50"
            onClick={() => navigate("/leaderboard")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl gradient-gold flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Rank</p>
                  <p className="text-xl font-bold text-foreground font-sans">—</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer card-hover border-border/50"
            onClick={() => navigate("/stats")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-success flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Streak</p>
                  <p className="text-xl font-bold text-foreground font-sans">
                    {currentStreak} <span className="text-sm font-normal text-muted-foreground">days</span>
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
            className="cursor-pointer card-hover border-border/50"
            onClick={() => navigate("/races")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground font-sans">
                      {upcomingRace ? upcomingRace.name : "Upcoming Races"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
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

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Activity, label: "Stats", path: "/stats", color: "text-primary" },
              { icon: Trophy, label: "Ranks", path: "/leaderboard", color: "text-warning" },
              { icon: Calendar, label: "Races", path: "/races", color: "text-accent" },
              { icon: TrendingUp, label: "Training", path: "/training", color: "text-success" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card hover:bg-muted/50 transition-all border border-border/50 card-hover"
              >
                <action.icon className={`w-6 h-6 ${action.color}`} />
                <span className="text-xs text-muted-foreground font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Strava Connected Status */}
        {profile?.strava_id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-strava/10 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-strava" fill="currentColor">
                      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground font-sans">Strava Connected</h3>
                    <p className="text-muted-foreground text-sm">
                      Your activities are synced automatically
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
