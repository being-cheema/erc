import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, BookOpen, Target, Plus, Trash2, Edit2, Save, X, 
  ArrowLeft, Loader2, Calendar 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
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

const Admin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roles) {
        toast.error("Access denied. Admin only.");
        navigate("/home");
        return;
      }

      setIsAdmin(true);
    };

    checkAdmin();
  }, [navigate]);

  // Fetch data
  const { data: races, isLoading: racesLoading } = useQuery({
    queryKey: ["admin", "races"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("races")
        .select("*")
        .order("race_date", { ascending: true });
      if (error) throw error;
      return data as Race[];
    },
    enabled: isAdmin === true,
  });

  const { data: blogPosts, isLoading: blogLoading } = useQuery({
    queryKey: ["admin", "blog_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
    enabled: isAdmin === true,
  });

  const { data: trainingPlans, isLoading: plansLoading } = useQuery({
    queryKey: ["admin", "training_plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_plans")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TrainingPlan[];
    },
    enabled: isAdmin === true,
  });

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-area-inset-top pb-24">
      {/* Header */}
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
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="races" className="gap-2">
              <Trophy className="w-4 h-4" />
              Races
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-2">
              <Target className="w-4 h-4" />
              Training
            </TabsTrigger>
          </TabsList>

          <TabsContent value="races">
            <RacesAdmin races={races || []} loading={racesLoading} />
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

// Races Admin Component
const RacesAdmin = ({ races, loading }: { races: Race[]; loading: boolean }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Race>>({});

  const saveMutation = useMutation({
    mutationFn: async (race: Partial<Race>) => {
      if (race.id) {
        const { error } = await supabase
          .from("races")
          .update(race)
          .eq("id", race.id);
        if (error) throw error;
      } else {
        const { name, description, location, distance_type, race_date, image_url, registration_url, is_published } = race;
        const { error } = await supabase.from("races").insert({
          name: name!,
          distance_type: distance_type!,
          race_date: race_date!,
          description,
          location,
          image_url,
          registration_url,
          is_published,
        });
        if (error) throw error;
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
      const { error } = await supabase.from("races").delete().eq("id", id);
      if (error) throw error;
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
      <Button onClick={() => { setCreating(true); setForm({ is_published: false }); }} className="w-full">
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
              <Select
                value={form.distance_type || ""}
                onValueChange={(v) => setForm({ ...form, distance_type: v })}
              >
                <SelectTrigger><SelectValue placeholder="Distance" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5K">5K</SelectItem>
                  <SelectItem value="10K">10K</SelectItem>
                  <SelectItem value="Half Marathon">Half Marathon</SelectItem>
                  <SelectItem value="Marathon">Marathon</SelectItem>
                  <SelectItem value="Ultra">Ultra</SelectItem>
                </SelectContent>
              </Select>
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
                onClick={() => { setEditing(race.id); setForm(race); }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(race.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
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
      if (post.id) {
        const { error } = await supabase
          .from("blog_posts")
          .update({ ...post, slug })
          .eq("id", post.id);
        if (error) throw error;
      } else {
        const { title, excerpt, content, category, image_url, is_published } = post;
        const { error } = await supabase.from("blog_posts").insert({
          title: title!,
          slug,
          content: content!,
          category: category!,
          excerpt,
          image_url,
          is_published,
        });
        if (error) throw error;
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
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
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
      <Button onClick={() => { setCreating(true); setForm({ is_published: false, category: "Tips" }); }} className="w-full">
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
                onClick={() => { setEditing(post.id); setForm(post); }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(post.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
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
        const { error } = await supabase
          .from("training_plans")
          .update(plan)
          .eq("id", plan.id);
        if (error) throw error;
      } else {
        const { name, description, level, goal_distance, duration_weeks, is_published } = plan;
        const { error } = await supabase.from("training_plans").insert({
          name: name!,
          level: level!,
          goal_distance: goal_distance!,
          duration_weeks: duration_weeks!,
          description,
          is_published,
        });
        if (error) throw error;
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
      const { error } = await supabase.from("training_plans").delete().eq("id", id);
      if (error) throw error;
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
      <Button onClick={() => { setCreating(true); setForm({ is_published: false, level: "Beginner", duration_weeks: 8 }); }} className="w-full">
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
              <Select
                value={form.goal_distance || ""}
                onValueChange={(v) => setForm({ ...form, goal_distance: v })}
              >
                <SelectTrigger><SelectValue placeholder="Goal Distance" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5K">5K</SelectItem>
                  <SelectItem value="10K">10K</SelectItem>
                  <SelectItem value="Half Marathon">Half Marathon</SelectItem>
                  <SelectItem value="Marathon">Marathon</SelectItem>
                </SelectContent>
              </Select>
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
                onClick={() => { setEditing(plan.id); setForm(plan); }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(plan.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Admin;
