import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Subscription {
  id: string;
  plan: string;
  payment_status: string;
  amount: number;
  mp_payment_id?: string;
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

  const createMpPreference = async (plan: string, amount: number) => {
    if (!user) return { error: "Usuário não autenticado" };

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: "Sessão inválida" };

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-mp-preference`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          plan,
          amount,
          userId: user.id,
          userEmail: user.email,
          userName: user.user_metadata?.full_name || user.email,
          userCpf: user.user_metadata?.cpf || "",
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) return { error: data.error || "Erro ao criar preferência" };
    return { init_point: data.init_point as string };
  };

  return { subscription, loading, isActive, createMpPreference, refetch: fetchSubscription };
};
