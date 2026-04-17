/**
 * asaas-webhook — handler de notificações do Asaas
 *
 * Segurança:
 * 1. Valida token de acesso via header `asaas-access-token` (ASAAS_WEBHOOK_TOKEN)
 * 2. Idempotência: webhook_events garante processamento único por event_id
 * 3. Confirma status do pagamento na API do Asaas (nunca confia só no body)
 * 4. Retorna 5xx em erros de banco para o Asaas retentar
 * 5. Retorna 200 apenas quando processado ou já processado antes
 *
 * Eventos tratados: PAYMENT_RECEIVED, PAYMENT_CONFIRMED
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ASAAS_BASE_URL = "https://api.asaas.com/v3";

const PAYMENT_SUCCESS_EVENTS = new Set([
  "PAYMENT_RECEIVED",
  "PAYMENT_CONFIRMED",
]);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("ok", { status: 200 });
  }

  // ── Validação do token de webhook ────────────────────────────────────────
  const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
  if (webhookToken) {
    const incomingToken = req.headers.get("asaas-access-token");
    if (incomingToken !== webhookToken) {
      console.warn("asaas-webhook: token inválido, rejeitando");
      return new Response("token inválido", { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("body inválido", { status: 400 });
  }

  const event = body.event as string;
  const payment = body.payment as Record<string, unknown> | undefined;

  // Ignora eventos que não são de pagamento confirmado
  if (!PAYMENT_SUCCESS_EVENTS.has(event) || !payment) {
    console.log(`asaas-webhook: evento ignorado: ${event}`);
    return new Response("ok", { status: 200 });
  }

  const paymentId = payment.id as string;
  if (!paymentId) {
    return new Response("payment.id ausente", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ── Idempotência ──────────────────────────────────────────────────────────
  const { error: dedupError } = await supabase
    .from("webhook_events")
    .insert({
      provider: "asaas",
      event_id: paymentId,
      event_type: event,
      payload: body,
    });

  if (dedupError) {
    if (dedupError.code === "23505") {
      console.log(`asaas-webhook: payment ${paymentId} já processado, ignorando`);
      return new Response("already processed", { status: 200 });
    }
    console.error("asaas-webhook: erro ao inserir webhook_event:", dedupError.message);
    return new Response("erro interno", { status: 500 });
  }

  // ── Confirma status na API do Asaas ──────────────────────────────────────
  const apiKey = Deno.env.get("ASAAS_API_KEY")!;
  let confirmedPayment: Record<string, unknown>;

  try {
    const paymentRes = await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}`, {
      headers: { "access_token": apiKey },
    });

    if (!paymentRes.ok) {
      await supabase
        .from("webhook_events")
        .update({ status: "invalid_payment_id" })
        .eq("provider", "asaas")
        .eq("event_id", paymentId);
      return new Response("payment não encontrado na API Asaas", { status: 200 });
    }

    confirmedPayment = await paymentRes.json();
  } catch (err) {
    console.error("asaas-webhook: erro ao consultar API Asaas:", err);
    return new Response("erro ao consultar Asaas", { status: 500 });
  }

  // Só confirma se status for RECEIVED ou CONFIRMED na API
  const confirmedStatus = confirmedPayment.status as string;
  if (!["RECEIVED", "CONFIRMED"].includes(confirmedStatus)) {
    await supabase
      .from("webhook_events")
      .update({ status: `skipped_${confirmedStatus}` })
      .eq("provider", "asaas")
      .eq("event_id", paymentId);
    return new Response("ok", { status: 200 });
  }

  // ── Extrai external_reference = "userId:planId" ───────────────────────────
  const externalRef = (confirmedPayment.externalReference as string) ?? "";
  const [userId, planId] = externalRef.split(":");

  if (!userId || !planId) {
    console.error("asaas-webhook: externalReference inválido:", externalRef);
    await supabase
      .from("webhook_events")
      .update({ status: "invalid_reference" })
      .eq("provider", "asaas")
      .eq("event_id", paymentId);
    return new Response("externalReference inválido", { status: 400 });
  }

  // ── Atualiza subscription e participant ───────────────────────────────────
  const valueInCents = Math.round((confirmedPayment.value as number) * 100);

  const { error: subError } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan: planId,
        amount: valueInCents,
        payment_status: "active",
        asaas_payment_id: paymentId,
      },
      { onConflict: "user_id" }
    );

  if (subError) {
    console.error("asaas-webhook: erro ao upsert subscription:", subError.message);
    return new Response("erro ao salvar assinatura", { status: 500 });
  }

  const { error: partError } = await supabase
    .from("participants")
    .update({ payment_confirmed: true })
    .eq("user_id", userId);

  if (partError) {
    console.error("asaas-webhook: erro ao confirmar participant:", partError.message);
  }

  await supabase
    .from("webhook_events")
    .update({ user_id: userId, status: "confirmed" })
    .eq("provider", "asaas")
    .eq("event_id", paymentId);

  console.log(`asaas-webhook: payment ${paymentId} confirmado para user ${userId}`);
  return new Response("ok", { status: 200 });
});
