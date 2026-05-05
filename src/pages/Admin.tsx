import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy, BookOpen, Target, Plus, Trash2, Edit2, Save, X,
  ArrowLeft, Loader2, Calendar, AlertTriangle, Flame
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Race {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  distance_type: string;
  race_date: string;
  image_url: string | null;
  registration_url: string | null;
  is_published: boolean | null;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  image_url: string | null;
  is_published: boolean | null;
}

interface TrainingPlan {
  id: string;
  name: string;
  description: string | null;
  level: string;
  goal_distance: string;
  duration_weeks: number;
  is_published: boolean | null;
}

interface AdminChallenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  target_value: number;
  target_unit: string;
  start_date: string;
  end_date: string | null;
  count_from: string;
  is_published: boolean | null;
  participant_count: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error("Access denied. Admin only.");
      navigate("/home");
    }
  }, [adminLoading, isAdmin, navigate]);

  // Fetch data via admin API
  const { data: races, isLoading: racesLoading } = useQuery({
    queryKey: ["admin", "races"],
    queryFn: () => api.get('/api/races'),
    enabled: isAdmin === true,
  });

  const { data: blogPosts, isLoading: blogLoading } = useQuery({
    queryKey: ["admin", "blog_posts"],
    queryFn: () => api.get('/api/blog'),
    enabled: isAdmin === true,
  });

  const { data: trainingPlans, isLoading: plansLoading } = useQuery({
    queryKey: ["admin", "training_plans"],
    queryFn: () => api.get('/api/training'),
    enabled: isAdmin === true,
  });

  const { data: challengesList, isLoading: challengesLoading } = useQuery({
    queryKey: ["admin", "challenges"],
    queryFn: () => api.get('/api/admin/challenges'),
    enabled: isAdmin === true,
  });

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-area-inset-top pb-24">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-4 border-b border-border"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">Manage your app content</p>
          </div>
        </div>
      </motion.header>

      <div className="px-4 py-6">
        <Tabs defaultValue="races" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="races" className="gap-1 text-xs">
              <Trophy className="w-3.5 h-3.5" />
              Races
            </TabsTrigger>
            <TabsTrigger value="challenges" className="gap-1 text-xs">
              <Flame className="w-3.5 h-3.5" />
              Dares
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-1 text-xs">
              <BookOpen className="w-3.5 h-3.5" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-1 text-xs">
              <Target className="w-3.5 h-3.5" />
              Training
            </TabsTrigger>
          </TabsList>

          <TabsContent value="races">
            <RacesAdmin races={races || []} loading={racesLoading} />
          </TabsContent>

          <TabsContent value="challenges">
            <ChallengesAdmin challenges={challengesList || []} loading={challengesLoading} />
          </TabsContent>

          <TabsContent value="blog">
            <BlogAdmin posts={blogPosts || []} loading={blogLoading} />
          </TabsContent>

          <TabsContent value="training">
            <TrainingAdmin plans={trainingPlans || []} loading={plansLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Reusable Delete Confirm Dialog
const DeleteConfirmDialog = ({ onConfirm, label }: { onConfirm: () => void; label: string }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="ghost" size="icon">
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Delete {label}?
        </AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete this {label.toLowerCase()} and all associated data.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// Races Admin Component
const RacesAdmin = ({ races, loading }: { races: Race[]; loading: boolean }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Race>>({});

  const saveMutation = useMutation({
    mutationFn: async (race: Partial<Race>) => {
      if (race.id) {
        return api.put(`/api/admin/races/${race.id}`, race);
      } else {
        return api.post('/api/admin/races', race);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "races"] });
      queryClient.invalidateQueries({ queryKey: ["races"] });
      setEditing(null);
      setCreating(false);
      setForm({});
      toast.success("Race saved!");
    },
    onError: () => toast.error("Failed to save race"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/admin/races/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "races"] });
      toast.success("Race deleted!");
    },
    onError: () => toast.error("Failed to delete race"),
  });

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => { setCreating(true); setEditing(null); setForm({ is_published: false }); }} className="w-full">
        <Plus className="w-4 h-4 mr-2" /> Add Race
      </Button>

      {(creating || editing) && (
        <Card>
          <CardHeader>
            <CardTitle>{creating ? "New Race" : "Edit Race"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Race name"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Location"
                value={form.location || ""}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
              <Input
                placeholder="Distance (e.g. 5K, 10K, Half Marathon)"
                value={form.distance_type || ""}
                onChange={(e) => setForm({ ...form, distance_type: e.target.value })}
              />
            </div>
            <Input
              type="date"
              value={form.race_date || ""}
              onChange={(e) => setForm({ ...form, race_date: e.target.value })}
            />
            <Input
              placeholder="Image URL"
              value={form.image_url || ""}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            />
            <Input
              placeholder="Registration URL"
              value={form.registration_url || ""}
              onChange={(e) => setForm({ ...form, registration_url: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_published || false}
                onCheckedChange={(v) => setForm({ ...form, is_published: v })}
              />
              <Label>Published</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                <Save className="w-4 h-4 mr-2" /> Save
              </Button>
              <Button variant="outline" onClick={() => { setEditing(null); setCreating(false); setForm({}); }}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {races.map((race) => (
        <Card key={race.id}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{race.name}</p>
              <p className="text-sm text-muted-foreground">
                {race.race_date} • {race.distance_type}
                {!race.is_published && " • Draft"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setEditing(race.id); setCreating(false); setForm(race); }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <DeleteConfirmDialog
                label="Race"
                onConfirm={() => deleteMutation.mutate(race.id)}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Blog Admin Component
const BlogAdmin = ({ posts, loading }: { posts: BlogPost[]; loading: boolean }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<BlogPost>>({});

  const saveMutation = useMutation({
    mutationFn: async (post: Partial<BlogPost>) => {
      const slug = post.slug || post.title?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";
      const payload = { ...post, slug };
      if (post.id) {
        return api.put(`/api/admin/blog/${post.id}`, payload);
      } else {
        return api.post('/api/admin/blog', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog_posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog_posts"] });
      setEditing(null);
      setCreating(false);
      setForm({});
      toast.success("Post saved!");
    },
    onError: () => toast.error("Failed to save post"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/admin/blog/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog_posts"] });
      toast.success("Post deleted!");
    },
    onError: () => toast.error("Failed to delete post"),
  });

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => { setCreating(true); setEditing(null); setForm({ is_published: false, category: "Tips" }); }} className="w-full">
        <Plus className="w-4 h-4 mr-2" /> Add Post
      </Button>

      {(creating || editing) && (
        <Card>
          <CardHeader>
            <CardTitle>{creating ? "New Post" : "Edit Post"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Title"
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Select
              value={form.category || "Tips"}
              onValueChange={(v) => setForm({ ...form, category: v })}
            >
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Tips">Tips</SelectItem>
                <SelectItem value="Training">Training</SelectItem>
                <SelectItem value="Nutrition">Nutrition</SelectItem>
                <SelectItem value="Gear">Gear</SelectItem>
                <SelectItem value="Stories">Stories</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Excerpt (short summary)"
              value={form.excerpt || ""}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
            <Textarea
              placeholder="Content"
              className="min-h-[200px]"
              value={form.content || ""}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <Input
              placeholder="Image URL"
              value={form.image_url || ""}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_published || false}
                onCheckedChange={(v) => setForm({ ...form, is_published: v })}
              />
              <Label>Published</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                <Save className="w-4 h-4 mr-2" /> Save
              </Button>
              <Button variant="outline" onClick={() => { setEditing(null); setCreating(false); setForm({}); }}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {posts.map((post) => (
        <Card key={post.id}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{post.title}</p>
              <p className="text-sm text-muted-foreground">
                {post.category}
                {!post.is_published && " • Draft"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setEditing(post.id); setCreating(false); setForm(post); }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <DeleteConfirmDialog
                label="Post"
                onConfirm={() => deleteMutation.mutate(post.id)}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Training Admin Component
const TrainingAdmin = ({ plans, loading }: { plans: TrainingPlan[]; loading: boolean }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<TrainingPlan>>({});

  const saveMutation = useMutation({
    mutationFn: async (plan: Partial<TrainingPlan>) => {
      if (plan.id) {
        return api.put(`/api/admin/training/${plan.id}`, plan);
      } else {
        return api.post('/api/admin/training', plan);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "training_plans"] });
      queryClient.invalidateQueries({ queryKey: ["training_plans"] });
      setEditing(null);
      setCreating(false);
      setForm({});
      toast.success("Plan saved!");
    },
    onError: () => toast.error("Failed to save plan"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/admin/training/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "training_plans"] });
      toast.success("Plan deleted!");
    },
    onError: () => toast.error("Failed to delete plan"),
  });

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => { setCreating(true); setEditing(null); setForm({ is_published: false, level: "Beginner", duration_weeks: 8 }); }} className="w-full">
        <Plus className="w-4 h-4 mr-2" /> Add Training Plan
      </Button>

      {(creating || editing) && (
        <Card>
          <CardHeader>
            <CardTitle>{creating ? "New Training Plan" : "Edit Training Plan"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Plan name"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={form.level || "Beginner"}
                onValueChange={(v) => setForm({ ...form, level: v })}
              >
                <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Goal Distance (e.g. 5K, 10K)"
                value={form.goal_distance || ""}
                onChange={(e) => setForm({ ...form, goal_distance: e.target.value })}
              />
            </div>
            <Input
              type="number"
              placeholder="Duration (weeks)"
              value={form.duration_weeks || ""}
              onChange={(e) => setForm({ ...form, duration_weeks: parseInt(e.target.value) })}
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_published || false}
                onCheckedChange={(v) => setForm({ ...form, is_published: v })}
              />
              <Label>Published</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                <Save className="w-4 h-4 mr-2" /> Save
              </Button>
              <Button variant="outline" onClick={() => { setEditing(null); setCreating(false); setForm({}); }}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {plans.map((plan) => (
        <Card key={plan.id}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{plan.name}</p>
              <p className="text-sm text-muted-foreground">
                {plan.level} • {plan.duration_weeks} weeks • {plan.goal_distance}
                {!plan.is_published && " • Draft"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setEditing(plan.id); setCreating(false); setForm(plan); }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <DeleteConfirmDialog
                label="Training Plan"
                onConfirm={() => deleteMutation.mutate(plan.id)}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Admin;

// Challenges Admin Component
const ChallengesAdmin = ({ challenges, loading }: { challenges: AdminChallenge[]; loading: boolean }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<AdminChallenge>>({});

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<AdminChallenge>) => {
      if (editing) {
        return api.put(`/api/admin/challenges/${editing}`, data);
      }
      return api.post('/api/admin/challenges', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "challenges"] });
      setEditing(null); setCreating(false); setForm({});
      toast.success(editing ? "Challenge updated" : "Challenge created");
    },
    onError: () => toast.error("Failed to save challenge"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/challenges/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "challenges"] });
      toast.success("Challenge deleted");
    },
  });

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const isEditing = editing || creating;

  return (
    <div className="space-y-4">
      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{creating ? "New Challenge" : "Edit Challenge"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title || ""} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.challenge_type || "distance"} onValueChange={v => {
                  const units: Record<string, string> = { distance: 'meters', runs: 'runs', streak: 'days', single_run: 'meters', elevation: 'meters_elevation' };
                  setForm({...form, challenge_type: v, target_unit: units[v] || 'meters'});
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="runs">Run Count</SelectItem>
                    <SelectItem value="streak">Streak</SelectItem>
                    <SelectItem value="single_run">Single Run</SelectItem>
                    <SelectItem value="elevation">Elevation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Value {form.challenge_type === 'distance' || form.challenge_type === 'single_run' ? '(meters)' : form.challenge_type === 'runs' ? '(count)' : form.challenge_type === 'streak' ? '(days)' : '(meters)'}</Label>
                <Input type="number" value={form.target_value || ""} onChange={e => setForm({...form, target_value: Number(e.target.value)})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date?.slice(0, 10) || ""} onChange={e => setForm({...form, start_date: e.target.value})} />
              </div>
              <div>
                <Label>End Date (optional)</Label>
                <Input type="date" value={form.end_date?.slice(0, 10) || ""} onChange={e => setForm({...form, end_date: e.target.value || null})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Count From</Label>
                <Select value={form.count_from || "challenge_start"} onValueChange={v => setForm({...form, count_from: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="challenge_start">Challenge Start</SelectItem>
                    <SelectItem value="join_date">User Join Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center space-x-2">
                  <Switch checked={!!form.is_published} onCheckedChange={c => setForm({...form, is_published: c})} id="challenge-published" />
                  <Label htmlFor="challenge-published">Published</Label>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={() => { setEditing(null); setCreating(false); setForm({}); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => { setCreating(true); setForm({ challenge_type: 'distance', target_unit: 'meters', count_from: 'challenge_start', is_published: false }); }} className="w-full">
          <Plus className="w-4 h-4 mr-2" /> New Challenge
        </Button>
      )}

      {challenges.map((ch: AdminChallenge) => (
        <Card key={ch.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{ch.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ch.is_published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {ch.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {ch.challenge_type} · Target: {ch.target_value} {ch.target_unit} · {ch.participant_count || 0} participants
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon"
                  onClick={() => { setEditing(ch.id); setCreating(false); setForm(ch); }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <DeleteConfirmDialog
                  label="Challenge"
                  onConfirm={() => deleteMutation.mutate(ch.id)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
