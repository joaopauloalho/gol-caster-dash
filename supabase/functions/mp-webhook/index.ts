import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const body = await req.json();

    // MP envia notificações de tipos diferentes; só processamos "payment"
    if (body.type !== "payment") {
      return new Response("ok", { status: 200 });
    }

    const paymentId = body.data?.id;
    if (!paymentId) return new Response("ok", { status: 200 });

    const accessToken = Deno.env.get("MP_ACCESS_TOKEN");

    // Busca detalhes do pagamento na API do MP
    const paymentRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // Se não encontrou (ex: ID de teste fictício), ignora silenciosamente
    if (!paymentRes.ok) {
      return new Response("ok", { status: 200 });
    }

    const payment = await paymentRes.json();

    // Só atualiza se o pagamento foi aprovado
    if (payment.status !== "approved") {
      return new Response("ok", { status: 200 });
    }

    // external_reference = "userId:planId"
    const [userId, planId] = (payment.external_reference || "").split(":");
    if (!userId || !planId) {
      return new Response("external_reference inválido", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan: planId,
        amount: Math.round(payment.transaction_amount * 100),
        payment_status: "active",
        mp_payment_id: String(paymentId),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("Supabase error:", error);
      return new Response("Erro ao salvar pagamento", { status: 500 });
    }

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error(error);
    // Sempre retorna 200 para o MP não ficar retentando
    return new Response("ok", { status: 200 });
  }
});
