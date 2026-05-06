import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Clock, Users, Check, Calendar, Loader2, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGroupRunDetail, useRsvpGroupRun, useCheckinGroupRun } from "@/hooks/useGroupRuns";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { format, isPast, isToday } from "date-fns";

const GroupRunDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: run, isLoading, isError } = useGroupRunDetail(id || "");
  const rsvpMutation = useRsvpGroupRun();
  const checkinMutation = useCheckinGroupRun();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !run) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-base font-semibold text-foreground">Could not load this group run</p>
          <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
          <Button onClick={() => navigate("/group-runs")}>Back to Group Runs</Button>
        </div>
      </div>
    );
  }

  const runDate = new Date(run.run_date);
  const isRunToday = isToday(runDate);
  const isRunPast = isPast(runDate) && !isRunToday;
  const going = run.rsvps?.filter((r: any) => r.status === 'going') || [];
  const maybe = run.rsvps?.filter((r: any) => r.status === 'maybe') || [];

  const handleRsvp = async (status: string) => {
    try {
      await rsvpMutation.mutateAsync({ id: id!, status });
      toast.success(status === 'going' ? "You're in!" : status === 'maybe' ? "Marked as maybe" : "RSVP removed");
    } catch {
      toast.error("Failed to update RSVP");
    }
  };

  const handleCheckin = async () => {
    try {
      await checkinMutation.mutateAsync({ id: id! });
      toast.success("Checked in!");
    } catch {
      toast.error("Failed to check in");
    }
  };

  return (
    <div className="min-h-screen bg-background safe-area-inset-top pb-24">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm font-medium mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </motion.header>

      <div className="px-4 space-y-5">
        {/* Run Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={`border-border/50 overflow-hidden ${isRunToday ? "border-primary/40" : ""}`}>
            {isRunToday && <div className="h-1 bg-gradient-to-r from-primary via-orange-400 to-amber-400" />}
            <CardContent className="p-5 space-y-4">
              <div>
                <h1 className="text-xl font-black text-foreground tracking-tight">{run.title}</h1>
                {run.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{run.description}</p>}
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{format(runDate, "EEEE, MMM d, yyyy")}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{format(runDate, "h:mm a")}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{run.location}</span>
                {run.meeting_point && <span className="text-xs">Meeting: {run.meeting_point}</span>}
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {run.distance_km && <span className="bg-white/5 px-2.5 py-1 rounded-lg font-medium">{run.distance_km} km</span>}
                {run.pace_group && <span className="bg-white/5 px-2.5 py-1 rounded-lg font-medium">{run.pace_group}</span>}
                <span className="flex items-center gap-1 text-primary font-medium"><Users className="w-3 h-3" />{going.length} going</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* RSVP Buttons */}
        {!isRunPast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2">
            <Button
              onClick={() => handleRsvp('going')}
              disabled={rsvpMutation.isPending}
              className={`flex-1 h-11 text-sm font-bold rounded-xl ${run.my_rsvp === 'going' ? 'bg-primary text-white' : 'bg-white/5 text-foreground hover:bg-white/10'}`}
            >
              <Check className="w-4 h-4 mr-1.5" /> Going
            </Button>
            <Button
              onClick={() => handleRsvp('maybe')}
              disabled={rsvpMutation.isPending}
              variant="outline"
              className={`flex-1 h-11 text-sm font-medium rounded-xl ${run.my_rsvp === 'maybe' ? 'border-primary text-primary' : ''}`}
            >
              Maybe
            </Button>
            {run.my_rsvp && (
              <Button onClick={() => handleRsvp('not_going')} disabled={rsvpMutation.isPending} variant="ghost" className="h-11 text-sm text-muted-foreground rounded-xl">
                Cancel
              </Button>
            )}
          </motion.div>
        )}

        {/* Check-in (only on run day) */}
        {isRunToday && !run.my_attended && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Button onClick={handleCheckin} disabled={checkinMutation.isPending} className="w-full h-12 text-sm font-bold uppercase tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              <UserCheck className="w-4 h-4 mr-2" /> Check In
            </Button>
          </motion.div>
        )}

        {run.my_attended && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>
                <span className="text-sm font-bold text-emerald-400">You attended this run!</span>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Going List */}
        {going.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Going ({going.length})</h2>
            <div className="space-y-2">
              {going.map((r: any) => (
                <PersonRow key={r.user_id} person={r} />
              ))}
            </div>
          </motion.div>
        )}

        {maybe.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Maybe ({maybe.length})</h2>
            <div className="space-y-2">
              {maybe.map((r: any) => (
                <PersonRow key={r.user_id} person={r} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Attendance */}
        {run.attendance?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Attended ({run.attendance.length})</h2>
            <div className="space-y-2">
              {run.attendance.map((a: any) => (
                <PersonRow key={a.user_id} person={a} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

function PersonRow({ person }: { person: any }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <Avatar className="w-8 h-8 border border-white/10">
        <AvatarImage src={person.avatar_url || undefined} />
        <AvatarFallback className="bg-white/5 text-xs font-bold">{person.display_name?.[0] || "?"}</AvatarFallback>
      </Avatar>
      {person.member_id ? (
        <Link to={`/m/${person.member_id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
          {person.display_name}
        </Link>
      ) : (
        <span className="text-sm font-medium text-foreground">{person.display_name}</span>
      )}
    </div>
  );
}

export default GroupRunDetail;
