import { motion } from "framer-motion";
import { Target, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const trainingPlans = [
  {
    id: "5k-beginner",
    name: "5K Beginner",
    duration: "8 weeks",
    level: "Beginner",
    description: "Perfect for new runners looking to complete their first 5K",
  },
  {
    id: "10k-intermediate",
    name: "10K Intermediate",
    duration: "10 weeks",
    level: "Intermediate",
    description: "Build endurance and speed for your 10K goal",
  },
  {
    id: "half-marathon",
    name: "Half Marathon",
    duration: "12 weeks",
    level: "Intermediate",
    description: "Prepare for the 21.1km challenge with structured training",
  },
  {
    id: "marathon",
    name: "Marathon",
    duration: "16 weeks",
    level: "Advanced",
    description: "Complete 42.2km marathon preparation program",
  },
];

const Training = () => {
  return (
    <div className="min-h-screen bg-background safe-area-inset-top pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-4"
      >
        <h1 className="text-2xl font-bold text-foreground">Training Plans</h1>
        <p className="text-muted-foreground">Structured programs for every goal</p>
      </motion.header>

      <div className="px-4 space-y-4">
        {trainingPlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{plan.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        plan.level === "Beginner" 
                          ? "bg-success/10 text-success" 
                          : plan.level === "Intermediate"
                            ? "bg-warning/10 text-warning"
                            : "bg-destructive/10 text-destructive"
                      }`}>
                        {plan.level}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">{plan.description}</p>
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{plan.duration}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground self-center" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Coming Soon Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-6"
        >
          <p className="text-muted-foreground text-sm">
            More training plans coming soon!
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Training;
