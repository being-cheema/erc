import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMonthlyLeaderboard, useAllTimeLeaderboard, LeaderboardEntry } from "@/hooks/useLeaderboard";
import { useCurrentUser } from "@/hooks/useProfile";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";

const Leaderboard = () => {
  const queryClient = useQueryClient();
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyLeaderboard();
  const { data: allTimeData, isLoading: allTimeLoading } = useAllTimeLeaderboard();
  const { data: currentUser } = useCurrentUser();

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

  const getRankChange = (change: number | null) => {
    if (!change) return { icon: Minus, color: "text-muted-foreground", text: "—" };
    if (change > 0) return { icon: TrendingUp, color: "text-success", text: `+${change}` };
    if (change < 0) return { icon: TrendingDown, color: "text-destructive", text: `${change}` };
    return { icon: Minus, color: "text-muted-foreground", text: "—" };
  };

  const renderLeaderboardContent = (data: LeaderboardEntry[] | undefined, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <Trophy className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No Rankings Yet</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Connect Strava and start running to see club rankings.
          </p>
        </motion.div>
      );
    }

    const top3 = data.slice(0, 3);
    const rest = data.slice(3);

    return (
      <>
        {/* Podium */}
        {top3.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-end justify-center gap-3 py-8"
          >
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <Avatar className="w-14 h-14 border-2 border-border ring-2 ring-offset-2 ring-offset-background ring-gray-400">
                <AvatarImage src={top3[1]?.avatar_url || undefined} />
                <AvatarFallback className="bg-gray-400/20 text-gray-400">{top3[1]?.display_name?.[0] || "2"}</AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground mt-2 truncate max-w-16 font-medium">
                {top3[1]?.display_name}
              </p>
              <div className="w-18 h-20 podium-silver rounded-t-lg mt-2 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">2</span>
                <span className="text-xs text-white/80 font-medium">
                  {((top3[1]?.total_distance || 0) / 1000).toFixed(0)} km
                </span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center -mt-4">
              <div className="relative">
                <Avatar className="w-18 h-18 border-2 border-border ring-4 ring-offset-2 ring-offset-background ring-yellow-500">
                  <AvatarImage src={top3[0]?.avatar_url || undefined} />
                  <AvatarFallback className="bg-yellow-500/20 text-yellow-500">{top3[0]?.display_name?.[0] || "1"}</AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full podium-gold flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 truncate max-w-20 font-medium">
                {top3[0]?.display_name}
              </p>
              <div className="w-20 h-28 podium-gold rounded-t-lg mt-2 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">1</span>
                <span className="text-sm text-white/90 font-medium">
                  {((top3[0]?.total_distance || 0) / 1000).toFixed(0)} km
                </span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <Avatar className="w-14 h-14 border-2 border-border ring-2 ring-offset-2 ring-offset-background ring-amber-600">
                <AvatarImage src={top3[2]?.avatar_url || undefined} />
                <AvatarFallback className="bg-amber-600/20 text-amber-600">{top3[2]?.display_name?.[0] || "3"}</AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground mt-2 truncate max-w-16 font-medium">
                {top3[2]?.display_name}
              </p>
              <div className="w-18 h-16 podium-bronze rounded-t-lg mt-2 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">3</span>
                <span className="text-xs text-white/80 font-medium">
                  {((top3[2]?.total_distance || 0) / 1000).toFixed(0)} km
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Full List */}
        <div className="space-y-2">
          {data.map((runner, index) => {
            const isCurrentUser = currentUser?.id === runner.user_id;
            const rank = runner.rank || index + 1;
            return (
              <motion.div
                key={runner.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className={`border-border/50 ${isCurrentUser ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : ""}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                        ${rank === 1 ? "podium-gold text-white" : ""}
                        ${rank === 2 ? "podium-silver text-white" : ""}
                        ${rank === 3 ? "podium-bronze text-white" : ""}
                        ${rank > 3 ? "bg-muted text-muted-foreground" : ""}
                      `}>
                        {rank}
                      </div>
                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarImage src={runner.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted">{runner.display_name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate font-sans">{runner.display_name}</p>
                        <p className="text-muted-foreground text-sm">
                          {((runner.total_distance || 0) / 1000).toFixed(1)} km
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {(() => {
                          const { icon: Icon, color, text } = getRankChange(runner.rank_change);
                          return (
                            <>
                              <Icon className={`w-4 h-4 ${color}`} />
                              <span className={`text-xs font-medium ${color}`}>{text}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </>
    );
  };

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
        className="px-4 pt-6 pb-4"
        style={{ transform: `translateY(${pullDistance * 0.3}px)` }}
      >
        <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
        <p className="text-muted-foreground text-sm">Club rankings by distance • Pull to sync</p>
      </motion.header>

      <div className="px-4">
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-muted/50">
            <TabsTrigger value="monthly" className="text-sm font-medium data-[state=active]:gradient-primary data-[state=active]:text-white">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="alltime" className="text-sm font-medium data-[state=active]:gradient-primary data-[state=active]:text-white">
              All Time
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="space-y-4">
            {renderLeaderboardContent(monthlyData, monthlyLoading)}
          </TabsContent>

          <TabsContent value="alltime" className="space-y-4">
            {renderLeaderboardContent(allTimeData, allTimeLoading)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Leaderboard;
