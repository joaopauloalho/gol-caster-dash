import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Subscription {
  id: string;
  plan: string;
  payment_status: string;
  amount: number;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setSubscription(data as Subscription | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const isActive = subscription?.payment_status === "active";

  const simulatePayment = async (plan: string, amount: number) => {
    if (!user) return;
    // Upsert subscription
    const { error } = await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        plan,
        amount,
        payment_status: "active",
      },
      { onConflict: "user_id" }
    );
    if (!error) {
      await fetchSubscription();
    }
    return error;
  };

  return { subscription, loading, isActive, simulatePayment, refetch: fetchSubscription };
};
