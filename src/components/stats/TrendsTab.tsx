import { motion } from "framer-motion";
import WeeklyChart from "./WeeklyChart";
import HeartRateChart from "./HeartRateChart";
import ElevationChart from "./ElevationChart";
import PaceChart from "./PaceChart";
import CaloriesChart from "./CaloriesChart";
import DistanceProgressChart from "./DistanceProgressChart";
import ActivityList from "./ActivityList";

const TrendsTab = () => {
  return (
    <div className="space-y-4">
      {/* Monthly Goal Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <DistanceProgressChart />
      </motion.div>

      {/* Weekly Distance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <WeeklyChart />
      </motion.div>

      {/* Pace Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <PaceChart />
      </motion.div>

      {/* Heart Rate Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <HeartRateChart />
      </motion.div>

      {/* Elevation Gain */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ElevationChart />
      </motion.div>

      {/* Calories Burned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <CaloriesChart />
      </motion.div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <ActivityList />
      </motion.div>
    </div>
  );
};

export default TrendsTab;
