/**
 * score-match — calcula e distribui pontos de um jogo
 *
 * Segurança: requer autenticação de admin (mesmo padrão de admin-confirm-payment).
 *
 * SCORING — SYNC com src/lib/scoring.ts calculateMatchPoints (duplicado por incompatibilidade Deno/Vite)
 *
 * Placar exato:              25 pts
 * Vencedor/empate:           10 pts (separado; não se aplica se saldo ganhou)
 * Saldo de gols:             15 pts — substitui vencedor: placar errado + vencedor certo + |diff| igual
 * Gol 1º / 2º tempo:        5 pts cada
 * Expulsão — Sim certo:     12 pts | Não certo: 5 pts
 * Pênalti:                   7 pts
 * 1º a marcar:               8 pts
 * Posse de bola:             5 pts
 * Gabarito perfeito (10/10): 125 pts base, depois × multiplicador de fase
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MULTIPLIERS: Record<string, number> = {
  "Group Stage": 1, "Grupos": 1, "Brasileirão": 1,
  "32avos": 2,
  "Round of 16": 2, "Oitavas": 2,
  "Quarter-finals": 3, "Quartas": 3,
  "Semi-finals": 4, "Semis": 4,
  "Final": 5, "Third Place": 5,
};

function getMultiplier(stage: string): number {
  return MULTIPLIERS[stage] ?? 1;
}

// ── SYNC com src/lib/scoring.ts ───────────────────────────────────────────────
interface Pred {
  home_score:        number | null;
  away_score:        number | null;
  winner_pick:       string | null;
  goal_first_half:   boolean | null;
  goal_second_half:  boolean | null;
  has_red_card:      boolean | null;
  has_penalty:       boolean | null;
  has_var_goal:      boolean | null;
  first_to_score:    string | null;
  possession_winner: string | null;
  is_double_points:  boolean | null;
}

interface Res {
  home:           number;
  away:           number;
  winner:         string;
  goalFirstHalf:  boolean;
  goalSecondHalf: boolean;
  redCard:        boolean;
  penalty:        boolean;
  varGoal:        boolean;
  firstToScore:   string;
  possession:     string;
}

function calculateMatchPoints(p: Pred, r: Res): number {
  // Gabarito perfeito (8/8) → 100 pts base
  const isPerfect =
    p.home_score       === r.home          &&
    p.away_score       === r.away          &&
    p.winner_pick      === r.winner        &&
    p.goal_first_half  === r.goalFirstHalf &&
    p.goal_second_half === r.goalSecondHalf&&
    p.has_red_card     === r.redCard       &&
    p.has_penalty      === r.penalty       &&
    p.has_var_goal     === r.varGoal       &&
    p.first_to_score   === r.firstToScore  &&
    p.possession_winner=== r.possession;

  if (isPerfect) return 125;

  let pts = 0;

  const exactScore = p.home_score === r.home && p.away_score === r.away;
  if (exactScore) {
    pts += 25;
    if (p.winner_pick === r.winner) pts += 10;
  } else {
    const correctWinner = p.winner_pick != null && p.winner_pick === r.winner;
    const correctDiff =
      p.home_score !== null &&
      p.away_score !== null &&
      Math.abs(p.home_score - p.away_score) === Math.abs(r.home - r.away);
    if (correctWinner && correctDiff) {
      pts += 15; // saldo: substitui winner (não acumula +10 separado)
    } else if (correctWinner) {
      pts += 10;
    }
  }

  if (p.goal_first_half  !== null && p.goal_first_half  === r.goalFirstHalf)  pts += 5;
  if (p.goal_second_half !== null && p.goal_second_half === r.goalSecondHalf) pts += 5;
  if (p.has_red_card !== null && p.has_red_card === r.redCard) {
    pts += p.has_red_card ? 12 : 5; // Sim certo=12, Não certo=5
  }
  if (p.has_penalty  !== null && p.has_penalty  === r.penalty) {
    pts += p.has_penalty ? 12 : 5;
  }
  if (p.has_var_goal !== null && p.has_var_goal === r.varGoal) {
    pts += p.has_var_goal ? 12 : 5;
  }
  if (p.first_to_score  != null && p.first_to_score  === r.firstToScore)  pts += 8;
  if (p.possession_winner != null && p.possession_winner === r.possession) pts += 5;

  return pts;
}
// ── FIM SYNC ──────────────────────────────────────────────────────────────────

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
    if (user.app_metadata?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Sem permissão de admin" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ── Fim verificação de admin ────────────────────────────────────────────

    const { match_id, result } = await req.json();

    // ── Guard de idempotência: aborta se partida já foi pontuada ───────────────
    const { data: existingMatch, error: checkErr } = await supabase
      .from("matches")
      .select("id, scored")
      .eq("id", match_id)
      .single();

    if (checkErr) throw new Error(checkErr.message);
    if (existingMatch?.scored === true) {
      return new Response(
        JSON.stringify({ error: "Partida já foi pontuada anteriormente.", alreadyScored: true }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // ── Fim guard ─────────────────────────────────────────────────────────────

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
        result_var_goal:         result.varGoal,
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
      const base = calculateMatchPoints(p as Pred, result as Res);
      const total = base * multiplier * ((p as Pred).is_double_points ? 2 : 1);

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
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
