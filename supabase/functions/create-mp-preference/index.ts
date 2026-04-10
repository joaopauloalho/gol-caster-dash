/**
 * create-mp-preference — cria preferência de pagamento no Mercado Pago
 *
 * Segurança implementada:
 * 1. Verifica que o JWT do chamador corresponde ao userId enviado no body
 *    (evita criar preferência em nome de outro usuário)
 * 2. Amount determinado SERVER-SIDE pelo plano — nunca aceito do cliente
 *    (evita pagamento de R$0.01 com plano pro)
 * 3. Rejeita planos desconhecidos
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Valores canônicos dos planos (em centavos) — nunca vêm do cliente
const PLAN_AMOUNTS: Record<string, number> = {
  "pro-avista":    2500,  // R$25,00
  "pro-parcelado": 3000,  // R$30,00
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Verificação de identidade do chamador ──────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Autenticação obrigatória" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ── Fim verificação de identidade ─────────────────────────────────────

    const { plan, userId, userEmail, userName, userCpf } = await req.json();

    // Garante que o usuário só cria preferência para si mesmo
    if (user.id !== userId) {
      return new Response(JSON.stringify({ error: "userId não corresponde ao token" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Amount determinado pelo servidor, não pelo cliente
    const amount = PLAN_AMOUNTS[plan];
    if (!amount) {
      return new Response(JSON.stringify({ error: `Plano inválido: ${plan}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = Deno.env.get("MP_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MP_ACCESS_TOKEN não configurado");

    const siteUrl = Deno.env.get("SITE_URL") || "https://pietah.com.br";
    const isParcelado = plan === "pro-parcelado";

    const preference = {
      items: [
        {
          title: isParcelado
            ? "Super Bolão da Copa 2026 - Pro Parcelado"
            : "Super Bolão da Copa 2026 - Pro à Vista",
          quantity: 1,
          unit_price: amount / 100,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: userEmail,
        name:  userName || userEmail,
        identification: userCpf
          ? { type: "CPF", number: userCpf.replace(/\D/g, "") }
          : undefined,
      },
      back_urls: {
        success: `${siteUrl}/pagamento/retorno`,
        failure: `${siteUrl}/pagamento/retorno`,
        pending: `${siteUrl}/pagamento/retorno`,
      },
      auto_return: "approved",
      external_reference: `${userId}:${plan}`,
      statement_descriptor: "SUPER BOLAO COPA",
      // notification_url sem apikey na query string — autenticação via assinatura MP
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      payment_methods: {
        ...(isParcelado ? { installments: 3 } : {}),
        excluded_payment_types: isParcelado
          ? [{ id: "ticket" }, { id: "bank_transfer" }, { id: "debit_card" }, { id: "atm" }, { id: "prepaid_card" }]
          : [{ id: "ticket" }, { id: "debit_card" }, { id: "atm" }, { id: "prepaid_card" }],
      },
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Erro MP: ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({ init_point: data.init_point, preference_id: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
