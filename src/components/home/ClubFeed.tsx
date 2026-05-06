import { motion } from "framer-motion";
import { Footprints, Trophy, Flame, UserPlus, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useClubFeed } from "@/hooks/useClubFeed";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

function getFeedIcon(type: string) {
  switch (type) {
    case 'activity': return Footprints;
    case 'achievement': return Trophy;
    case 'challenge_complete': return Flame;
    case 'new_member': return UserPlus;
    default: return Footprints;
  }
}

function getFeedColor(type: string) {
  switch (type) {
    case 'activity': return 'text-primary';
    case 'achievement': return 'text-amber-500';
    case 'challenge_complete': return 'text-emerald-500';
    case 'new_member': return 'text-blue-400';
    default: return 'text-primary';
  }
}

function getFeedText(item: any): string {
  switch (item.feed_type) {
    case 'activity':
      return `ran ${(item.distance / 1000).toFixed(1)} km`;
    case 'achievement':
      return `earned "${item.name}"`;
    case 'challenge_complete':
      return `completed "${item.name}"`;
    case 'new_member':
      return 'joined the club';
    default:
      return '';
  }
}

const ClubFeed = () => {
  const { data: feed, isLoading } = useClubFeed(15);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!feed?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Club Activity</h2>
      <div className="space-y-1">
        {feed.slice(0, 10).map((item: any, i: number) => {
          const Icon = getFeedIcon(item.feed_type);
          const color = getFeedColor(item.feed_type);
          const timeAgo = formatDistanceToNow(new Date(item.event_date), { addSuffix: true });

          return (
            <motion.div
              key={`${item.feed_type}-${item.id}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 py-2"
            >
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarImage src={item.avatar_url || undefined} />
                <AvatarFallback className="bg-white/5 text-[10px] font-bold">
                  {item.display_name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">
                  {item.member_id ? (
                    <Link to={`/m/${item.member_id}`} className="font-bold hover:text-primary transition-colors">
                      {item.display_name}
                    </Link>
                  ) : (
                    <span className="font-bold">{item.display_name}</span>
                  )}
                  {' '}
                  <span className="text-muted-foreground">{getFeedText(item)}</span>
                </p>
              </div>
              <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
              <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">{timeAgo}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ClubFeed;
