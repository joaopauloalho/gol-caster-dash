import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Participant {
  id: string;
  full_name: string;
  username: string | null;
  payment_confirmed: boolean;
  is_test_user: boolean;
  plan: string;
  state: string;
  city: string;
  referral_code: string;
  bonus_points: number;
  favorite_team: string | null;
}

export const useParticipant = () => {
  const { user } = useAuth();

  const {
    data: participant = null,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["participant", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select(
          "id, full_name, username, payment_confirmed, is_test_user, plan, state, city, referral_code, bonus_points, favorite_team"
        )
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return (data as Participant | null) ?? null;
    },
  });

  const error = queryError ? (queryError as Error).message : null;
  const hasPaid = (participant?.payment_confirmed || participant?.is_test_user) ?? false;

  return { participant, loading, hasPaid, error, refetch };
};
