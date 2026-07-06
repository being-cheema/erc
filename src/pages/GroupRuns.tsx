import { motion } from "framer-motion";
import { MapPin, Clock, Users, ChevronRight, Loader2, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useGroupRuns } from "@/hooks/useGroupRuns";
import { useNavigate, Link } from "react-router-dom";
import { format, isPast, isFuture, isToday } from "date-fns";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { ListErrorState } from "@/components/ListErrorState";

const GroupRuns = () => {
  const navigate = useNavigate();
  const { data: runs, isLoading, isError, refetch } = useGroupRuns();
  const { isAdmin } = useIsAdmin();

  const upcoming = runs?.filter((r: any) => !isPast(new Date(r.run_date)) || isToday(new Date(r.run_date))) || [];
  const past = runs?.filter((r: any) => isPast(new Date(r.run_date)) && !isToday(new Date(r.run_date))) || [];

  return (
    <div className="min-h-screen bg-background safe-area-inset-top pb-24">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-4"
      >
        <h1 className="text-2xl font-black tracking-tight text-foreground">Group Runs</h1>
        <p className="text-muted-foreground text-xs font-medium mt-1">Run together, grow together</p>
      </motion.header>

      <div className="px-4 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <ListErrorState onRetry={() => refetch()} />
        ) : !runs?.length ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <CalendarDays className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">No Group Runs Yet</h2>
            {isAdmin ? (
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs font-medium max-w-xs mx-auto">
                  Create your first group run so members can RSVP and check in.
                </p>
                <Link to="/admin">
                  <Button size="sm">Create Group Run</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs font-medium max-w-xs mx-auto">
                  Check back soon — the club will post upcoming group runs here.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Link to="/challenges">
                    <Button size="sm" variant="outline">Explore Challenges</Button>
                  </Link>
                  <Link to="/races">
                    <Button size="sm" variant="outline">View Races</Button>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Upcoming</h2>
                <div className="space-y-3">
                  {upcoming.map((run: any, i: number) => (
                    <RunCard key={run.id} run={run} index={i} onClick={() => navigate(`/group-runs/${run.id}`)} />
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Past Runs</h2>
                <div className="space-y-3">
                  {past.map((run: any, i: number) => (
                    <RunCard key={run.id} run={run} index={i} isPast onClick={() => navigate(`/group-runs/${run.id}`)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function RunCard({ run, index, isPast: past, onClick }: { run: any; index: number; isPast?: boolean; onClick: () => void }) {
  const runDate = new Date(run.run_date);
  const isRunToday = isToday(runDate);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={`border-border/50 cursor-pointer active:scale-[0.98] transition-transform ${isRunToday ? "border-primary/40 bg-primary/5" : ""} ${past ? "opacity-60" : ""}`}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${isRunToday ? "bg-primary text-primary-foreground" : "bg-white/5 text-foreground"}`}>
              <span className="text-lg font-black leading-none">{format(runDate, "d")}</span>
              <span className="text-[10px] font-bold uppercase">{format(runDate, "MMM")}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm truncate">
                {run.title}
                {isRunToday && <span className="text-primary ml-1.5 text-xs font-bold">TODAY</span>}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(runDate, "h:mm a")}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {run.location}
                </span>
                {run.distance_km && (
                  <span>{run.distance_km} km</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-primary font-medium">
                  <Users className="w-3 h-3" />
                  {run.going_count} going
                </span>
                {Number(run.attended_count) > 0 && (
                  <span className="text-xs text-emerald-500 font-medium">{run.attended_count} attended</span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default GroupRuns;
