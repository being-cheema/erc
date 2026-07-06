import { motion } from "framer-motion";
import { Trophy, Zap, Loader2, RefreshCw, Medal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMyPRs, useClubPRs, useScanPRs } from "@/hooks/usePersonalRecords";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { useActivities } from "@/hooks/useActivities";
import { useEffect, useRef } from "react";
import { ListErrorState } from "@/components/ListErrorState";

const CATEGORY_LABELS: Record<string, string> = {
  '5k': '5K',
  '10k': '10K',
  'half_marathon': 'Half Marathon',
  'marathon': 'Marathon',
  'longest_run': 'Longest Run',
};

function formatTime(seconds: number | null): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatPace(pace: number | null): string {
  if (!pace) return "—";
  const m = Math.floor(pace);
  const s = Math.round((pace - m) * 60);
  return `${m}:${String(s).padStart(2, '0')} /km`;
}

const PersonalRecords = () => {
  const { data: myPRs, isLoading: myLoading, isError: myError, refetch: refetchMyPRs } = useMyPRs();
  const { data: clubPRs, isLoading: clubLoading, isError: clubError, refetch: refetchClubPRs } = useClubPRs();
  const { data: profile } = useProfile();
  const { data: activities } = useActivities(1);
  const scanMutation = useScanPRs();
  const hasAutoScanned = useRef(false);
  const hasStrava = !!profile?.strava_id;
  const hasActivities = (activities?.length || 0) > 0;
  const shouldAutoScan = hasStrava && hasActivities && !myLoading && (myPRs?.length || 0) === 0;

  useEffect(() => {
    if (shouldAutoScan && !scanMutation.isPending && !hasAutoScanned.current) {
      hasAutoScanned.current = true;
      scanMutation.mutate(undefined, {
        onSuccess: () => toast.success("Scanned your activities for PRs"),
        onError: () => toast.error("Failed to scan PRs"),
      });
    }
  }, [shouldAutoScan, scanMutation]);

  const handleScan = async () => {
    try {
      await scanMutation.mutateAsync();
      toast.success("PRs updated!");
    } catch {
      toast.error("Failed to scan PRs");
    }
  };

  return (
    <div className="min-h-screen bg-background safe-area-inset-top pb-24">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Personal Records</h1>
            <p className="text-muted-foreground text-xs font-medium mt-1">Your best performances</p>
          </div>
          <Button
            onClick={handleScan}
            disabled={scanMutation.isPending}
            variant="ghost"
            size="icon"
            className="rounded-xl"
          >
            <RefreshCw className={`w-5 h-5 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </motion.header>

      <div className="px-4">
        <Tabs defaultValue="mine" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 rounded-xl bg-white/5">
            <TabsTrigger value="mine" className="text-xs font-bold uppercase tracking-wide rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              My PRs
            </TabsTrigger>
            <TabsTrigger value="club" className="text-xs font-bold uppercase tracking-wide rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Club Records
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="space-y-3">
            {myLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : myError ? (
              <ListErrorState onRetry={() => refetchMyPRs()} />
            ) : shouldAutoScan || scanMutation.isPending ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-2">Scanning your activities...</h2>
                <p className="text-muted-foreground text-xs font-medium max-w-xs mx-auto">
                  We are checking your synced runs for personal records.
                </p>
              </div>
            ) : !myPRs?.length ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Zap className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-2">No PRs Yet</h2>
                {hasStrava ? (
                  <p className="text-muted-foreground text-xs font-medium max-w-xs mx-auto">
                    Sync more activities from Strava and use refresh to detect new personal records.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-muted-foreground text-xs font-medium max-w-xs mx-auto">
                      Connect Strava to auto-detect your personal records from real runs.
                    </p>
                    <Link to="/settings">
                      <Button size="sm" variant="outline">Connect via Settings</Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              myPRs.map((pr: any, i: number) => (
                <motion.div key={pr.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Trophy className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground text-sm">{CATEGORY_LABELS[pr.category] || pr.category}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            {pr.category === 'longest_run' ? (
                              <span className="text-foreground font-bold text-lg">{(pr.distance / 1000).toFixed(2)} km</span>
                            ) : (
                              <span className="text-foreground font-bold text-lg">{formatTime(pr.time_seconds)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            {pr.pace && <span>{formatPace(Number(pr.pace))}</span>}
                            {pr.achieved_at && <span>{format(new Date(pr.achieved_at), "MMM d, yyyy")}</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="club" className="space-y-3">
            {clubLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : clubError ? (
              <ListErrorState onRetry={() => refetchClubPRs()} />
            ) : !clubPRs?.length ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Medal className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-2">No Club Records Yet</h2>
                <p className="text-muted-foreground text-xs font-medium">Records will appear as members sync their activities.</p>
              </div>
            ) : (
              clubPRs.map((pr: any, i: number) => (
                <motion.div key={pr.category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Medal className="w-6 h-6 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{CATEGORY_LABELS[pr.category] || pr.category}</p>
                          <p className="text-foreground font-black text-lg mt-0.5">{formatTime(pr.time_seconds)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={pr.avatar_url || undefined} />
                              <AvatarFallback className="text-[8px] bg-white/5">{pr.display_name?.[0]}</AvatarFallback>
                            </Avatar>
                            {pr.member_id ? (
                              <Link to={`/m/${pr.member_id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                {pr.display_name}
                              </Link>
                            ) : (
                              <span className="text-xs text-muted-foreground">{pr.display_name}</span>
                            )}
                            {pr.achieved_at && <span className="text-xs text-muted-foreground">· {format(new Date(pr.achieved_at), "MMM yyyy")}</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PersonalRecords;
