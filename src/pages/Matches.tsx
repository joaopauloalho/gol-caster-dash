import { useState, useEffect } from "react";
import MatchCard from "@/components/MatchCard";
import { phases, fetchMatchesByPhase, groupByDate, type PhaseKey, type MatchData } from "@/data/matches";

const Matches = () => {
  const [activePhase, setActivePhase] = useState<PhaseKey>("Grupos");
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchMatchesByPhase(activePhase).then((data) => {
      setMatches(data);
      setLoading(false);
    });
  }, [activePhase]);

  const matchDays = groupByDate(matches);

  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="px-4 mb-4">
        <h1 className="text-2xl font-black text-foreground">⚽ Jogos</h1>
        <p className="text-xs text-muted-foreground mt-1">Faça seus palpites para cada partida</p>
      </div>

      <div className="flex gap-1.5 px-4 overflow-x-auto pb-3 scrollbar-hide">
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

      <div className="px-4 space-y-6">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Carregando jogos...</div>
        ) : matchDays.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Nenhum jogo encontrado</div>
        ) : (
          matchDays.map(({ date, matches }) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{date}</h2>
              </div>
              <div className="space-y-3">
                {matches.map((match) => (
                  <MatchCard key={match.matchNumber} {...match} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Matches;
