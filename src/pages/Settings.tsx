import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Moon, Sun, Bell, User, Loader2, Check, RefreshCw, LogOut, Medal, BookOpen, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useProfile, useCurrentUser } from "@/hooks/useProfile";
import { api } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHaptics } from "@/hooks/useHaptics";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface NotificationPreferences {
  achievements: boolean;
  leaderboard_changes: boolean;
  new_blog_posts: boolean;
  new_races: boolean;
  training_reminders: boolean;
}

const Settings = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { user } = useCurrentUser();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const { lightImpact, mediumImpact, selectionChanged, notificationSuccess } = useHaptics();
  const { isAdmin } = useIsAdmin();

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [monthlyGoal, setMonthlyGoal] = useState(100);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);


  // Fetch notification preferences
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: async () => {
      return api.get('/api/notifications/preferences');
    },
    enabled: !!user?.id,
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    achievements: true,
    leaderboard_changes: true,
    new_blog_posts: true,
    new_races: true,
    training_reminders: true,
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setAvatarUrl(profile.avatar_url || "");
      setMonthlyGoal(parseFloat(((profile.monthly_distance_goal as number || 100000) / 1000).toFixed(1)));
    }
  }, [profile]);

  useEffect(() => {
    if (notifications) {
      setNotificationPrefs({
        achievements: notifications.achievements ?? true,
        leaderboard_changes: notifications.leaderboard_changes ?? true,
        new_blog_posts: notifications.new_blog_posts ?? true,
        new_races: notifications.new_races ?? true,
        training_reminders: notifications.training_reminders ?? true,
      });
    }
  }, [notifications]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      return api.put('/api/profiles/me', {
        display_name: displayName,
        avatar_url: avatarUrl,
        monthly_distance_goal: monthlyGoal * 1000,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      if (!user?.id) throw new Error("Not authenticated");
      return api.put('/api/notifications/preferences', prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationPreferences"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update preferences");
    },
  });

  const handleSaveProfile = async () => {
    mediumImpact();
    setIsSaving(true);
    await updateProfileMutation.mutateAsync();
    notificationSuccess();
    setIsSaving(false);
  };

  const handleNotificationToggle = (key: keyof NotificationPreferences) => {
    selectionChanged();
    const newPrefs = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setNotificationPrefs(newPrefs);
    updateNotificationsMutation.mutate(newPrefs);
  };

  const handleThemeToggle = () => {
    selectionChanged();
    toggleTheme();
  };

  const handleBackTap = () => {
    lightImpact();
    navigate(-1);
  };




  const handleForceSync = async () => {
    if (!profile?.strava_id) {
      toast.error("No Strava connection found");
      return;
    }

    setIsSyncing(true);
    mediumImpact();

    try {
      const result = await api.post('/functions/v1/sync-strava', { force_full_sync: false });

      await queryClient.invalidateQueries({ queryKey: ["activities"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["monthlyActivities"] });
      await queryClient.invalidateQueries({ queryKey: ["monthlyDistance"] });
      await queryClient.invalidateQueries({ queryKey: ["weeklyStats"] });

      notificationSuccess();
      const syncedCount = result.results?.[0]?.activities || 0;
      toast.success(`Synced ${syncedCount} activities`);
    } catch (error: any) {
      console.error("Force sync error:", error);
      toast.error(error.message || "Failed to sync");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = () => {
    api.clearToken();
    queryClient.clear(); // Prevent stale queries from firing 401s after re-login
    navigate("/login");
  };

  if (profileLoading) {
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
        className="px-4 pt-6 pb-4"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackTap}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Settings</h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Manage your profile</p>
          </div>
        </div>
      </motion.header>

      <div className="px-4 space-y-6">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </h2>
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {displayName?.[0]?.toUpperCase() || "R"}
                  </AvatarFallback>
                </Avatar>
                <div className="w-full">
                  <Label htmlFor="avatarUrl" className="text-sm text-muted-foreground">
                    Avatar URL
                  </Label>
                  <Input
                    id="avatarUrl"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Display Name */}
              <div>
                <Label htmlFor="displayName" className="text-sm text-muted-foreground">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1"
                />
              </div>

              {/* Monthly Goal */}
              <div>
                <Label htmlFor="monthlyGoal" className="text-sm text-muted-foreground">
                  Monthly Distance Goal (km)
                </Label>
                <Input
                  id="monthlyGoal"
                  type="number"
                  value={monthlyGoal}
                  onChange={(e) => setMonthlyGoal(Number(e.target.value))}
                  min={1}
                  max={1000}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Set your target distance for each month
                </p>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full gradient-primary text-white"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appearance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            Appearance
          </h2>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    {theme === "dark" ? (
                      <Moon className="w-5 h-5 text-primary" />
                    ) : (
                      <Sun className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Dark Mode</p>
                    <p className="text-muted-foreground text-sm">
                      {theme === "dark" ? "Currently enabled" : "Currently disabled"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={handleThemeToggle}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </h2>
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-4">
              {[
                { key: "achievements" as const, label: "Achievements", desc: "When you unlock new achievements" },
                { key: "leaderboard_changes" as const, label: "Leaderboard Updates", desc: "When your rank changes" },
                { key: "new_races" as const, label: "New Races", desc: "When new races are added" },
                { key: "new_blog_posts" as const, label: "Blog Posts", desc: "When new articles are published" },
                { key: "training_reminders" as const, label: "Training Reminders", desc: "Daily workout reminders" },
              ].map((item, index) => (
                <div
                  key={item.key}
                  className={`flex items-center justify-between ${index < 4 ? "pb-4 border-b border-border/50" : ""
                    }`}
                >
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notificationPrefs[item.key]}
                    onCheckedChange={() => handleNotificationToggle(item.key)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Strava Connection */}
        {profile?.strava_id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-strava/30 bg-strava/5">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-strava/10 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-strava" fill="currentColor">
                      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground font-sans">Strava Connected</h3>
                    <p className="text-muted-foreground text-sm">
                      Strava ID: {profile.strava_id}
                    </p>
                  </div>
                </div>

                {/* Force Sync Button */}
                <Button
                  onClick={handleForceSync}
                  disabled={isSyncing}
                  variant="outline"
                  className="w-full border-strava/30 hover:bg-strava/10"
                >
                  {isSyncing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {isSyncing ? "Syncing..." : "Force Full Sync"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Re-import all activities with detailed metrics
                </p>


              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            More
          </h2>
          <Card className="border-border/50">
            <CardContent className="p-0">
              <button
                onClick={() => { lightImpact(); navigate("/achievements"); }}
                className="w-full flex items-center gap-3 p-4 border-b border-border/50 hover:bg-secondary/50 transition-colors text-left"
              >
                <Medal className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Achievements</span>
              </button>
              <button
                onClick={() => { lightImpact(); navigate("/blog"); }}
                className="w-full flex items-center gap-3 p-4 border-b border-border/50 hover:bg-secondary/50 transition-colors text-left"
              >
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Blog</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => { lightImpact(); navigate("/admin"); }}
                  className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left"
                >
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Admin Panel</span>
                </button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pb-4"
        >
          <Button
            variant="outline"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
