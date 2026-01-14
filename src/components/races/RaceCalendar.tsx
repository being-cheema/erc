import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Timer, 
  Users,
  Calendar as CalendarIcon 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addMonths, 
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addDays,
  eachDayOfInterval
} from "date-fns";
import type { Race } from "@/hooks/useRaces";

interface RaceCalendarProps {
  races: Race[];
  onRaceSelect?: (race: Race) => void;
}

const RaceCalendar = ({ races, onRaceSelect }: RaceCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get days for the calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Map races to dates
  const racesByDate = useMemo(() => {
    const map = new Map<string, Race[]>();
    races?.forEach((race) => {
      const dateKey = format(new Date(race.race_date), "yyyy-MM-dd");
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(race);
    });
    return map;
  }, [races]);

  // Get races for selected date
  const selectedDateRaces = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return racesByDate.get(dateKey) || [];
  }, [selectedDate, racesByDate]);

  // Get upcoming races with countdowns
  const upcomingRaces = useMemo(() => {
    const now = new Date();
    return races
      ?.filter((race) => new Date(race.race_date) >= now)
      .slice(0, 3) || [];
  }, [races]);

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const formatCountdown = (raceDate: string) => {
    const now = new Date();
    const date = new Date(raceDate);
    const days = differenceInDays(date, now);
    
    if (days < 0) return "Past";
    if (days === 0) {
      const hours = differenceInHours(date, now);
      if (hours <= 0) return "Today!";
      return `${hours}h`;
    }
    if (days === 1) return "Tomorrow";
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.ceil(days / 7)} weeks`;
    return `${Math.ceil(days / 30)} months`;
  };

  const getCountdownColor = (raceDate: string) => {
    const days = differenceInDays(new Date(raceDate), new Date());
    if (days <= 0) return "text-success";
    if (days <= 7) return "text-warning";
    return "text-primary";
  };

  return (
    <div className="space-y-4">
      {/* Countdown Cards */}
      {upcomingRaces.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Timer className="w-4 h-4" />
            Coming Up
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {upcomingRaces.map((race) => (
              <motion.div
                key={race.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="shrink-0"
              >
                <Card 
                  className="w-[160px] border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => {
                    setSelectedDate(new Date(race.race_date));
                    setCurrentMonth(new Date(race.race_date));
                  }}
                >
                  <CardContent className="p-3">
                    <div className={cn(
                      "text-2xl font-bold mb-1",
                      getCountdownColor(race.race_date)
                    )}>
                      {formatCountdown(race.race_date)}
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {race.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(race.race_date), "MMM d")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold text-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayRaces = racesByDate.get(dateKey) || [];
              const hasRaces = dayRaces.length > 0;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);

              return (
                <motion.button
                  key={index}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative aspect-square flex flex-col items-center justify-center rounded-lg transition-colors",
                    isCurrentMonth ? "text-foreground" : "text-muted-foreground/40",
                    isSelected && "bg-primary text-primary-foreground",
                    !isSelected && isCurrentDay && "bg-accent",
                    !isSelected && hasRaces && isCurrentMonth && "bg-primary/10",
                    !isSelected && "hover:bg-accent/50"
                  )}
                >
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected && "text-primary-foreground"
                  )}>
                    {format(day, "d")}
                  </span>
                  
                  {/* Race Indicators */}
                  {hasRaces && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayRaces.slice(0, 3).map((race, i) => (
                        <div
                          key={race.id}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isSelected 
                              ? "bg-primary-foreground" 
                              : race.is_registered 
                                ? "bg-success" 
                                : "bg-primary"
                          )}
                        />
                      ))}
                      {dayRaces.length > 3 && (
                        <span className={cn(
                          "text-[8px] font-bold",
                          isSelected ? "text-primary-foreground" : "text-primary"
                        )}>
                          +{dayRaces.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Races */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h3>

            {selectedDateRaces.length > 0 ? (
              selectedDateRaces.map((race) => (
                <motion.div
                  key={race.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card 
                    className={cn(
                      "border-border/50 cursor-pointer hover:border-primary/50 transition-colors",
                      race.is_registered && "border-success/30 bg-success/5"
                    )}
                    onClick={() => onRaceSelect?.(race)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] text-white/90 font-medium">
                            {format(new Date(race.race_date), "MMM").toUpperCase()}
                          </span>
                          <span className="text-lg font-bold text-white leading-none">
                            {format(new Date(race.race_date), "d")}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground">{race.name}</h4>
                          {race.location && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground text-sm truncate">
                                {race.location}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs gradient-primary text-white px-2 py-0.5 rounded-full font-medium">
                              {race.distance_type}
                            </span>
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                              <Users className="w-3 h-3" />
                              <span>{race.participant_count || 0}</span>
                            </div>
                            {race.is_registered && (
                              <span className="text-xs text-success font-medium">
                                ✓ Registered
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={cn(
                          "text-right",
                          getCountdownColor(race.race_date)
                        )}>
                          <div className="text-lg font-bold">
                            {formatCountdown(race.race_date)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            to go
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card className="border-border/50 border-dashed">
                <CardContent className="p-6 text-center">
                  <CalendarIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    No races on this date
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RaceCalendar;
