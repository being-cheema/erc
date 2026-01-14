import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown, TrendingUp, Activity, Heart, Mountain, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import WeeklyChart from "./WeeklyChart";
import HeartRateChart from "./HeartRateChart";
import ElevationChart from "./ElevationChart";
import PaceChart from "./PaceChart";
import CaloriesChart from "./CaloriesChart";
import DistanceProgressChart from "./DistanceProgressChart";
import ActivityList from "./ActivityList";

const TrendsTab = () => {
  const [moreStatsOpen, setMoreStatsOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Primary Charts - Always Visible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Monthly Goal Progress */}
        <DistanceProgressChart />

        {/* Weekly Distance */}
        <WeeklyChart />

        {/* Pace Trends - Key metric for runners */}
        <PaceChart />
      </motion.div>

      {/* More Stats - Collapsible Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Collapsible open={moreStatsOpen} onOpenChange={setMoreStatsOpen}>
          <Card className="border-border/50">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg pb-3">
                <CardTitle className="text-base font-medium flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span>More Stats</span>
                  </div>
                  <ChevronDown 
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                      moreStatsOpen ? "rotate-180" : ""
                    }`} 
                  />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                {/* Heart Rate Trends */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Heart className="w-4 h-4" />
                    <span>Heart Rate</span>
                  </div>
                  <HeartRateChart compact />
                </div>

                {/* Elevation Gain */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Mountain className="w-4 h-4" />
                    <span>Elevation</span>
                  </div>
                  <ElevationChart compact />
                </div>

                {/* Calories Burned */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Flame className="w-4 h-4" />
                    <span>Calories</span>
                  </div>
                  <CaloriesChart compact />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <ActivityList />
      </motion.div>
    </div>
  );
};

export default TrendsTab;
