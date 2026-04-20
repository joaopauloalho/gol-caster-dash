import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// CPF masking: "123.456.789-00" → "***.456.789-**"
// Handles both formatted ("123.456.789-00") and raw digits ("12345678900").
function maskCpf(cpf: string): string {
  if (!cpf) return cpf;
  // Strip non-digits to work with raw number
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) {
    // Unknown format — mask everything except middle 6 digits
    if (digits.length > 6) {
      return "***." + digits.slice(3, 6) + "." + digits.slice(6, 9) + "-**";
    }
    return cpf.replace(/./g, "*");
  }
  // Format: ***.<3-5>.<6-8>-**
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

// WhatsApp masking: last 4 characters replaced with ****
// Works for formatted "(11) 99999-1234" → "(11) 99999-****"
// and raw "11999991234" → "1199999****"
function maskWhatsapp(whatsapp: string): string {
  if (!whatsapp || whatsapp.length <= 4) return "****";
  return whatsapp.slice(0, -4) + "****";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ── Admin check ────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Autenticação obrigatória" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (user.app_metadata?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Sem permissão de admin" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  // ── End admin check ────────────────────────────────────────────────────────

  try {
    const { data: rows, error: fetchErr } = await supabase
      .from("participants")
      .select("id, user_id, full_name, email, username, state, city, plan, payment_confirmed, is_test_user, bonus_points, created_at, whatsapp, cpf")
      .order("created_at", { ascending: false })
      .limit(500);

    if (fetchErr) throw fetchErr;

    const participants = (rows ?? []).map((p: Record<string, unknown>) => ({
      id: p.id,
      user_id: p.user_id,
      full_name: p.full_name,
      email: p.email,
      username: p.username,
      state: p.state,
      city: p.city,
      plan: p.plan,
      payment_confirmed: p.payment_confirmed,
      is_test_user: p.is_test_user,
      bonus_points: p.bonus_points,
      created_at: p.created_at,
      // Masked sensitive fields
      cpf: maskCpf(p.cpf as string),
      whatsapp: maskWhatsapp(p.whatsapp as string),
    }));

    return new Response(JSON.stringify({ participants }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
