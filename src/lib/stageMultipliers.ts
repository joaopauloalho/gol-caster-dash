/**
 * stageMultipliers.ts — Single Source of Truth for stage/phase multipliers.
 *
 * IMPORTANT: The same values MUST be kept in sync with
 * supabase/functions/score-match/index.ts (STAGE_MULTIPLIERS constant).
 * That file cannot import from src/ (Deno Edge Function), so values are duplicated
 * there with a comment pointing back here.
 */

/**
 * Maps each phase key to its point multiplier.
 * Phase keys are the canonical internal names used throughout the frontend.
 */
export const STAGE_MULTIPLIERS: Record<string, number> = {
  // Group/regular phase — no multiplier
  "Brasileirão": 1,
  "Grupos":       1,
  "Group Stage":  1,

  // Round of 32 / Round of 16 — 2×
  "32avos":       2,
  "Round of 32":  2,
  "Oitavas":      2,
  "Round of 16":  2,

  // Quarter-finals — 3×
  "Quartas":       3,
  "Quarter-finals": 3,

  // Semi-finals — 4×
  "Semis":         4,
  "Semi-finals":   4,

  // Final & Third Place — 5×
  "Final":         5,
  "Third Place":   5,
};

/**
 * Returns the multiplier for a given stage string.
 * Defaults to 1 if the stage is not found.
 */
export function getStageMultiplier(stage: string): number {
  return STAGE_MULTIPLIERS[stage] ?? 1;
}
