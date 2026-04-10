import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import MatchCard from "@/components/MatchCard";
import { phases, fetchMatchesByPhase, groupByDate, type PhaseKey, type MatchData } from "@/data/matches";
import { useAuth } from "@/hooks/useAuth";
import { useParticipant } from "@/hooks/useParticipant";
import { Button } from "@/components/ui/button";

const Matches = () => {
  const [activePhase, setActivePhase] = useState<PhaseKey>("Grupos");
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { hasPaid, loading: partLoading } = useParticipant();
  const navigate = useNavigate();

  const showBlur = false; // desabilitado para testes

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

      <div className="relative px-4 space-y-6">
        {/* Blur overlay */}
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
    </div>
  );
};

export default Matches;
