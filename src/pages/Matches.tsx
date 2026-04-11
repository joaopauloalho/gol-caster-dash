import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import MatchCard from "@/components/MatchCard";
import { phases, fetchMatchesByPhase, groupByDate, type PhaseKey, type MatchData } from "@/data/matches";
import { useAuth } from "@/hooks/useAuth";
import { useParticipant } from "@/hooks/useParticipant";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

function isMatchOpen(match: { startsAt?: string | null; scored?: boolean }): boolean {
  if (match.scored) return false;
  if (!match.startsAt) return true;
  return new Date(match.startsAt) > new Date();
}

const Matches = () => {
  const [activePhase, setActivePhase] = useState<PhaseKey>("Brasileirão");
  const [activeStage, setActiveStage] = useState("Todos");
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [predictedIds, setPredictedIds] = useState<Set<number>>(new Set());
  const { user } = useAuth();
  const { hasPaid, loading: partLoading } = useParticipant();
  const navigate = useNavigate();

  const showBlur = false;

  useEffect(() => {
    setLoading(true);
    setActiveStage("Todos");
    fetchMatchesByPhase(activePhase).then((data) => {
      setMatches(data);
      setLoading(false);
    });
  }, [activePhase]);

  // Fetch prediction IDs for current user whenever matches or user changes
  useEffect(() => {
    if (!user || matches.length === 0) { setPredictedIds(new Set()); return; }
    const matchIds = matches.map(m => m.id);
    supabase
      .from("predictions")
      .select("match_id")
      .eq("user_id", user.id)
      .in("match_id", matchIds)
      .then(({ data }) => {
        if (data) setPredictedIds(new Set(data.map(p => p.match_id)));
      });
  }, [user, matches]);

  // Unique stages within the loaded phase, preserving order of appearance
  const stages = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = ["Todos"];
    matches.forEach(m => {
      if (m.group && !seen.has(m.group)) { seen.add(m.group); result.push(m.group); }
    });
    return result;
  }, [matches]);

  const filteredMatches = activeStage === "Todos"
    ? matches
    : matches.filter(m => m.group === activeStage);

  const matchDays = groupByDate(filteredMatches);

  const openMatches = matches.filter(m => isMatchOpen(m));
  const predictedCount = openMatches.filter(m => predictedIds.has(m.id)).length;
  const totalOpen = openMatches.length;

  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="px-4 mb-3">
        <h1 className="text-2xl font-black text-foreground">⚽ Jogos</h1>
        <p className="text-xs text-muted-foreground mt-1">Faça seus palpites para cada partida</p>
      </div>

      {/* Prediction progress */}
      {user && !loading && (
        <div className="px-4 mb-3">
          <div className="bg-glass rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Seus palpites</span>
            <span className="text-xs font-bold text-foreground">
              {predictedCount} / {totalOpen} partidas abertas
            </span>
          </div>
          {totalOpen > 0 && (
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(predictedCount / totalOpen) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Phase tabs */}
      <div className="flex gap-1.5 px-4 overflow-x-auto pb-2 scrollbar-hide">
        {phases.map((phase) => (
          <button
            key={phase}
            onClick={() => setActivePhase(phase)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activePhase === phase
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {phase}
          </button>
        ))}
      </div>

      {/* Stage / round sub-filter */}
      {!loading && stages.length > 2 && (
        <div className="flex gap-1.5 px-4 mb-4 mt-2 overflow-x-auto scrollbar-hide">
          {stages.map((s) => (
            <button
              key={s}
              onClick={() => { setActiveStage(s); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeStage === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="relative px-4 space-y-6">
        {showBlur && !loading && !partLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-md bg-background/40 rounded-xl">
            <Lock className="w-10 h-10 text-primary mb-3" />
            <h3 className="text-lg font-black text-foreground mb-1">Área Restrita</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
              Assine o plano para desbloquear seus palpites e concorrer aos prêmios.
            </p>
            <Button onClick={() => navigate("/")} className="btn-gold rounded-xl font-bold">
              Inscrever-se Agora
            </Button>
          </div>
        )}

        <div className={showBlur && !loading ? "filter blur-sm pointer-events-none select-none" : ""}>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-glass rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="w-8 h-8 mx-4" />
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="w-10 h-10 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : matchDays.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Nenhum jogo encontrado</div>
          ) : (
            matchDays.map(({ date, matches: dayMatches }) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{date}</h2>
                </div>
                <div className="space-y-3">
                  {dayMatches.map((match) => (
                    <MatchCard
                      key={match.matchNumber}
                      {...match}
                      hasPaid={hasPaid}
                      hasSavedPrediction={predictedIds.has(match.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Matches;
