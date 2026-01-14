import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, List, MapPin, Users, ChevronRight, Loader2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRaces, useRegisterForRace, useUnregisterFromRace, Race } from "@/hooks/useRaces";
import { format } from "date-fns";
import { toast } from "sonner";
import RaceCalendar from "@/components/races/RaceCalendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const Races = () => {
  const { data: races, isLoading } = useRaces();
  const registerMutation = useRegisterForRace();
  const unregisterMutation = useUnregisterFromRace();
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);

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

  const RaceListView = () => (
    <div className="space-y-4">
      {!races || races.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 mx-auto rounded-full gradient-primary flex items-center justify-center mb-4 glow-primary">
            <Calendar className="w-10 h-10 text-white" />
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
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden border-border/50 card-hover">
                {race.image_url && (
                  <div className="h-36 bg-muted relative">
                    <img 
                      src={race.image_url} 
                      alt={race.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-xl gradient-primary flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs text-white/90 font-medium">{date.month}</span>
                      <span className="text-lg font-bold text-white">{date.day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground font-sans">{race.name}</h3>
                      {race.location && (
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground text-sm truncate">{race.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-xs gradient-primary text-white px-2.5 py-1 rounded-full font-medium">
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
                      className={`flex-1 ${!race.is_registered ? "gradient-primary border-0 text-white hover:opacity-90" : ""}`}
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
                        size="icon"
                        onClick={() => window.open(race.registration_url!, "_blank")}
                        className="shrink-0"
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
  );

  return (
    <div className="min-h-screen bg-background safe-area-inset-top pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-4"
      >
        <h1 className="text-2xl font-bold text-foreground">Races</h1>
        <p className="text-muted-foreground text-sm">Upcoming club events and races</p>
      </motion.header>

      <div className="px-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="calendar" className="space-y-4">
            <TabsList className="w-full grid grid-cols-2 h-11">
              <TabsTrigger value="calendar" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Calendar className="w-4 h-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <List className="w-4 h-4" />
                List
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-4">
              <RaceCalendar 
                races={races || []} 
                onRaceSelect={setSelectedRace}
              />
            </TabsContent>

            <TabsContent value="list" className="mt-4">
              <RaceListView />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Race Detail Sheet */}
      <Sheet open={!!selectedRace} onOpenChange={(open) => !open && setSelectedRace(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          {selectedRace && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="text-xl">{selectedRace.name}</SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-4">
                {selectedRace.image_url && (
                  <div className="h-48 rounded-xl overflow-hidden bg-muted">
                    <img 
                      src={selectedRace.image_url} 
                      alt={selectedRace.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl gradient-primary flex flex-col items-center justify-center">
                    <span className="text-xs text-white/90 font-medium">
                      {format(new Date(selectedRace.race_date), "MMM").toUpperCase()}
                    </span>
                    <span className="text-2xl font-bold text-white">
                      {format(new Date(selectedRace.race_date), "d")}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {format(new Date(selectedRace.race_date), "EEEE, MMMM d, yyyy")}
                    </p>
                    {selectedRace.location && (
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{selectedRace.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="gradient-primary text-white px-3 py-1.5 rounded-full font-medium">
                    {selectedRace.distance_type}
                  </span>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{selectedRace.participant_count || 0} participants</span>
                  </div>
                </div>

                {selectedRace.description && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">About</h3>
                    <p className="text-muted-foreground">{selectedRace.description}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant={selectedRace.is_registered ? "secondary" : "default"}
                    className={`flex-1 h-12 ${!selectedRace.is_registered ? "gradient-primary border-0 text-white hover:opacity-90" : ""}`}
                    onClick={() => {
                      handleRegister(selectedRace.id, selectedRace.is_registered || false);
                      setSelectedRace(null);
                    }}
                    disabled={registerMutation.isPending || unregisterMutation.isPending}
                  >
                    {selectedRace.is_registered ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Registered
                      </>
                    ) : (
                      "Join Race"
                    )}
                  </Button>
                  {selectedRace.registration_url && (
                    <Button
                      variant="outline"
                      className="h-12"
                      onClick={() => window.open(selectedRace.registration_url!, "_blank")}
                    >
                      External Link
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Races;
