import { useCallback, useEffect, useState } from "react";
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
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipant = useCallback(async () => {
    if (!user) {
      setParticipant(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from("participants")
      .select("id, full_name, username, payment_confirmed, is_test_user, plan, state, city, referral_code, bonus_points, favorite_team")
      .eq("user_id", user.id)
      .maybeSingle();

    if (queryError) {
      setError(queryError.message);
    } else {
      setParticipant(data as Participant | null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchParticipant();
  }, [fetchParticipant]);

  const hasPaid = (participant?.payment_confirmed || participant?.is_test_user) ?? false;
  return { participant, loading, hasPaid, error, refetch: fetchParticipant };
};
