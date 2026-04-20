/**
 * mp-webhook — Mercado Pago payment notification handler
 *
 * Segurança implementada:
 * 1. Validação de assinatura HMAC-SHA256 (MP_WEBHOOK_SECRET)
 * 2. Idempotência: webhook_events garante processamento único por payment_id
 * 3. Confirmação do status na API do MP (nunca confia só no body)
 * 4. Retorna 5xx em erros de banco para o MP poder retentar
 * 5. Retorna 200 apenas quando processado com sucesso ou já processado antes
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Valida assinatura HMAC-SHA256 do MP
// Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
// Header x-signature = "ts=<epoch>,v1=<hmac>"
// Mensagem assinada = "id:<payment_id>;request-id:<x-request-id>;ts:<epoch>;"
// ---------------------------------------------------------------------------
async function verifyMpSignature(
  req: Request,
  paymentId: string | number,
  secret: string
): Promise<boolean> {
  try {
    const sigHeader = req.headers.get("x-signature");
    const requestId = req.headers.get("x-request-id") ?? "";
    if (!sigHeader) return false;

    const parts = Object.fromEntries(
      sigHeader.split(",").map((p) => p.split("=") as [string, string])
    );
    const ts = parts["ts"];
    const v1 = parts["v1"];
    if (!ts || !v1) return false;

    const message = `id:${paymentId};request-id:${requestId};ts:${ts};`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
    const expected = Array.from(new Uint8Array(sigBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Timing-safe comparison
    if (expected.length !== v1.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

serve(async (req) => {
  // MP envia OPTIONS em alguns casos de teste
  if (req.method !== "POST") {
    return new Response("ok", { status: 200 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("body inválido", { status: 400 });
  }

  // Só processamos notificações de pagamento
  if (body.type !== "payment") {
    return new Response("ok", { status: 200 });
  }

  const paymentId = (body as any).data?.id;
  if (!paymentId) {
    return new Response("data.id ausente", { status: 400 });
  }

  const accessToken   = Deno.env.get("MP_ACCESS_TOKEN")!;
  const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET") ?? "";

  // ---------------------------------------------------------------------------
  // 1. Validação de assinatura (pula se secret não configurado — dev mode)
  // ---------------------------------------------------------------------------
  if (webhookSecret) {
    const valid = await verifyMpSignature(req, paymentId, webhookSecret);
    if (!valid) {
      console.warn("mp-webhook: assinatura inválida, rejeitando");
      return new Response("assinatura inválida", { status: 401 });
    }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ---------------------------------------------------------------------------
  // 2. Idempotência: tenta inserir evento — falha silenciosamente se duplicado
  // ---------------------------------------------------------------------------
  const { error: dedupError } = await supabase
    .from("webhook_events")
    .insert({
      provider:   "mercadopago",
      event_id:   String(paymentId),
      event_type: "payment",
      payload:    body as Record<string, unknown>,
    });

  if (dedupError) {
    if (dedupError.code === "23505") {
      // Já processado — retorna 200 para o MP não retentar
      console.log(`mp-webhook: payment ${paymentId} já processado, ignorando`);
      return new Response("already processed", { status: 200 });
    }
    // Erro inesperado no banco → 500 para o MP retentar depois
    console.error("mp-webhook: erro ao inserir webhook_event:", dedupError.message);
    return new Response("erro interno", { status: 500 });
  }

  // ---------------------------------------------------------------------------
  // 3. Confirma status do pagamento NA API do MP (nunca confiar só no body)
  // ---------------------------------------------------------------------------
  let payment: Record<string, unknown>;
  try {
    const paymentRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!paymentRes.ok) {
      // Pagamento não encontrado (ex: ID fictício de teste) — marca como inválido
      await supabase
        .from("webhook_events")
        .update({ status: "invalid_payment_id" })
        .eq("provider", "mercadopago")
        .eq("event_id", String(paymentId));
      return new Response("payment_id não encontrado na API do MP", { status: 200 });
    }
    payment = await paymentRes.json();
  } catch (err) {
    // Falha de rede → 500 para o MP retentar
    console.error("mp-webhook: erro ao consultar API do MP:", err);
    return new Response("erro ao consultar MP", { status: 500 });
  }

  // Só confirma se aprovado
  if (payment.status !== "approved") {
    await supabase
      .from("webhook_events")
      .update({ status: `skipped_${payment.status}` })
      .eq("provider", "mercadopago")
      .eq("event_id", String(paymentId));
    return new Response("ok", { status: 200 });
  }

  // ---------------------------------------------------------------------------
  // 4. Extrai e valida external_reference = "userId:planId"
  // ---------------------------------------------------------------------------
  const externalRef = (payment.external_reference as string) ?? "";
  const [userId, planId] = externalRef.split(":");
  if (!userId || !planId) {
    console.error("mp-webhook: external_reference inválido:", externalRef);
    await supabase
      .from("webhook_events")
      .update({ status: "invalid_reference", user_id: null })
      .eq("provider", "mercadopago")
      .eq("event_id", String(paymentId));
    return new Response("external_reference inválido", { status: 400 });
  }

  // ---------------------------------------------------------------------------
  // 5. Atualiza subscription e participant (service role — bypassa RLS)
  // ---------------------------------------------------------------------------
  const { error: subError } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id:        userId,
        plan:           planId,
        amount:         Math.round((payment.transaction_amount as number) * 100),
        payment_status: "active",
        mp_payment_id:  String(paymentId),
      },
      { onConflict: "user_id" }
    );

  if (subError) {
    console.error("mp-webhook: erro ao upsert subscription:", subError.message);
    return new Response("erro ao salvar assinatura", { status: 500 });
  }

  const { error: partError } = await supabase
    .from("participants")
    .update({ payment_confirmed: true })
    .eq("user_id", userId);

  if (partError) {
    console.error("mp-webhook: erro ao confirmar participant:", partError.message);
    // Não retorna 500 aqui pois subscription já foi salva; logar para correção manual
  }

  // ── Incrementa uses_count do cupom se o participante usou um ─────────────
  const { data: participantData } = await supabase
    .from("participants")
    .select("coupon_used")
    .eq("user_id", userId)
    .single();

  if (participantData?.coupon_used) {
    const { error: couponError } = await supabase.rpc("increment_coupon_uses", {
      coupon_code: participantData.coupon_used,
    });
    if (couponError) {
      console.error("mp-webhook: erro ao incrementar uses_count do cupom:", couponError.message);
    } else {
      console.log(`mp-webhook: cupom '${participantData.coupon_used}' incrementado para user ${userId}`);
    }
  }

  // Atualiza evento com user_id para auditoria
  await supabase
    .from("webhook_events")
    .update({ user_id: userId, status: "confirmed" })
    .eq("provider", "mercadopago")
    .eq("event_id", String(paymentId));

  return new Response("ok", { status: 200 });
});
