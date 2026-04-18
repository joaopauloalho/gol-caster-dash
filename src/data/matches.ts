import { supabase } from "@/integrations/supabase/client";

export interface MatchData {
  id: number;
  matchNumber: number;
  date: string;
  time: string;
  stage: string;
  group: string;
  city: string;
  teamA: string;
  teamB: string;
  flagA: string;
  flagB: string;
  scored?: boolean;
  startsAt?: string | null;
  resultHome?: number | null;
  resultAway?: number | null;
  resultWinner?: string | null;
  resultGoalFirstHalf?: boolean | null;
  resultGoalSecondHalf?: boolean | null;
  resultRedCard?: boolean | null;
  resultPenalty?: boolean | null;
  resultVarGoal?: boolean | null;
  resultFirstToScore?: string | null;
  resultPossession?: string | null;
  resultFirstGoalMinute?: number | null;
  resultOvertime?: boolean | null;
  resultShootout?: boolean | null;
}

export type PhaseKey = "Brasileirão" | "Grupos" | "32avos" | "Oitavas" | "Quartas" | "Semis" | "Final";

export const phases: PhaseKey[] = ["Brasileirão", "Grupos", "32avos", "Oitavas", "Quartas", "Semis", "Final"];

export const PHASE_MULTIPLIERS: Record<PhaseKey, number> = {
  Brasileirão: 1,
  Grupos: 1,
  "32avos": 2,
  Oitavas: 2,
  Quartas: 3,
  Semis: 4,
  Final: 5,
};

// Converte date (DD/MM/YYYY) + time (HH:mm) em Brasília para um Date UTC
export function parseMatchDateTime(date: string, time: string): Date {
  const [dd, mm, yyyy] = date.split("/");
  return new Date(`${yyyy}-${mm}-${dd}T${time}:00-03:00`);
}

export function getPhaseMultiplier(stage: string): number {
  const key = stageToPhase(stage);
  return PHASE_MULTIPLIERS[key];
}

function stageToPhase(stage: string): PhaseKey {
  if (stage === "Brasileirão") return "Brasileirão";
  if (stage === "Group Stage") return "Grupos";
  if (stage === "Round of 32") return "32avos";
  if (stage === "Round of 16") return "Oitavas";
  if (stage === "Quarter-finals") return "Quartas";
  if (stage === "Semi-finals") return "Semis";
  if (stage === "Third Place") return "Final";
  console.warn(`[stageToPhase] unknown stage: "${stage}" — defaulting to Grupos (1×)`);
  return "Grupos";
}

export interface MatchDay {
  date: string;
  matches: MatchData[];
}

export function groupByDate(matches: MatchData[]): MatchDay[] {
  const map = new Map<string, MatchData[]>();
  for (const m of matches) {
    if (!map.has(m.date)) map.set(m.date, []);
    map.get(m.date)!.push(m);
  }
  return Array.from(map.entries()).map(([date, matches]) => ({ date, matches }));
}

export async function fetchMatchesByPhase(phase: PhaseKey): Promise<MatchData[]> {
  // Map phase back to stage values
  const stageMap: Record<PhaseKey, string[]> = {
    "Brasileirão": ["Brasileirão"],
    "Grupos": ["Group Stage"],
    "32avos": ["Round of 32"],
    "Oitavas": ["Round of 16"],
    "Quartas": ["Quarter-finals"],
    "Semis": ["Semi-finals"],
    "Final": ["Third Place", "Final"],
  };

  const stages = stageMap[phase];
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .in("stage", stages)
    .order("match_number", { ascending: true });

  if (error) {
    console.error("Error fetching matches:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    matchNumber: row.match_number,
    date: row.date,
    time: row.time,
    stage: row.stage,
    group: row.group_name,
    city: row.city,
    teamA: row.team_a,
    teamB: row.team_b,
    flagA: row.flag_a,
    flagB: row.flag_b,
    scored: row.scored ?? false,
    startsAt: row.starts_at ?? null,
    resultHome: row.result_home ?? null,
    resultAway: row.result_away ?? null,
    resultWinner: row.result_winner ?? null,
    resultGoalFirstHalf: row.result_goal_first_half ?? null,
    resultGoalSecondHalf: row.result_goal_second_half ?? null,
    resultRedCard: row.result_red_card ?? null,
    resultPenalty: row.result_penalty ?? null,
    resultVarGoal: row.result_var_goal ?? null,
    resultFirstToScore: row.result_first_to_score ?? null,
    resultPossession: row.result_possession ?? null,
    resultFirstGoalMinute: row.result_first_goal_minute ?? null,
    resultOvertime: row.result_overtime ?? null,
    resultShootout: row.result_shootout ?? null,
  }));
}
