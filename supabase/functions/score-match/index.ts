/**
 * score-match — calcula e distribui pontos de um jogo
 *
 * Segurança: requer autenticação de admin (mesmo padrão de admin-confirm-payment).
 * Sem este check, qualquer pessoa podia forjar resultados e distribuir pontos.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "";

const MULTIPLIERS: Record<string, number> = {
  "Group Stage": 1, "Grupos": 1, "Brasileirão": 1,
  "Round of 16": 2, "Oitavas": 2,
  "Quarter-finals": 3, "Quartas": 3,
  "Semi-finals": 4, "Semis": 4,
  "Final": 5,
};

function getMultiplier(stage: string): number {
  return MULTIPLIERS[stage] ?? 1;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ── Verificação de admin ────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Sem autorização" }), {
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
    if (user.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Sem permissão de admin" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ── Fim verificação de admin ────────────────────────────────────────────

    const { match_id, result } = await req.json();

    // Salva resultado no jogo
    const { data: match, error: matchErr } = await supabase
      .from("matches")
      .update({
        result_home:             result.home,
        result_away:             result.away,
        result_winner:           result.winner,
        result_goal_first_half:  result.goalFirstHalf,
        result_goal_second_half: result.goalSecondHalf,
        result_red_card:         result.redCard,
        result_penalty:          result.penalty,
        result_first_to_score:   result.firstToScore,
        result_possession:       result.possession,
        scored:                  true,
      })
      .eq("id", match_id)
      .select("stage")
      .single();

    if (matchErr) throw new Error(matchErr.message);

    const multiplier = getMultiplier(match.stage);

    const { data: predictions } = await supabase
      .from("predictions")
      .select("*")
      .eq("match_id", match_id);

    if (!predictions?.length) {
      return new Response(JSON.stringify({ scored: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const p of predictions) {
      let pts = 0;
      if (p.home_score === result.home && p.away_score === result.away) pts += 25;
      if (p.winner_pick && p.winner_pick === result.winner)             pts += 10;
      if (p.goal_first_half  !== null && p.goal_first_half  === result.goalFirstHalf)  pts += 5;
      if (p.goal_second_half !== null && p.goal_second_half === result.goalSecondHalf) pts += 5;
      if (p.has_red_card     !== null && p.has_red_card     === result.redCard)        pts += 7;
      if (p.has_penalty      !== null && p.has_penalty      === result.penalty)        pts += 7;
      if (p.first_to_score && p.first_to_score === result.firstToScore)               pts += 8;
      if (p.possession_winner && p.possession_winner === result.possession)            pts += 5;

      const total = pts * multiplier;

      await supabase
        .from("predictions")
        .update({ points_earned: total })
        .eq("id", p.id);

      if (total > 0) {
        await supabase.rpc("increment_points", { uid: p.user_id, pts: total });
      }
    }

    return new Response(
      JSON.stringify({ scored: predictions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
