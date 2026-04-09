import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { plan, amount, userId, userEmail, userName } = await req.json();

    const accessToken = Deno.env.get("MP_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MP_ACCESS_TOKEN não configurado");

    const siteUrl = Deno.env.get("SITE_URL") || "https://superbolao.vercel.app";

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
        name: userName || userEmail,
      },
      back_urls: {
        success: `${siteUrl}/pagamento/retorno`,
        failure: `${siteUrl}/pagamento/retorno`,
        pending: `${siteUrl}/pagamento/retorno`,
      },
      auto_return: "approved",
      external_reference: `${userId}:${plan}`,
      statement_descriptor: "SUPER BOLAO COPA",
      payment_methods: {
        installments: isParcelado ? 3 : 1,
        excluded_payment_types: isParcelado
          ? [
              { id: "ticket" },        // sem boleto
              { id: "bank_transfer" }, // sem Pix
              { id: "debit_card" },    // sem débito
              { id: "atm" },
              { id: "prepaid_card" },
            ]
          : [
              { id: "ticket" },        // sem boleto
              { id: "debit_card" },    // sem débito
              { id: "atm" },
              { id: "prepaid_card" },
            ],
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
