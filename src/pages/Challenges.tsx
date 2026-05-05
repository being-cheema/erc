import { motion } from "framer-motion";
import { Trophy, Users, Clock, ChevronRight, Loader2, Target, Flame, Mountain, Footprints, TrendingUp, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useChallenges, Challenge } from "@/hooks/useChallenges";
import { useNavigate } from "react-router-dom";
import { useHaptics } from "@/hooks/useHaptics";
import { differenceInDays, isPast, isFuture } from "date-fns";

const getChallengeIcon = (type: string) => {
  switch (type) {
    case "distance": return Footprints;
    case "runs": return Target;
    case "streak": return Flame;
    case "single_run": return TrendingUp;
    case "elevation": return Mountain;
    default: return Trophy;
  }
};

const formatTarget = (challenge: Challenge) => {
  const val = Number(challenge.target_value);
  switch (challenge.challenge_type) {
    case "distance": return `${(val / 1000).toFixed(0)} km`;
    case "runs": return `${val} runs`;
    case "streak": return `${val} day streak`;
    case "single_run": return `${(val / 1000).toFixed(0)} km single run`;
    case "elevation": return `${val.toFixed(0)}m elevation`;
    default: return `${val}`;
  }
};

const formatProgress = (challenge: Challenge) => {
  const progress = Number(challenge.my_progress || 0);
  switch (challenge.challenge_type) {
    case "distance":
    case "single_run":
      return `${(progress / 1000).toFixed(1)} km`;
    case "elevation":
      return `${progress.toFixed(0)}m`;
    case "runs":
      return `${progress} runs`;
    case "streak":
      return `${progress} days`;
    default:
      return `${progress}`;
  }
};

const getStatus = (challenge: Challenge) => {
  const now = new Date();
  const start = new Date(challenge.start_date);
  const end = challenge.end_date ? new Date(challenge.end_date) : null;

  if (isFuture(start)) {
    const days = differenceInDays(start, now);
    return { label: `Starts in ${days}d`, color: "text-blue-400", bg: "bg-blue-500/10" };
  }
  if (end && isPast(end)) {
    return { label: "Ended", color: "text-white/40", bg: "bg-white/5" };
  }
  if (end) {
    const days = differenceInDays(end, now);
    return { label: `${days}d left`, color: "text-amber-400", bg: "bg-amber-500/10" };
  }
  return { label: "Active", color: "text-emerald-400", bg: "bg-emerald-500/10" };
};

const Challenges = () => {
  const { data: challenges, isLoading } = useChallenges();
  const navigate = useNavigate();
  const { lightImpact } = useHaptics();

  const activeChallenges = challenges?.filter(c => {
    const end = c.end_date ? new Date(c.end_date) : null;
    return !end || !isPast(end);
  }) || [];

  const pastChallenges = challenges?.filter(c => {
    const end = c.end_date ? new Date(c.end_date) : null;
    return end && isPast(end);
  }) || [];

  const renderChallenge = (challenge: Challenge, index: number) => {
    const Icon = getChallengeIcon(challenge.challenge_type);
    const status = getStatus(challenge);
    const isJoined = !!challenge.my_participation_id;
    const progress = isJoined ? (Number(challenge.my_progress || 0) / Number(challenge.target_value)) * 100 : 0;

    return (
      <motion.div
        key={challenge.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => {
          lightImpact();
          navigate(`/challenges/${challenge.id}`);
        }}
      >
        <Card className="cursor-pointer card-hover border-border/50 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-foreground text-sm truncate">{challenge.title}</h3>
                  {challenge.my_completed && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{formatTarget(challenge)}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {challenge.participant_count}
                  </span>
                </div>
                {isJoined && (
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground font-medium">{formatProgress(challenge)}</span>
                      <span className="text-primary font-bold">{Math.min(100, progress).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground self-center shrink-0" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background safe-area-inset-top pb-24">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-4"
      >
        <h1 className="text-2xl font-black tracking-tight text-foreground">Challenges</h1>
        <p className="text-muted-foreground text-xs font-medium mt-1">Compete and push your limits</p>
      </motion.header>

      <div className="px-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !challenges || challenges.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Trophy className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">No Challenges Yet</h2>
            <p className="text-muted-foreground text-xs font-medium max-w-xs mx-auto">
              Challenges will be posted here. Stay tuned!
            </p>
          </motion.div>
        ) : (
          <>
            {activeChallenges.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active</h2>
                {activeChallenges.map((c, i) => renderChallenge(c, i))}
              </div>
            )}
            {pastChallenges.length > 0 && (
              <div className="space-y-3 mt-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Past</h2>
                {pastChallenges.map((c, i) => renderChallenge(c, i + activeChallenges.length))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Challenges;
