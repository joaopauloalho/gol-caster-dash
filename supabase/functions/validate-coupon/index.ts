/**
 * validate-coupon — valida um cupom server-side e retorna o desconto aplicável
 *
 * Segurança:
 * 1. Requer JWT válido (usuário autenticado)
 * 2. Desconto calculado 100% server-side — nunca aceito do cliente
 * 3. Verifica: active, valid_from, valid_until, max_uses
 * 4. Não registra o resgate aqui — o resgate ocorre ao confirmar o pagamento
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: max 10 tentativas por usuário por minuto
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

// Preços canônicos (centavos) — mesmos valores de create-mp-preference
const PLAN_AMOUNTS: Record<string, number> = {
  "pro-avista":    25000,
  "pro-parcelado": 30000,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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

    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ valid: false, error: "Muitas tentativas. Aguarde 1 minuto." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { code, plan } = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(JSON.stringify({ valid: false, error: "Código obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseAmount = PLAN_AMOUNTS[plan];
    if (!baseAmount) {
      return new Response(JSON.stringify({ valid: false, error: "Plano inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: coupon } = await supabase
      .from("coupons")
      .select("id, code, kind, value, max_uses, uses_count, valid_from, valid_until, active")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (!coupon) {
      return new Response(JSON.stringify({ valid: false, error: "Cupom não encontrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!coupon.active) {
      return new Response(JSON.stringify({ valid: false, error: "Cupom inativo" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return new Response(JSON.stringify({ valid: false, error: "Cupom ainda não é válido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return new Response(JSON.stringify({ valid: false, error: "Cupom expirado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
      return new Response(JSON.stringify({ valid: false, error: "Cupom esgotado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calcular desconto (centavos)
    let discountCents: number;
    if (coupon.kind === "percent") {
      discountCents = Math.round(baseAmount * (Number(coupon.value) / 100));
    } else {
      // fixed: valor em reais → centavos
      discountCents = Math.round(Number(coupon.value) * 100);
    }

    const finalAmount = Math.max(0, baseAmount - discountCents);

    return new Response(
      JSON.stringify({
        valid: true,
        coupon_id: coupon.id,
        kind: coupon.kind,
        discount_value: Number(coupon.value),
        discount_cents: discountCents,
        original_amount: baseAmount,
        final_amount: finalAmount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
