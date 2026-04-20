/**
 * scoring.ts — cálculo de pontos de um palpite vs resultado real
 *
 * Stage multipliers SSoT: src/lib/stageMultipliers.ts
 * CONVENÇÃO (aplicar igual em server: supabase/functions/score-match/index.ts)
 *
 * Placar exato:              25 pts
 * Vencedor/empate:           10 pts (separado; não se aplica se saldo ganhou)
 * Saldo de gols:             15 pts — substitui vencedor (evita double count):
 *                            só quando placar errado + vencedor certo + |diff| igual
 * Gol 1º / 2º tempo:        5 pts cada
 * Expulsão — Sim certo:     12 pts | Não certo: 5 pts (assimétrico; acertar Sim é mais raro)
 * Pênalti — Sim certo:      12 pts | Não certo: 5 pts (mesmo padrão)
 * VAR anulou gol — Sim:     12 pts | Não certo: 5 pts (mesmo padrão)
 * 1º a marcar:               8 pts
 * Posse de bola:             5 pts
 * Minuto do 1º gol:         25 pts (exato); proximidade usada como tie-breaker no ranking diário
 *   pred=null → não respondeu (0 pts); pred=0 → sem gol; pred=1-90 → minuto
 *   result=null → sem gols; result=1-90 → minuto
 * Gabarito perfeito (10/10): 125 pts base (pré-multiplicador de fase; sobrescreve somas individuais)
 *   Minuto do 1º gol é bônus adicional aplicado APÓS gabarito, máximo total = 150 pts
 *
 * MAX_BASE_POINTS = 150 (gabarito 125 + minuto 25)
 */

export interface PredictionInput {
  home_score:          number | null;
  away_score:          number | null;
  winner_pick:         string | null;
  goal_first_half:     boolean | null;
  goal_second_half:    boolean | null;
  has_red_card:        boolean | null;
  has_penalty:         boolean | null;
  has_var_goal:        boolean | null;
  first_to_score:      string | null;
  possession_winner:   string | null;
  /** null=não respondeu, 0=sem gol, 1-90=minuto */
  first_goal_minute?:  number | null;
  /** only for knockout stages */
  has_overtime?:       boolean | null;
  has_shootout?:       boolean | null;
}

export interface MatchResultInput {
  home:               number;
  away:               number;
  winner:             string;
  goalFirstHalf:      boolean;
  goalSecondHalf:     boolean;
  redCard:            boolean;
  penalty:            boolean;
  varGoal:            boolean;
  firstToScore:       string;
  possession:         string;
  /** null=sem gols, 1-90=minuto do 1º gol */
  firstGoalMinute?:   number | null;
  /** only for knockout stages */
  overtime?:          boolean | null;
  shootout?:          boolean | null;
}

export { STAGE_MULTIPLIERS, getStageMultiplier } from "@/lib/stageMultipliers";

/** Pontos base máximos (pré-multiplicador) — gabarito 125 + minuto 25 */
export const MAX_BASE_POINTS = 150;

/**
 * Retorna pontos BASE (sem multiplicadores de fase ou Golden Pick).
 * Para o total completo use calculateTotalPoints().
 */
export function calculateMatchPoints(
  pred: PredictionInput,
  result: MatchResultInput,
): number {
  // ── Gabarito perfeito: 10 campos principais → 125 pts base ───────────────
  const isPerfect =
    pred.home_score       === result.home          &&
    pred.away_score       === result.away          &&
    pred.winner_pick      === result.winner        &&
    pred.goal_first_half  === result.goalFirstHalf &&
    pred.goal_second_half === result.goalSecondHalf&&
    pred.has_red_card     === result.redCard       &&
    pred.has_penalty      === result.penalty       &&
    pred.has_var_goal     === result.varGoal       &&
    pred.first_to_score   === result.firstToScore  &&
    pred.possession_winner=== result.possession;

  let pts = 0;

  if (isPerfect) {
    pts = 125;
  } else {
    // ── Placar + vencedor ───────────────────────────────────────────────────
    const exactScore =
      pred.home_score === result.home && pred.away_score === result.away;

    if (exactScore) {
      pts += 25;
      if (pred.winner_pick === result.winner) pts += 10;
    } else {
      const correctWinner =
        pred.winner_pick != null && pred.winner_pick === result.winner;
      const correctDiff =
        pred.home_score !== null &&
        pred.away_score !== null &&
        Math.abs(pred.home_score - pred.away_score) ===
        Math.abs(result.home - result.away);

      if (correctWinner && correctDiff) {
        pts += 15; // saldo: substitui winner
      } else if (correctWinner) {
        pts += 10;
      }
    }

    // ── Campos individuais ──────────────────────────────────────────────────
    if (pred.goal_first_half  !== null && pred.goal_first_half  === result.goalFirstHalf)  pts += 5;
    if (pred.goal_second_half !== null && pred.goal_second_half === result.goalSecondHalf) pts += 5;

    if (pred.has_red_card !== null && pred.has_red_card === result.redCard) {
      pts += pred.has_red_card ? 12 : 5;
    }
    if (pred.has_penalty  !== null && pred.has_penalty  === result.penalty) {
      pts += pred.has_penalty ? 12 : 5;
    }
    if (pred.has_var_goal !== null && pred.has_var_goal === result.varGoal) {
      pts += pred.has_var_goal ? 12 : 5;
    }
    if (pred.first_to_score   != null && pred.first_to_score   === result.firstToScore)  pts += 8;
    if (pred.possession_winner != null && pred.possession_winner === result.possession)   pts += 5;
  }

  // ── Minuto do 1º gol: bônus independente do gabarito (até +25 pts) ───────
  // pred: null=não respondeu, 0=sem gol, 1-90=minuto
  // result: null/undefined=sem gols, 1-90=minuto
  const pfgm = pred.first_goal_minute;
  if (pfgm !== undefined && pfgm !== null && result.firstGoalMinute !== undefined) {
    const predNoGoal = pfgm === 0;
    const realNoGoal = result.firstGoalMinute === null || result.firstGoalMinute === 0;
    if ((predNoGoal && realNoGoal) ||
        (!predNoGoal && !realNoGoal && pfgm === result.firstGoalMinute)) {
      pts += 25;
    }
  }

  // ── Prorrogação / Pênaltis (knockout only — natural no-op for group stage) ───
  if (pred.has_overtime != null && result.overtime != null) {
    pts += pred.has_overtime === result.overtime ? (pred.has_overtime ? 8 : 5) : 0;
  }
  if (pred.has_shootout != null && result.shootout != null) {
    pts += pred.has_shootout === result.shootout ? (pred.has_shootout ? 12 : 5) : 0;
  }

  return pts;
}

/**
 * Pontos totais com multiplicador de fase e Golden Pick.
 * Espelha: base * phaseMultiplier * (isGoldenPick ? 2 : 1) do score-match Edge Function.
 */
export function calculateTotalPoints(
  pred: PredictionInput,
  result: MatchResultInput,
  phaseMultiplier = 1,
  isGoldenPick = false,
): number {
  const base = calculateMatchPoints(pred, result);
  return base * phaseMultiplier * (isGoldenPick ? 2 : 1);
}
