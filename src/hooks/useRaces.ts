import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Race = Tables<"races"> & {
  participant_count?: number;
  is_registered?: boolean;
};

export const useRaces = () => {
  return useQuery({
    queryKey: ["races"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: races, error } = await supabase
        .from("races")
        .select("*")
        .gte("race_date", new Date().toISOString().split("T")[0])
        .order("race_date", { ascending: true });

      if (error) throw error;

      // Get participant counts
      const raceIds = races?.map(r => r.id) || [];
      const { data: participants } = await supabase
        .from("race_participants")
        .select("race_id, user_id")
        .in("race_id", raceIds);

      const participantCounts = new Map<string, number>();
      const userRegistrations = new Set<string>();

      participants?.forEach(p => {
        participantCounts.set(p.race_id, (participantCounts.get(p.race_id) || 0) + 1);
        if (user && p.user_id === user.id) {
          userRegistrations.add(p.race_id);
        }
      });

      return races?.map(race => ({
        ...race,
        participant_count: participantCounts.get(race.id) || 0,
        is_registered: userRegistrations.has(race.id),
      })) as Race[];
    },
  });
};

export const useRegisterForRace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (raceId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("race_participants")
        .insert({ race_id: raceId, user_id: user.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["races"] });
    },
  });
};

export const useUnregisterFromRace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (raceId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("race_participants")
        .delete()
        .eq("race_id", raceId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["races"] });
    },
  });
};
