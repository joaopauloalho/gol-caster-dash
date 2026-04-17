/**
 * create-asaas-charge — cria cobrança no Asaas
 *
 * Segurança:
 * 1. JWT do chamador verificado — só cria cobrança para o próprio usuário
 * 2. Valor determinado SERVER-SIDE pelo plano (nunca aceito do cliente)
 * 3. Planos desconhecidos são rejeitados
 *
 * Fluxo:
 * - pro-avista  (R$250): PIX — retorna pixCopiaECola + qrCodeImage + invoiceUrl
 * - pro-parcelado (R$300): retorna invoiceUrl (página hospedada Asaas com cartão parcelado)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Valores canônicos em centavos — nunca vêm do cliente
const PLAN_AMOUNTS: Record<string, { valueInCents: number; name: string; billingType: string; installments?: number }> = {
  "pro-avista": {
    valueInCents: 25000,
    name: "Super Bolão da Copa 2026 - Pro à Vista",
    billingType: "PIX",
  },
  "pro-parcelado": {
    valueInCents: 30000,
    name: "Super Bolão da Copa 2026 - Pro Parcelado",
    billingType: "CREDIT_CARD",
    installments: 3,
  },
};

const ASAAS_BASE_URL = "https://api.asaas.com/v3";

async function asaasRequest(path: string, method: string, body?: unknown): Promise<Response> {
  const apiKey = Deno.env.get("ASAAS_API_KEY");
  if (!apiKey) throw new Error("ASAAS_API_KEY não configurado");

  return fetch(`${ASAAS_BASE_URL}${path}`, {
    method,
    headers: {
      "access_token": apiKey,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function findOrCreateCustomer(params: {
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
}): Promise<string> {
  // Tenta encontrar pelo e-mail
  const searchRes = await asaasRequest(`/customers?email=${encodeURIComponent(params.email)}&limit=1`, "GET");
  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.data?.length > 0) {
      return searchData.data[0].id as string;
    }
  }

  // Cria novo customer
  const createRes = await asaasRequest("/customers", "POST", {
    name: params.name || params.email,
    email: params.email,
    ...(params.cpf ? { cpfCnpj: params.cpf.replace(/\D/g, "") } : {}),
    ...(params.phone ? { mobilePhone: params.phone.replace(/\D/g, "") } : {}),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(`Erro ao criar customer Asaas: ${JSON.stringify(err)}`);
  }

  const customer = await createRes.json();
  return customer.id as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Verificação de identidade ──────────────────────────────────────────
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

    const { plan, userId, userEmail, userName, userCpf, userPhone } = await req.json();

    if (user.id !== userId) {
      return new Response(JSON.stringify({ error: "userId não corresponde ao token" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planConfig = PLAN_AMOUNTS[plan];
    if (!planConfig) {
      return new Response(JSON.stringify({ error: `Plano inválido: ${plan}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Cria ou encontra customer no Asaas ────────────────────────────────
    const customerId = await findOrCreateCustomer({
      name: userName || userEmail,
      email: userEmail,
      cpf: userCpf,
      phone: userPhone,
    });

    const siteUrl = Deno.env.get("SITE_URL") || "https://pietah.com.br";

    // ── Cria cobrança ─────────────────────────────────────────────────────
    const chargePayload: Record<string, unknown> = {
      customer: customerId,
      billingType: planConfig.billingType,
      value: planConfig.valueInCents / 100,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0], // +1 dia
      description: planConfig.name,
      externalReference: `${userId}:${plan}`,
      callback: {
        successUrl: `${siteUrl}/payment-return?status=success`,
        autoRedirect: true,
      },
    };

    if (planConfig.installments) {
      chargePayload.installmentCount = planConfig.installments;
      chargePayload.installmentValue = parseFloat(
        (planConfig.valueInCents / 100 / planConfig.installments).toFixed(2)
      );
      delete chargePayload.value; // installments usa installmentValue
    }

    const chargeRes = await asaasRequest("/payments", "POST", chargePayload);
    if (!chargeRes.ok) {
      const err = await chargeRes.json();
      throw new Error(`Erro ao criar cobrança Asaas: ${JSON.stringify(err)}`);
    }

    const charge = await chargeRes.json();

    // Para PIX, busca QR code
    let pixData: { encodedImage?: string; payload?: string } = {};
    if (planConfig.billingType === "PIX") {
      const pixRes = await asaasRequest(`/payments/${charge.id}/pixQrCode`, "GET");
      if (pixRes.ok) {
        pixData = await pixRes.json();
      }
    }

    return new Response(
      JSON.stringify({
        chargeId: charge.id,
        invoiceUrl: charge.invoiceUrl,
        billingType: planConfig.billingType,
        ...(planConfig.billingType === "PIX" ? {
          pixCopiaECola: pixData.payload,
          pixQrCodeImage: pixData.encodedImage,
        } : {}),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("create-asaas-charge error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
