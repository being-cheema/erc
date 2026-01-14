import { motion } from "framer-motion";
import { ChevronRight, Calendar, TrendingUp, Trophy, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  
  // Placeholder data - will be replaced with real Strava data
  const userData = {
    name: "Runner",
    monthlyDistance: 0,
    monthlyRuns: 0,
    currentRank: "-",
    nextRace: null,
  };

  return (
    <div className="min-h-screen bg-background safe-area-inset-top">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Good morning,</p>
            <h1 className="text-2xl font-bold text-foreground">{userData.name} 👋</h1>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 bg-muted">
            <span className="text-lg">🏃</span>
          </Button>
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
                  <span className="text-4xl font-bold text-white">{userData.monthlyDistance}</span>
                  <span className="text-white/70 mb-1">km</span>
                </div>
                <p className="text-white/70 text-sm mt-1">{userData.monthlyRuns} runs completed</p>
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
                  <p className="text-xl font-bold text-foreground">{userData.currentRank}</p>
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
                  <p className="text-xl font-bold text-foreground">0 days</p>
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
                    <h3 className="font-semibold text-foreground">Upcoming Races</h3>
                    <p className="text-muted-foreground text-sm">
                      {userData.nextRace ? "Next race in 5 days" : "No upcoming races"}
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

        {/* Connect Strava CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FC4C02]/10 flex items-center justify-center shrink-0">
                  <span className="text-2xl">🔗</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Connect Strava</h3>
                  <p className="text-muted-foreground text-sm">Sync your activities to see your stats</p>
                </div>
                <ChevronRight className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
