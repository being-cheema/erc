import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type TrainingPlan = Tables<"training_plans">;

export const useTrainingPlans = () => {
  return useQuery({
    queryKey: ["training_plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_plans")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TrainingPlan[];
    },
  });
};
