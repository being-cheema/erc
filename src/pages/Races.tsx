import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ChevronRight, Loader2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRaces, useRegisterForRace, useUnregisterFromRace } from "@/hooks/useRaces";
import { format } from "date-fns";
import { toast } from "sonner";

const Races = () => {
  const { data: races, isLoading } = useRaces();
  const registerMutation = useRegisterForRace();
  const unregisterMutation = useUnregisterFromRace();

  const handleRegister = async (raceId: string, isRegistered: boolean) => {
    try {
      if (isRegistered) {
        await unregisterMutation.mutateAsync(raceId);
        toast.success("Unregistered from race");
      } else {
        await registerMutation.mutateAsync(raceId);
        toast.success("Registered for race!");
      }
    } catch (error) {
      toast.error("Failed to update registration");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      month: format(date, "MMM").toUpperCase(),
      day: format(date, "d"),
      full: format(date, "MMMM d, yyyy"),
    };
  };

  return (
    <div className="min-h-screen bg-background safe-area-inset-top pb-24">
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
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !races || races.length === 0 ? (
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
          races.map((race, index) => {
            const date = formatDate(race.race_date);
            return (
              <motion.div
                key={race.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden">
                  {race.image_url && (
                    <div className="h-32 bg-muted">
                      <img 
                        src={race.image_url} 
                        alt={race.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs text-primary font-medium">{date.month}</span>
                        <span className="text-lg font-bold text-primary">{date.day}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{race.name}</h3>
                        {race.location && (
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground text-sm">{race.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {race.distance_type}
                          </span>
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Users className="w-3 h-3" />
                            <span>{race.participant_count || 0} joined</span>
                          </div>
                        </div>
                        {race.description && (
                          <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                            {race.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant={race.is_registered ? "secondary" : "default"}
                        className="flex-1"
                        onClick={() => handleRegister(race.id, race.is_registered || false)}
                        disabled={registerMutation.isPending || unregisterMutation.isPending}
                      >
                        {race.is_registered ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Registered
                          </>
                        ) : (
                          "Join Race"
                        )}
                      </Button>
                      {race.registration_url && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(race.registration_url!, "_blank")}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Races;
