import { useState } from "react";
import MatchCard from "@/components/MatchCard";

const matchDays = [
  {
    date: "11 Jun 2026",
    matches: [
      { teamA: "México", teamB: "Canadá", flagA: "🇲🇽", flagB: "🇨🇦", time: "13:00", group: "Grupo A", matchNumber: 1 },
      { teamA: "EUA", teamB: "Irlanda", flagA: "🇺🇸", flagB: "🇮🇪", time: "16:00", group: "Grupo A", matchNumber: 2 },
    ],
  },
  {
    date: "12 Jun 2026",
    matches: [
      { teamA: "Brasil", teamB: "Sérvia", flagA: "🇧🇷", flagB: "🇷🇸", time: "16:00", group: "Grupo B", matchNumber: 3 },
      { teamA: "Argentina", teamB: "Austrália", flagA: "🇦🇷", flagB: "🇦🇺", time: "19:00", group: "Grupo C", matchNumber: 4 },
    ],
  },
  {
    date: "13 Jun 2026",
    matches: [
      { teamA: "França", teamB: "Colômbia", flagA: "🇫🇷", flagB: "🇨🇴", time: "13:00", group: "Grupo D", matchNumber: 5 },
      { teamA: "Alemanha", teamB: "Japão", flagA: "🇩🇪", flagB: "🇯🇵", time: "16:00", group: "Grupo E", matchNumber: 6 },
      { teamA: "Espanha", teamB: "Equador", flagA: "🇪🇸", flagB: "🇪🇨", time: "19:00", group: "Grupo F", matchNumber: 7 },
    ],
  },
];

const phases = ["Grupos", "Oitavas", "Quartas", "Semis", "Final"];

const Matches = () => {
  const [activePhase, setActivePhase] = useState("Grupos");

  return (
    <div className="min-h-screen pb-24 pt-4">
      {/* Header */}
      <div className="px-4 mb-4">
        <h1 className="text-2xl font-black text-foreground">⚽ Jogos</h1>
        <p className="text-xs text-muted-foreground mt-1">Faça seus palpites para cada partida</p>
      </div>

      {/* Phase Tabs */}
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

      {/* Match Days */}
      <div className="px-4 space-y-6">
        {matchDays.map(({ date, matches }) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{date}</h2>
            </div>
            <div className="space-y-3">
              {matches.map((match) => (
                <MatchCard key={match.matchNumber} {...match} date={date} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Matches;
