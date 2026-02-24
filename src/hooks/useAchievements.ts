import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useProfile";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  user_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export const useAchievements = () => {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value", { ascending: true });

      if (error) throw error;
      return data as Achievement[];
    },
  });
};

export const useUserAchievements = () => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["userAchievements", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievements (*)
        `)
        .eq("user_id", user.id)
        .order("unlocked_at", { ascending: false });

      if (error) throw error;
      
      // Type assertion for the joined data
      return data as unknown as (UserAchievement & { achievements: Achievement })[];
    },
    enabled: !!user?.id,
  });
};

export const useAchievementsWithStatus = () => {
  const { data: allAchievements, isLoading: achievementsLoading } = useAchievements();
  const { data: userAchievements, isLoading: userAchievementsLoading } = useUserAchievements();

  const achievementsWithStatus = allAchievements?.map(achievement => {
    const userAchievement = userAchievements?.find(
      ua => ua.achievement_id === achievement.id
    );
    
    return {
      ...achievement,
      unlocked: !!userAchievement,
      unlocked_at: userAchievement?.unlocked_at,
    };
  });

  return {
    data: achievementsWithStatus,
    isLoading: achievementsLoading || userAchievementsLoading,
  };
};
