import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Participant {
  id: string;
  payment_confirmed: boolean;
  plan: string;
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
        .select("id, payment_confirmed, plan")
        .eq("user_id", user.id)
        .maybeSingle();
      setParticipant(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return { participant, loading, hasPaid: participant?.payment_confirmed ?? false };
};
