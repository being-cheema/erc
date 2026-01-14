import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
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
    if (change > 0) return { icon: TrendingUp, color: "text-green-500", text: `+${change}` };
    if (change < 0) return { icon: TrendingDown, color: "text-red-500", text: `${change}` };
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
          <div className="w-20 h-20 mx-auto bg-muted flex items-center justify-center mb-4">
            <Trophy className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold uppercase tracking-wide text-foreground mb-2">No Rankings Yet</h2>
          <p className="text-muted-foreground text-xs font-medium max-w-xs mx-auto">
            Connect Strava and start running to see club rankings.
          </p>
        </motion.div>
      );
    }

    const top3 = data.slice(0, 3);

    return (
      <>
        {/* Podium */}
        {top3.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-end justify-center gap-2 py-8"
          >
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <Avatar className="w-14 h-14 border-2 border-muted">
                <AvatarImage src={top3[1]?.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground font-bold">{top3[1]?.display_name?.[0] || "2"}</AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground mt-2 truncate max-w-16 font-bold uppercase">
                {top3[1]?.display_name}
              </p>
              <div className="w-18 h-20 bg-muted mt-2 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-foreground">2</span>
                <span className="text-xs text-muted-foreground font-bold">
                  {((top3[1]?.total_distance || 0) / 1000).toFixed(0)} km
                </span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center -mt-4">
              <div className="relative">
                <Avatar className="w-18 h-18 border-2 border-primary">
                  <AvatarImage src={top3[0]?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">{top3[0]?.display_name?.[0] || "1"}</AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 truncate max-w-20 font-bold uppercase">
                {top3[0]?.display_name}
              </p>
              <div className="w-20 h-28 bg-primary mt-2 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-primary-foreground">1</span>
                <span className="text-sm text-primary-foreground/90 font-bold">
                  {((top3[0]?.total_distance || 0) / 1000).toFixed(0)} km
                </span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <Avatar className="w-14 h-14 border-2 border-muted">
                <AvatarImage src={top3[2]?.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground font-bold">{top3[2]?.display_name?.[0] || "3"}</AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground mt-2 truncate max-w-16 font-bold uppercase">
                {top3[2]?.display_name}
              </p>
              <div className="w-18 h-16 bg-muted/70 mt-2 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-foreground">3</span>
                <span className="text-xs text-muted-foreground font-bold">
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
                <Card className={`border-border ${isCurrentUser ? "border-primary bg-primary/5" : ""}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center text-sm font-black
                        ${rank === 1 ? "bg-primary text-primary-foreground" : ""}
                        ${rank === 2 ? "bg-muted text-foreground" : ""}
                        ${rank === 3 ? "bg-muted/70 text-foreground" : ""}
                        ${rank > 3 ? "bg-muted text-muted-foreground" : ""}
                      `}>
                        {rank}
                      </div>
                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarImage src={runner.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted font-bold">{runner.display_name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate text-sm uppercase tracking-wide">{runner.display_name}</p>
                        <p className="text-muted-foreground text-xs font-medium">
                          {((runner.total_distance || 0) / 1000).toFixed(1)} km
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {(() => {
                          const { icon: Icon, color, text } = getRankChange(runner.rank_change);
                          return (
                            <>
                              <Icon className={`w-4 h-4 ${color}`} />
                              <span className={`text-xs font-bold ${color}`}>{text}</span>
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
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Leaderboard</h1>
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Club rankings • Pull to sync</p>
      </motion.header>

      <div className="px-4">
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-muted">
            <TabsTrigger value="monthly" className="text-xs font-bold uppercase tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="alltime" className="text-xs font-bold uppercase tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
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
