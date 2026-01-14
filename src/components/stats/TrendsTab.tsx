import { motion } from "framer-motion";
import WeeklyChart from "./WeeklyChart";
import ActivityList from "./ActivityList";

const TrendsTab = () => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <WeeklyChart />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ActivityList />
      </motion.div>
    </>
  );
};

export default TrendsTab;
