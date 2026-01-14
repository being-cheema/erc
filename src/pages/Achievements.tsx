import { motion } from "framer-motion";
import { Trophy, Lock, Loader2, Medal, Target, Zap, MapPin, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAchievementsWithStatus } from "@/hooks/useAchievements";
import { useProfile } from "@/hooks/useProfile";
import { format } from "date-fns";

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case "distance":
      return MapPin;
    case "runs":
      return Target;
    case "streak":
      return Zap;
    case "milestone":
      return Medal;
    default:
      return Trophy;
  }
};

const getIconEmoji = (icon: string) => {
  // Return the icon string as is if it's an emoji
  if (icon && icon.length <= 4) {
    return icon;
  }
  return "🏆";
};

const Achievements = () => {
  const { data: achievements, isLoading } = useAchievementsWithStatus();
  const { data: profile } = useProfile();

  const unlockedCount = achievements?.filter(a => a.unlocked).length || 0;
  const totalCount = achievements?.length || 0;

  // Group achievements by category
  const groupedAchievements = achievements?.reduce((acc, achievement) => {
    const category = achievement.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, typeof achievements>);

  const getProgress = (achievement: NonNullable<typeof achievements>[0]) => {
    if (achievement.unlocked) return 100;
    
    const reqType = achievement.requirement_type;
    const reqValue = achievement.requirement_value;
    
    let currentValue = 0;
    switch (reqType) {
      case "total_distance":
        currentValue = Number(profile?.total_distance || 0);
        break;
      case "total_runs":
        currentValue = profile?.total_runs || 0;
        break;
      case "current_streak":
      case "longest_streak":
        currentValue = Math.max(profile?.current_streak || 0, profile?.longest_streak || 0);
        break;
      default:
        return 0;
    }
    
    return Math.min(100, Math.round((currentValue / reqValue) * 100));
  };

  return (
    <div className="min-h-screen bg-background safe-area-inset-top pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-4"
      >
        <h1 className="text-2xl font-bold text-foreground">Achievements</h1>
        <p className="text-muted-foreground text-sm">
          {unlockedCount} of {totalCount} unlocked
        </p>
      </motion.header>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 mb-6"
      >
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white/80 text-sm font-medium">Achievement Progress</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">{unlockedCount}</span>
                  <span className="text-white/70 text-lg">/ {totalCount}</span>
                </div>
                <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="px-4 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !achievements || achievements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
              <Trophy className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No Achievements Yet</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Achievements will be added soon. Keep running!
            </p>
          </motion.div>
        ) : (
          Object.entries(groupedAchievements || {}).map(([category, categoryAchievements], catIndex) => {
            const CategoryIcon = getCategoryIcon(category);
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIndex * 0.1 + 0.2 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <CategoryIcon className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground capitalize">{category}</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {categoryAchievements?.map((achievement, index) => {
                    const progress = getProgress(achievement);
                    return (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 + catIndex * 0.1 + 0.3 }}
                      >
                        <Card className={`relative overflow-hidden ${
                          achievement.unlocked 
                            ? "border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent" 
                            : "border-border/50 bg-card"
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex flex-col items-center text-center">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                                achievement.unlocked 
                                  ? "bg-gradient-to-br from-amber-400 to-amber-600" 
                                  : "bg-muted"
                              }`}>
                                {achievement.unlocked ? (
                                  <span className="text-2xl">{getIconEmoji(achievement.icon)}</span>
                                ) : (
                                  <Lock className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <h3 className={`font-semibold text-sm mb-1 ${
                                achievement.unlocked ? "text-foreground" : "text-muted-foreground"
                              }`}>
                                {achievement.name}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {achievement.description}
                              </p>
                              
                              {achievement.unlocked ? (
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(achievement.unlocked_at!), "MMM d, yyyy")}
                                </p>
                              ) : (
                                <div className="w-full">
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary/50 rounded-full transition-all"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Achievements;
