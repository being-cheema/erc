import { motion } from "framer-motion";
import { User, Trophy, Flame, MapPin, Calendar, Loader2, ArrowLeft, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const API_BASE = import.meta.env.VITE_SUPABASE_URL || '';

async function fetchMemberProfile(memberId: string) {
  const res = await fetch(`${API_BASE}/api/members/${memberId}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('not_found');
    throw new Error('fetch_failed');
  }
  return res.json();
}

const MemberProfile = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();

  const { data: member, isLoading, error } = useQuery({
    queryKey: ['member-profile', memberId],
    queryFn: () => fetchMemberProfile(memberId!),
    enabled: !!memberId,
    retry: false,
  });

  const handleShare = async () => {
    const url = `${window.location.origin}/m/${memberId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${member?.display_name} — Erode Runners Club`, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
          <User className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-black text-foreground">Member Not Found</h1>
        <p className="text-muted-foreground text-sm">
          The member ID <span className="font-mono text-foreground">{memberId}</span> doesn't match any profile.
        </p>
        <Link to="/landing">
          <Button variant="outline" className="mt-2">Go to Home</Button>
        </Link>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Distance",
      value: `${((member.total_distance || 0) / 1000).toFixed(1)} km`,
      icon: MapPin,
    },
    {
      label: "Total Runs",
      value: member.total_runs || 0,
      icon: Trophy,
    },
    {
      label: "Current Streak",
      value: `${member.current_streak || 0} days`,
      icon: Flame,
    },
    {
      label: "Achievements",
      value: member.achievements_count || 0,
      icon: Trophy,
    },
  ];

  return (
    <div className="min-h-screen bg-background safe-area-inset-top pb-12">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-2 flex items-center justify-between"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </motion.header>

      <div className="px-4 space-y-5">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center pt-4"
        >
          <Avatar className="w-24 h-24 border-2 border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">
              {member.display_name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-black text-foreground mt-4 tracking-tight">
            {member.display_name}
          </h1>
          {member.city && (
            <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {member.city}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-mono text-muted-foreground bg-white/5 px-2.5 py-1 rounded-lg">
              {member.member_id}
            </span>
            {member.current_rank && (
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                #{member.current_rank} this month
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Member since {format(new Date(member.created_at), "MMMM yyyy")}
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          {stats.map((stat, i) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <stat.icon className="w-5 h-5 text-primary mb-2" />
                <span className="text-xl font-black text-foreground">{stat.value}</span>
                <span className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</span>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Club branding */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center pt-4"
        >
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
            Erode Runners Club
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default MemberProfile;
