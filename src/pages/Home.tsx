import { motion } from "framer-motion";
import { ChevronRight, Calendar, TrendingUp, Trophy, Zap, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useProfile, useCurrentUser } from "@/hooks/useProfile";
import { useRaces } from "@/hooks/useRaces";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

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
          <div>
            <p className="text-muted-foreground text-sm">{getGreeting()},</p>
            <h1 className="text-2xl font-bold text-foreground">
              {profile?.display_name || "Runner"} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>
                {profile?.display_name?.[0]?.toUpperCase() || "R"}
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="rounded-full"
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
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-0">
              <div className="gradient-primary p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white/90 font-medium">This Month</h2>
                  <TrendingUp className="w-5 h-5 text-white/70" />
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">
                    {(Number(monthlyDistance) / 1000).toFixed(1)}
                  </span>
                  <span className="text-white/70 mb-1">km</span>
                </div>
                <p className="text-white/70 text-sm mt-1">
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
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/leaderboard")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Your Rank</p>
                  <p className="text-xl font-bold text-foreground">-</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/stats")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Streak</p>
                  <p className="text-xl font-bold text-foreground">
                    {currentStreak} days
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
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/races")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {upcomingRace ? upcomingRace.name : "Upcoming Races"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {upcomingRace 
                        ? format(new Date(upcomingRace.race_date), "MMM d, yyyy")
                        : "No upcoming races"
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
          <h2 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: "📊", label: "Stats", path: "/stats" },
              { icon: "🏆", label: "Ranks", path: "/leaderboard" },
              { icon: "📝", label: "Blog", path: "/blog" },
              { icon: "🎯", label: "Training", path: "/training" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card hover:bg-muted/50 transition-colors border border-border/50"
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-xs text-muted-foreground">{action.label}</span>
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
                  <div className="w-12 h-12 rounded-full bg-[#FC4C02]/10 flex items-center justify-center shrink-0">
                    <span className="text-2xl">✓</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Strava Connected</h3>
                    <p className="text-muted-foreground text-sm">
                      Your activities are synced
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
