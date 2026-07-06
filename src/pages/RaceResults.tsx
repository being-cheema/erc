import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Plus, Trash2, Loader2, Medal, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMyRaceResults, usePBBoard, useAddRaceResult, useDeleteRaceResult } from "@/hooks/useRaceResults";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { ListErrorState } from "@/components/ListErrorState";

const CATEGORIES: Record<string, string> = {
  '5k': '5K', '10k': '10K', 'half_marathon': 'Half Marathon',
  'marathon': 'Marathon', 'ultra': 'Ultra', 'other': 'Other',
};

function normalizeTimeInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4)}`;
}

function parseTimeToSeconds(timeInput: string): number {
  const parts = timeInput.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return 0;
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    if (seconds > 59) return 0;
    return (minutes * 60) + seconds;
  }
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    if (minutes > 59 || seconds > 59) return 0;
    return (hours * 3600) + (minutes * 60) + seconds;
  }
  return 0;
}

function formatFinishTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const RaceResults = () => {
  const { data: myResults, isLoading: myLoading, isError: myError, refetch: refetchMyResults } = useMyRaceResults();
  const { data: pbBoard, isLoading: pbLoading, isError: pbError, refetch: refetchPbBoard } = usePBBoard();
  const addMutation = useAddRaceResult();
  const deleteMutation = useDeleteRaceResult();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ race_name: '', race_date: '', distance_category: '5k', finish_time: '', bib_number: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalSeconds = parseTimeToSeconds(form.finish_time);
    if (!form.race_name || !form.race_date || totalSeconds <= 0) {
      toast.error("Fill in race name, date, and time");
      return;
    }
    try {
      await addMutation.mutateAsync({
        race_name: form.race_name,
        race_date: form.race_date,
        distance_category: form.distance_category,
        finish_time_seconds: totalSeconds,
        bib_number: form.bib_number || undefined,
      });
      toast.success("Race result logged!");
      setShowForm(false);
      setForm({ race_name: '', race_date: '', distance_category: '5k', finish_time: '', bib_number: '' });
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-background safe-area-inset-top pb-24">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Race Results</h1>
            <p className="text-muted-foreground text-xs font-medium mt-1">Log your official finishes</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="icon" className="rounded-xl bg-primary text-white">
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </Button>
        </div>
      </motion.header>

      <div className="px-4 space-y-4">
        {/* Add Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <Card className="border-primary/30">
              <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="text" placeholder="Race name" value={form.race_name}
                    onChange={e => setForm(f => ({ ...f, race_name: e.target.value }))}
                    className="w-full bg-white/5 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date" value={form.race_date}
                      onChange={e => setForm(f => ({ ...f, race_date: e.target.value }))}
                      className="bg-white/5 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                    <select
                      value={form.distance_category}
                      onChange={e => setForm(f => ({ ...f, distance_category: e.target.value }))}
                      className="bg-white/5 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                      {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Finish time (MM:SS or HH:MM:SS)"
                    value={form.finish_time}
                    onChange={e => setForm(f => ({ ...f, finish_time: normalizeTimeInput(e.target.value) }))}
                    className="w-full bg-white/5 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                  <input type="text" placeholder="Bib number (optional)" value={form.bib_number}
                    onChange={e => setForm(f => ({ ...f, bib_number: e.target.value }))}
                    className="w-full bg-white/5 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                  <Button type="submit" disabled={addMutation.isPending} className="w-full h-11 text-sm font-bold rounded-xl">
                    {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Result
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs defaultValue="mine" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 h-12 p-1 rounded-xl bg-white/5">
            <TabsTrigger value="mine" className="text-xs font-bold uppercase tracking-wide rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">My Results</TabsTrigger>
            <TabsTrigger value="pb" className="text-xs font-bold uppercase tracking-wide rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Club PBs</TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="space-y-3">
            {myLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : myError ? (
              <ListErrorState onRetry={() => refetchMyResults()} />
            ) : !myResults?.length ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4"><Trophy className="w-10 h-10 text-muted-foreground" /></div>
                <h2 className="text-lg font-bold text-foreground mb-2">No Results Yet</h2>
                <p className="text-muted-foreground text-xs font-medium">Tap the + button to log your first race finish.</p>
              </div>
            ) : (
              myResults.map((r: any, i: number) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground text-sm truncate">{r.race_name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>{format(new Date(r.race_date), "MMM d, yyyy")}</span>
                            <span className="bg-white/5 px-1.5 py-0.5 rounded">{CATEGORIES[r.distance_category]}</span>
                            {r.bib_number && <span>#{r.bib_number}</span>}
                          </div>
                          <p className="text-foreground font-black text-lg mt-1">{formatFinishTime(r.finish_time_seconds)}</p>
                        </div>
                        <Button onClick={() => handleDelete(r.id)} variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="pb" className="space-y-3">
            {pbLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : pbError ? (
              <ListErrorState onRetry={() => refetchPbBoard()} />
            ) : !pbBoard?.length ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4"><Medal className="w-10 h-10 text-muted-foreground" /></div>
                <h2 className="text-lg font-bold text-foreground mb-2">No Club PBs Yet</h2>
                <p className="text-muted-foreground text-xs font-medium">PBs appear as members log race results.</p>
              </div>
            ) : (
              pbBoard.map((pb: any, i: number) => (
                <motion.div key={pb.distance_category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Medal className="w-6 h-6 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{CATEGORIES[pb.distance_category]}</p>
                          <p className="text-foreground font-black text-lg mt-0.5">{formatFinishTime(pb.finish_time_seconds)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={pb.avatar_url || undefined} />
                              <AvatarFallback className="text-[8px] bg-white/5">{pb.display_name?.[0]}</AvatarFallback>
                            </Avatar>
                            {pb.member_id ? (
                              <Link to={`/m/${pb.member_id}`} className="text-xs text-muted-foreground hover:text-primary">{pb.display_name}</Link>
                            ) : (
                              <span className="text-xs text-muted-foreground">{pb.display_name}</span>
                            )}
                            <span className="text-xs text-muted-foreground">· {pb.race_name}</span>
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

export default RaceResults;
