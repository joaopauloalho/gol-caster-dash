/**
 * register-participant — cria registro de participante após signup
 *
 * Segurança implementada:
 * 1. Verifica JWT e garante que userId no body = auth.uid()
 *    (sem isso, qualquer pessoa podia criar participante para outro usuário)
 * 2. payment_confirmed sempre começa como false (não aceito do cliente)
 * 3. bonus_points não aceito do cliente (começa em 0 pelo default do banco)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") || "*", // "*" only in dev; set SITE_URL in prod
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Verificação de identidade ─────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Autenticação obrigatória" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Usa service role para ter acesso a auth.admin e tabelas protegidas
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
    // ── Fim verificação ───────────────────────────────────────────────────

    const body = await req.json();
    const {
      userId, fullName, username, email, whatsapp,
      cpf, birthDate, state, city, plan,
      referredById, favoriteTeam, groupInviteCode,
    } = body;

    // userId no body deve ser o do token — previne criar participante para outro user
    if (!userId || user.id !== userId) {
      return new Response(JSON.stringify({ error: "userId não corresponde ao token" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Validação de deadline de palpite (somente quando match_id for enviado) ──
    if (body.match_id) {
      const { data: matchData, error: matchCheckErr } = await supabase
        .from("matches")
        .select("starts_at, scored")
        .eq("id", body.match_id)
        .single();

      if (matchCheckErr) {
        return new Response(
          JSON.stringify({ error: "Partida não encontrada" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (matchData.scored) {
        return new Response(
          JSON.stringify({ error: "Esta partida já foi encerrada e pontuada." }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (matchData.starts_at && new Date(matchData.starts_at) <= new Date()) {
        return new Response(
          JSON.stringify({ error: "O prazo para palpites nesta partida já encerrou." }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    // ── Fim validação de deadline ─────────────────────────────────────────────

    // payment_confirmed e bonus_points NUNCA vêm do cliente
    const { error } = await supabase.from("participants").upsert({
      id:                userId,
      user_id:           userId,
      full_name:         fullName,
      username:          username ?? null,
      email,
      whatsapp,
      cpf,
      birth_date:        birthDate,
      state,
      city,
      plan,
      referred_by:       referredById ?? null,
      payment_confirmed: false,  // hardcoded — nunca do cliente
      favorite_team:     favoriteTeam ?? null,
    }, { onConflict: "user_id", ignoreDuplicates: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca referral_code gerado pelo banco
    const { data: participant } = await supabase
      .from("participants")
      .select("referral_code")
      .eq("user_id", userId)
      .maybeSingle();

    // Entra no grupo automaticamente se veio com invite code
    if (groupInviteCode) {
      const { data: group } = await supabase
        .from("groups")
        .select("id")
        .ilike("invite_code", groupInviteCode)
        .maybeSingle();

      if (group?.id) {
        await supabase
          .from("group_members")
          .upsert(
            { group_id: group.id, user_id: userId, participant_id: userId },
            { onConflict: "group_id,user_id" }
          );
      }
    }

    return new Response(
      JSON.stringify({ referral_code: participant?.referral_code ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
