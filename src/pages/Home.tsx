import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ChevronRight, Settings, Dumbbell, Link as LinkIcon, Users, Zap, Medal, IdCard, Trophy, Flame, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useUserRank } from "@/hooks/useUserRank";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isPast, isToday } from "date-fns";
import logo from "@/assets/logo.png";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import { useHaptics } from "@/hooks/useHaptics";
import BentoStatsGrid from "@/components/home/BentoStatsGrid";
import ActivityFeed from "@/components/home/ActivityFeed";
import { useGroupRuns } from "@/hooks/useGroupRuns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import MembershipCard from "@/components/MembershipCard";
import { ListErrorState } from "@/components/ListErrorState";

const STRAVA_NUDGE_KEY = "strava_nudge_dismissed";
const STRAVA_NUDGE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function isStravaNudgeDismissed(): boolean {
  const raw = localStorage.getItem(STRAVA_NUDGE_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;
  return Date.now() - dismissedAt < STRAVA_NUDGE_TTL_MS;
}

function dismissStravaNudge() {
  localStorage.setItem(STRAVA_NUDGE_KEY, String(Date.now()));
}


const motivationalLines = [
  { regular: "Keep pushing", bold: "your limits." },
  { regular: "Every mile", bold: "counts." },
  { regular: "Chase the", bold: "next goal." },
  { regular: "Preparing for", bold: "the big move." },
  { regular: "Run further,", bold: "run stronger." },
];
const TUTORIAL_SEEN_KEY = "erc_tutorial_seen_v1";
const tutorialSteps = [
  {
    title: "Welcome to ERC",
    description:
      "This walkthrough explains each key area so first-time members know exactly where everything lives.",
    target: "",
  },
  {
    title: "Header Controls",
    description:
      "Top-right actions: Settings for account/preferences, My Card for membership QR, and avatar to open your profile settings quickly.",
    target: "my-card",
  },
  {
    title: "Connect Strava First",
    description:
      "If Strava is not connected, use the onboarding card to connect. This unlocks stats, streaks, leaderboard rank, PR scanning, and challenge progress.",
    target: "",
  },
  {
    title: "Stats Dashboard",
    description:
      "Your dashboard tracks rank, streak, and runs. Tap any stat card to drill into deeper analytics and trend charts.",
    target: "stats",
  },
  {
    title: "Group Runs",
    description:
      "Use this section for club meetups. Open it to view upcoming runs, RSVP, and check-in on run day.",
    target: "group-runs",
  },
  {
    title: "Training & Plans",
    description:
      "The Training tile takes you to plans and sessions so you can follow a structured routine.",
    target: "",
  },
  {
    title: "Quick Links",
    description:
      "PRs auto-detect best efforts from activities, Race Log stores official finishes, and Group Runs gives a quick jump to club events.",
    target: "",
  },
  {
    title: "Pull to Refresh",
    description:
      "On Home, pull down to refresh profile, activities, leaderboard rank, and monthly stats instantly.",
    target: "",
  },
  {
    title: "You are All Set",
    description:
      "Start by connecting Strava, checking Group Runs, and opening My Card. You can replay this tutorial anytime from Settings.",
    target: "",
  },
] as const;

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: profile, isError: profileError, refetch: refetchProfile } = useProfile();
  const { data: groupRuns } = useGroupRuns();
  const { data: userRank } = useUserRank();
  const { lightImpact } = useHaptics();
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [nudgeDismissed, setNudgeDismissed] = useState(isStravaNudgeDismissed);

  const {
    isRefreshing,
    pullDistance,
    threshold,
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = usePullToRefresh(() => {
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["activities"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard", "monthly"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard", "alltime"] });
    queryClient.invalidateQueries({ queryKey: ["user-rank"] });
    queryClient.invalidateQueries({ queryKey: ["monthly-stats"] });
  });

  const upcomingGroupRun = groupRuns
    ?.filter((run: any) => !isPast(new Date(run.run_date)) || isToday(new Date(run.run_date)))
    ?.sort((a: any, b: any) => new Date(a.run_date).getTime() - new Date(b.run_date).getTime())?.[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const handleCardTap = (path: string) => {
    lightImpact();
    navigate(path);
  };

  const currentStreak = profile?.current_streak || 0;
  const isNewUnconnectedUser = !!profile && !profile.strava_id && (profile.total_runs || 0) === 0;
  const showStravaNudge =
    !nudgeDismissed &&
    !!profile &&
    !profile.strava_id &&
    (isNewUnconnectedUser || (profile.total_runs || 0) > 0);
  const showStatsSection =
    !!profile?.strava_id || (!showStravaNudge && !isNewUnconnectedUser);
  const tutorialTarget = tutorialSteps[tutorialStep]?.target ?? "";
  
  // Pick a motivational line based on day
  const motLine = motivationalLines[new Date().getDay() % motivationalLines.length];

  useEffect(() => {
    if (!profile) return;
    const forced = new URLSearchParams(location.search).get("tutorial") === "1";
    const seen = localStorage.getItem(TUTORIAL_SEEN_KEY) === "1";
    if (forced || !seen) {
      setTutorialStep(0);
      setShowTutorial(true);
    }
  }, [profile, location.search]);

  const closeTutorial = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
    setShowTutorial(false);
  };

  const nextTutorial = () => {
    if (tutorialStep >= tutorialSteps.length - 1) {
      closeTutorial();
      return;
    }
    setTutorialStep((s) => s + 1);
  };

  const handleTutorialTargetTap = (target: "my-card" | "group-runs" | "stats", fallback: () => void) => {
    if (showTutorial && tutorialTarget === target) {
      nextTutorial();
      return;
    }
    fallback();
  };

  const handleDismissNudge = () => {
    dismissStravaNudge();
    setNudgeDismissed(true);
  };

  if (profileError) {
    return (
      <div className="min-h-screen bg-background safe-area-inset-top pb-32">
        <ListErrorState onRetry={() => refetchProfile()} />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-background safe-area-inset-top pb-32 overflow-y-auto relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <PullToRefresh 
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        threshold={threshold}
      />
      
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-6 pb-2"
        style={{ transform: `translateY(${pullDistance * 0.3}px)` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Erode Runners" className="h-10 w-auto" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {getGreeting()}
              </p>
              <h1 className="text-xl font-black text-foreground tracking-tight">
                {profile?.display_name || "Runner"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
              className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/10"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleTutorialTargetTap("my-card", () => setIsCardOpen(true))}
              className={`rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/10 ${showTutorial && tutorialTarget === "my-card" ? "relative z-[70] ring-2 ring-primary" : ""}`}
              aria-label="Open membership card"
            >
              <IdCard className="w-5 h-5" />
            </Button>
            <Avatar 
              className="w-10 h-10 cursor-pointer border-2 border-border rounded-full"
              onClick={() => navigate("/settings")}
            >
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-secondary text-foreground font-bold rounded-full">
                {profile?.display_name?.[0]?.toUpperCase() || "R"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </motion.header>

      {/* Motivational Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="px-5 pb-4"
      >
        <p className="text-lg text-muted-foreground">
          {motLine.regular}{" "}
          <span className="font-bold italic text-foreground">{motLine.bold}</span>
        </p>
      </motion.div>

      <div className="px-5 space-y-3">
        {/* Strava connect nudge — dismissible, re-shows after 14 days (Q11) */}
        {showStravaNudge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 text-center space-y-4 relative"
          >
            <button
              type="button"
              onClick={handleDismissNudge}
              aria-label="Dismiss Strava connect reminder"
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-strava/10 flex items-center justify-center">
              <LinkIcon className="w-8 h-8 text-strava" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {isNewUnconnectedUser ? "Connect Strava to get started" : "Reconnect Strava"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isNewUnconnectedUser
                  ? "Sync your runs to unlock stats, leaderboard rank, PR detection, and streak tracking."
                  : "Reconnect to resume sync for stats, challenges, and PR tracking."}
              </p>
            </div>
            <Button
              onClick={() => navigate("/connect-strava")}
              className="bg-strava hover:bg-strava-dark text-white gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              {isNewUnconnectedUser ? "Connect Now" : "Reconnect"}
            </Button>
          </motion.div>
        )}

        {showStatsSection && (
          <>
            <BentoStatsGrid />

            {/* Secondary Stats Row - Rank / Streak / Runs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-3"
            >
              <div
                className="glass-card p-4 text-center press-scale cursor-pointer"
                onClick={() => handleCardTap("/leaderboard")}
              >
                <p className="stat-label mb-1">Rank</p>
                <p className="text-3xl font-black text-foreground tracking-tight">
                  {userRank?.rank ? `#${userRank.rank}` : "—"}
                </p>
              </div>

              <div
                className={`glass-card p-4 text-center press-scale cursor-pointer ${showTutorial && tutorialTarget === "stats" ? "relative z-[70] ring-2 ring-primary" : ""}`}
                onClick={() => handleTutorialTargetTap("stats", () => handleCardTap("/stats"))}
              >
                <p className="stat-label mb-1">Streak</p>
                <p className="text-3xl font-black text-foreground tracking-tight">
                  {currentStreak}<span className="text-xs font-bold text-muted-foreground ml-0.5">D</span>
                </p>
              </div>

              <div
                className="glass-card p-4 text-center press-scale cursor-pointer"
                onClick={() => handleCardTap("/stats")}
              >
                <p className="stat-label mb-1">Runs</p>
                <p className="text-3xl font-black text-foreground tracking-tight">
                  {profile?.total_runs || 0}
                </p>
              </div>
            </motion.div>

            <ActivityFeed />
          </>
        )}

        {/* Primary Actions - Next Group Run + Training */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3"
        >
          <div 
            className={`press-scale cursor-pointer ${showTutorial && tutorialTarget === "group-runs" ? "relative z-[70] ring-2 ring-primary rounded-xl" : ""}`}
            onClick={() => handleTutorialTargetTap("group-runs", () => handleCardTap("/group-runs"))}
          >
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="stat-label">Next Group Run</p>
                    <p className="text-sm font-bold text-foreground">
                      {upcomingGroupRun
                        ? format(new Date(upcomingGroupRun.run_date), "MMM d")
                        : "View Runs"
                      }
                    </p>
                    {upcomingGroupRun && (
                      <p className="text-[11px] text-muted-foreground">
                        {upcomingGroupRun.going_count || 0} going
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div 
            className="press-scale cursor-pointer"
            onClick={() => handleCardTap("/training")}
          >
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="stat-label">Training</p>
                    <p className="text-sm font-bold text-foreground">View Plans</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="press-scale cursor-pointer" onClick={() => handleCardTap("/personal-records")}>
            <div className="glass-card p-4 text-center">
              <Zap className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-[11px] font-bold text-foreground">PRs</p>
            </div>
          </div>
          <div className="press-scale cursor-pointer" onClick={() => handleCardTap("/race-results")}>
            <div className="glass-card p-4 text-center">
              <Medal className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-[11px] font-bold text-foreground">Race Log</p>
            </div>
          </div>
          <div className="press-scale cursor-pointer" onClick={() => handleCardTap("/leaderboard")}>
            <div className="glass-card p-4 text-center">
              <Trophy className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-[11px] font-bold text-foreground">Ranks</p>
            </div>
          </div>
          <div className="press-scale cursor-pointer" onClick={() => handleCardTap("/challenges")}>
            <div className="glass-card p-4 text-center">
              <Flame className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-[11px] font-bold text-foreground">Challenges</p>
            </div>
          </div>
          <div className="press-scale cursor-pointer" onClick={() => setIsCardOpen(true)}>
            <div className="glass-card p-4 text-center">
              <IdCard className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-[11px] font-bold text-foreground">My Card</p>
            </div>
          </div>
        </motion.div>
      </div>

      <Sheet open={isCardOpen} onOpenChange={setIsCardOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-2xl border-border/50 px-4">
          <SheetHeader className="text-left mb-4">
            <SheetTitle>Membership Card</SheetTitle>
            <SheetDescription>Use this at club events and meetups.</SheetDescription>
          </SheetHeader>
          {profile?.member_id ? (
            <MembershipCard
              displayName={profile.display_name || "Member"}
              memberId={profile.member_id}
              joinDate={profile.created_at}
              avatarUrl={profile.avatar_url}
              expandable
            />
          ) : (
            <div className="text-sm text-muted-foreground">Membership card will appear after your profile is loaded.</div>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setIsCardOpen(false);
              navigate("/settings");
            }}
            className="w-full mt-4"
          >
            Open Settings
          </Button>
        </SheetContent>
      </Sheet>
      {showTutorial && (
        <div className="fixed inset-0 z-[65]">
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-x-4 bottom-6 rounded-2xl border border-border/50 bg-background p-4 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Tutorial {tutorialStep + 1}/{tutorialSteps.length}
            </p>
            <h3 className="text-lg font-bold text-foreground mt-1">{tutorialSteps[tutorialStep].title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{tutorialSteps[tutorialStep].description}</p>
            <div className="mt-4 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={closeTutorial}>Skip</Button>
              <div className="flex items-center gap-2">
                {tutorialStep > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setTutorialStep((s) => Math.max(0, s - 1))}>
                    Back
                  </Button>
                )}
                <Button size="sm" onClick={nextTutorial}>
                  {tutorialStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Home;
