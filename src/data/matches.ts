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
}

export type PhaseKey = "Grupos" | "32avos" | "Oitavas" | "Quartas" | "Semis" | "Final";

export const phases: PhaseKey[] = ["Grupos", "32avos", "Oitavas", "Quartas", "Semis", "Final"];

export const PHASE_MULTIPLIERS: Record<PhaseKey, number> = {
  Grupos: 1,
  "32avos": 2,
  Oitavas: 3,
  Quartas: 5,
  Semis: 7,
  Final: 10,
};

export function getPhaseMultiplier(stage: string): number {
  const key = stageToPhase(stage);
  return PHASE_MULTIPLIERS[key];
}

function stageToPhase(stage: string): PhaseKey {
  if (stage === "Group Stage") return "Grupos";
  if (stage === "Round of 32") return "32avos";
  if (stage === "Round of 16") return "Oitavas";
  if (stage === "Quarter-finals") return "Quartas";
  if (stage === "Semi-finals") return "Semis";
  return "Final";
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
  }));
}
