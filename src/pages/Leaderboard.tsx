import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Leaderboard = () => {
  // Placeholder data - will be populated from database
  const leaderboardData: any[] = [];

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1: return "text-yellow-500";
      case 2: return "text-gray-400";
      case 3: return "text-amber-600";
      default: return "text-muted-foreground";
    }
  };

  const getRankChange = (change: number) => {
    if (change > 0) return { icon: TrendingUp, color: "text-success", text: `+${change}` };
    if (change < 0) return { icon: TrendingDown, color: "text-destructive", text: `${change}` };
    return { icon: Minus, color: "text-muted-foreground", text: "-" };
  };

  return (
    <div className="min-h-screen bg-background safe-area-inset-top">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-4"
      >
        <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
        <p className="text-muted-foreground">Club rankings by distance</p>
      </motion.header>

      <div className="px-4">
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="alltime">All Time</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="space-y-4">
            {leaderboardData.length === 0 ? (
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
            ) : (
              <>
                {/* Podium */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-end justify-center gap-2 py-6"
                >
                  {/* 2nd Place */}
                  <div className="flex flex-col items-center">
                    <Avatar className="w-14 h-14 border-2 border-gray-400">
                      <AvatarFallback>2</AvatarFallback>
                    </Avatar>
                    <div className="w-16 h-20 bg-gray-400/20 rounded-t-lg mt-2 flex flex-col items-center justify-end pb-2">
                      <Medal className="w-5 h-5 text-gray-400" />
                      <span className="text-xs text-gray-400 font-bold">2nd</span>
                    </div>
                  </div>

                  {/* 1st Place */}
                  <div className="flex flex-col items-center">
                    <Avatar className="w-18 h-18 border-4 border-yellow-500">
                      <AvatarFallback>1</AvatarFallback>
                    </Avatar>
                    <div className="w-20 h-28 bg-yellow-500/20 rounded-t-lg mt-2 flex flex-col items-center justify-end pb-2">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                      <span className="text-sm text-yellow-500 font-bold">1st</span>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="flex flex-col items-center">
                    <Avatar className="w-14 h-14 border-2 border-amber-600">
                      <AvatarFallback>3</AvatarFallback>
                    </Avatar>
                    <div className="w-16 h-16 bg-amber-600/20 rounded-t-lg mt-2 flex flex-col items-center justify-end pb-2">
                      <Medal className="w-5 h-5 text-amber-600" />
                      <span className="text-xs text-amber-600 font-bold">3rd</span>
                    </div>
                  </div>
                </motion.div>

                {/* Full List */}
                <div className="space-y-2">
                  {leaderboardData.map((runner, index) => (
                    <motion.div
                      key={runner.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={runner.isCurrentUser ? "border-primary/50 bg-primary/5" : ""}>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 text-center font-bold ${getMedalColor(runner.position)}`}>
                              {runner.position}
                            </span>
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={runner.avatar} />
                              <AvatarFallback>{runner.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{runner.name}</p>
                              <p className="text-muted-foreground text-sm">{runner.distance} km</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {(() => {
                                const { icon: Icon, color, text } = getRankChange(runner.change);
                                return (
                                  <>
                                    <Icon className={`w-4 h-4 ${color}`} />
                                    <span className={`text-xs ${color}`}>{text}</span>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="alltime">
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">All-time rankings coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="challenges">
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Challenges coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Leaderboard;
