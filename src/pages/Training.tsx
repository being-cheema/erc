import { motion } from "framer-motion";
import { Target, Clock, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTrainingPlans } from "@/hooks/useTrainingPlans";

const Training = () => {
  const { data: plans, isLoading } = useTrainingPlans();

  const getLevelStyle = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner":
        return "bg-success/10 text-success";
      case "intermediate":
        return "bg-warning/10 text-warning";
      case "advanced":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-primary/10 text-primary";
    }
  };

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
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !plans || plans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
              <Target className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No Training Plans</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Training plans coming soon. Check back later!
            </p>
          </motion.div>
        ) : (
          plans.map((plan, index) => (
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
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelStyle(plan.level)}`}>
                          {plan.level}
                        </span>
                      </div>
                      {plan.description && (
                        <p className="text-muted-foreground text-sm mb-2">{plan.description}</p>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Clock className="w-3 h-3" />
                          <span>{plan.duration_weeks} weeks</span>
                        </div>
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {plan.goal_distance}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground self-center" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}

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
