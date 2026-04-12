/**
 * scoring.ts — cálculo de pontos de um palpite vs resultado real
 *
 * CONVENÇÃO (aplicar igual em server: supabase/functions/score-match/index.ts)
 *
 * Placar exato:              25 pts
 * Vencedor/empate:           10 pts (separado; não se aplica se saldo ganhou)
 * Saldo de gols:             15 pts — substitui vencedor (evita double count):
 *                            só quando placar errado + vencedor certo + |diff| igual
 * Gol 1º / 2º tempo:        5 pts cada
 * Expulsão — Sim certo:     12 pts | Não certo: 5 pts (assimétrico; acertar Sim é mais raro)
 * Pênalti:                   7 pts
 * 1º a marcar:               8 pts
 * Posse de bola:             5 pts
 * Gabarito perfeito (8/8):  100 pts base (pré-multiplicador de fase; sobrescreve somas individuais)
 *
 * MAX_BASE_POINTS = 100 (gabarito perfeito)
 */

export interface PredictionInput {
  home_score:       number | null;
  away_score:       number | null;
  winner_pick:      string | null;
  goal_first_half:  boolean | null;
  goal_second_half: boolean | null;
  has_red_card:     boolean | null;
  has_penalty:      boolean | null;
  first_to_score:   string | null;
  possession_winner:string | null;
}

export interface MatchResultInput {
  home:           number;
  away:           number;
  winner:         string;
  goalFirstHalf:  boolean;
  goalSecondHalf: boolean;
  redCard:        boolean;
  penalty:        boolean;
  firstToScore:   string;
  possession:     string;
}

/** Pontos base máximos (pré-multiplicador) — gabarito perfeito */
export const MAX_BASE_POINTS = 100;

/**
 * Retorna pontos BASE (pré-multiplicador de fase).
 * Aplicar: total = calculateMatchPoints(pred, result) * phaseMultiplier
 */
export function calculateMatchPoints(
  pred: PredictionInput,
  result: MatchResultInput,
): number {
  // ── Gabarito perfeito: todos os 8 campos batem → 100 pts base ─────────────
  const isPerfect =
    pred.home_score       === result.home          &&
    pred.away_score       === result.away          &&
    pred.winner_pick      === result.winner        &&
    pred.goal_first_half  === result.goalFirstHalf &&
    pred.goal_second_half === result.goalSecondHalf&&
    pred.has_red_card     === result.redCard       &&
    pred.has_penalty      === result.penalty       &&
    pred.first_to_score   === result.firstToScore  &&
    pred.possession_winner=== result.possession;

  if (isPerfect) return MAX_BASE_POINTS;

  let pts = 0;

  // ── Placar + vencedor ─────────────────────────────────────────────────────
  const exactScore =
    pred.home_score === result.home && pred.away_score === result.away;

  if (exactScore) {
    pts += 25;
    if (pred.winner_pick === result.winner) pts += 10; // vencedor separado do placar exato
  } else {
    const correctWinner =
      pred.winner_pick != null && pred.winner_pick === result.winner;
    const correctDiff =
      pred.home_score !== null &&
      pred.away_score !== null &&
      Math.abs(pred.home_score - pred.away_score) ===
      Math.abs(result.home - result.away);

    if (correctWinner && correctDiff) {
      pts += 15; // saldo: substitui winner (não acumula +10 separado)
    } else if (correctWinner) {
      pts += 10;
    }
  }

  // ── Campos individuais ────────────────────────────────────────────────────
  if (pred.goal_first_half  !== null && pred.goal_first_half  === result.goalFirstHalf)  pts += 5;
  if (pred.goal_second_half !== null && pred.goal_second_half === result.goalSecondHalf) pts += 5;

  // Expulsão assimétrica: acertar "Sim" (raro) vale mais
  if (pred.has_red_card !== null && pred.has_red_card === result.redCard) {
    pts += pred.has_red_card ? 12 : 5;
  }

  if (pred.has_penalty  !== null && pred.has_penalty  === result.penalty) {
    pts += pred.has_penalty ? 12 : 5; // Sim certo=12, Não certo=5 (mesmo padrão da expulsão)
  }
  if (pred.first_to_score  != null && pred.first_to_score  === result.firstToScore)  pts += 8;
  if (pred.possession_winner != null && pred.possession_winner === result.possession) pts += 5;

  return pts;
}
