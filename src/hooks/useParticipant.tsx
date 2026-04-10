import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Participant {
  id: string;
  full_name: string;
  payment_confirmed: boolean;
  plan: string;
  state: string;
  city: string;
  referral_code: string;
  bonus_points: number;
}

export const useParticipant = () => {
  const { user } = useAuth();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setParticipant(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from("participants")
        .select("id, full_name, payment_confirmed, plan, state, city, referral_code, bonus_points")
        .eq("user_id", user.id)
        .maybeSingle();
      setParticipant(data as Participant | null);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return { participant, loading, hasPaid: participant?.payment_confirmed ?? false };
};
