import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Races = () => {
  // Placeholder data - will be populated from database
  const upcomingRaces: any[] = [];

  return (
    <div className="min-h-screen bg-background safe-area-inset-top">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-4"
      >
        <h1 className="text-2xl font-bold text-foreground">Races</h1>
        <p className="text-muted-foreground">Upcoming club events and races</p>
      </motion.header>

      <div className="px-4 space-y-4">
        {upcomingRaces.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No Upcoming Races</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Check back later for upcoming club races and events.
            </p>
          </motion.div>
        ) : (
          upcomingRaces.map((race, index) => (
            <motion.div
              key={race.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs text-primary font-medium">JAN</span>
                      <span className="text-lg font-bold text-primary">15</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{race.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground text-sm">{race.location}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {race.distance}
                        </span>
                        <div className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Users className="w-3 h-3" />
                          <span>{race.participants} joined</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground self-center" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Races;
