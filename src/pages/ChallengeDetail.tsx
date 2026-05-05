import { motion } from "framer-motion";
import { ArrowLeft, Users, Clock, Trophy, Loader2, Check, Target, Flame, Mountain, Footprints, TrendingUp, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChallengeDetail, useJoinChallenge, useLeaveChallenge } from "@/hooks/useChallenges";
import { useCurrentUser } from "@/hooks/useProfile";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { format, differenceInDays, isPast, isFuture } from "date-fns";

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

const formatProgressValue = (value: number, type: string) => {
  switch (type) {
    case "distance":
    case "single_run":
      return `${(value / 1000).toFixed(1)} km`;
    case "elevation":
      return `${value.toFixed(0)}m`;
    case "runs":
      return `${value} runs`;
    case "streak":
      return `${value} days`;
    default:
      return `${value}`;
  }
};

const ChallengeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: challenge, isLoading } = useChallengeDetail(id || "");
  const { user } = useCurrentUser();
  const joinMutation = useJoinChallenge();
  const leaveMutation = useLeaveChallenge();

  if (isLoading || !challenge) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isJoined = !!challenge.my_participation;
  const isCompleted = challenge.my_participation?.is_completed || false;
  const progress = challenge.my_participation?.current_progress || 0;
  const progressPct = Math.min(100, (progress / Number(challenge.target_value)) * 100);
  const Icon = getChallengeIcon(challenge.challenge_type);

  const now = new Date();
  const start = new Date(challenge.start_date);
  const end = challenge.end_date ? new Date(challenge.end_date) : null;
  const hasEnded = end ? isPast(end) : false;
  const hasStarted = !isFuture(start);
  const daysLeft = end ? differenceInDays(end, now) : null;

  const handleJoin = async () => {
    try {
      await joinMutation.mutateAsync(challenge.id);
      toast.success("You joined the challenge!");
    } catch {
      toast.error("Failed to join challenge");
    }
  };

  const handleLeave = async () => {
    try {
      await leaveMutation.mutateAsync(challenge.id);
      toast.success("Left the challenge");
    } catch {
      toast.error("Failed to leave challenge");
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
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </motion.header>

      <div className="px-4 space-y-5">
        {/* Challenge Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-border/50 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-orange-400 to-amber-400" />
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-black text-foreground tracking-tight">{challenge.title}</h1>
                  {challenge.description && (
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{challenge.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {challenge.participant_count} joined
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {hasEnded
                        ? "Ended"
                        : !hasStarted
                          ? `Starts ${format(start, "MMM d")}`
                          : daysLeft !== null
                            ? `${daysLeft}d remaining`
                            : "Open-ended"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      {formatProgressValue(Number(challenge.target_value), challenge.challenge_type)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress (if joined) */}
        {isJoined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`border-border/50 ${isCompleted ? "border-emerald-500/30 bg-emerald-500/5" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {isCompleted ? "Completed" : "Your Progress"}
                  </span>
                  {isCompleted && (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-bold">Done</span>
                    </div>
                  )}
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-3xl font-black text-foreground">
                    {formatProgressValue(progress, challenge.challenge_type)}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium pb-1">
                    / {formatProgressValue(Number(challenge.target_value), challenge.challenge_type)}
                  </span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className={`h-full rounded-full ${isCompleted ? "bg-emerald-500" : "bg-primary"}`}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">
                  {progressPct.toFixed(0)}% complete
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Join / Leave Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {!isJoined ? (
            <Button
              onClick={handleJoin}
              disabled={hasEnded || joinMutation.isPending}
              className="w-full h-12 text-sm font-bold uppercase tracking-wide bg-primary hover:bg-primary/90 text-white rounded-xl"
            >
              {joinMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trophy className="w-4 h-4 mr-2" />
              )}
              {hasEnded ? "Challenge Ended" : "Join Challenge"}
            </Button>
          ) : (
            <Button
              onClick={handleLeave}
              disabled={leaveMutation.isPending}
              variant="outline"
              className="w-full h-10 text-xs font-medium text-muted-foreground rounded-xl"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Leave Challenge
            </Button>
          )}
        </motion.div>

        {/* Leaderboard */}
        {challenge.leaderboard && challenge.leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Leaderboard
            </h2>
            <div className="space-y-2">
              {challenge.leaderboard.map((entry, index) => {
                const isMe = entry.user_id === user?.id;
                const entryPct = (Number(entry.current_progress) / Number(challenge.target_value)) * 100;
                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 + 0.25 }}
                  >
                    <Card className={`border-border/50 ${isMe ? "border-primary/30 bg-primary/[0.05]" : ""}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black
                            ${index === 0 ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground"}
                          `}>
                            {index + 1}
                          </div>
                          <Avatar className="w-8 h-8 border border-white/10">
                            <AvatarImage src={entry.avatar_url || undefined} />
                            <AvatarFallback className="bg-white/5 text-xs font-bold">
                              {entry.display_name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground text-sm truncate">
                              {entry.display_name}
                              {isMe && <span className="text-primary ml-1">(you)</span>}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${entry.is_completed ? "bg-emerald-500" : "bg-primary/60"}`}
                                  style={{ width: `${Math.min(100, entryPct)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground font-medium shrink-0">
                                {formatProgressValue(Number(entry.current_progress), challenge.challenge_type)}
                              </span>
                            </div>
                          </div>
                          {entry.is_completed && (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ChallengeDetail;
