import { useState } from "react";
import { ChevronDown, ChevronUp, Check, Zap } from "lucide-react";

interface MatchCardProps {
  teamA: string;
  teamB: string;
  flagA: string;
  flagB: string;
  date: string;
  time: string;
  group: string;
  matchNumber: number;
}

const MatchCard = ({ teamA, teamB, flagA, flagB, date, time, group, matchNumber }: MatchCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [scoreA, setScoreA] = useState<number | "">("");
  const [scoreB, setScoreB] = useState<number | "">("");
  const [winner, setWinner] = useState<"A" | "X" | "B" | null>(null);
  const [goalFirstHalf, setGoalFirstHalf] = useState<boolean | null>(null);
  const [goalSecondHalf, setGoalSecondHalf] = useState<boolean | null>(null);
  const [redCard, setRedCard] = useState<boolean | null>(null);
  const [penalty, setPenalty] = useState<boolean | null>(null);
  const [firstGoal, setFirstGoal] = useState<"A" | "N" | "B" | null>(null);
  const [possession, setPossession] = useState<"A" | "B" | null>(null);
  const [saved, setSaved] = useState(false);

  const filledCount = [
    scoreA !== "" && scoreB !== "",
    winner !== null,
    goalFirstHalf !== null,
    goalSecondHalf !== null,
    redCard !== null,
    penalty !== null,
    firstGoal !== null,
    possession !== null,
  ].filter(Boolean).length;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={`card-match rounded-xl overflow-hidden transition-all duration-300 ${expanded ? "ring-1 ring-primary/30" : ""}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl">{flagA}</span>
            <span className="font-bold text-sm text-foreground">{teamA}</span>
          </div>
          <div className="flex flex-col items-center px-3">
            <span className="text-[10px] text-muted-foreground font-medium uppercase">{group}</span>
            <span className="text-xs font-bold text-primary">VS</span>
            <span className="text-[10px] text-muted-foreground">{time}</span>
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className="font-bold text-sm text-foreground">{teamB}</span>
            <span className="text-2xl">{flagB}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3">
          {filledCount > 0 && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              filledCount === 8 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {filledCount}/8
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-slide-up">
          <div className="h-px bg-border" />

          {/* Placar */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
              Placar Exato <span className="text-primary">(25 pts)</span>
            </label>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{flagA}</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={scoreA}
                  onChange={(e) => setScoreA(e.target.value === "" ? "" : parseInt(e.target.value))}
                  className="w-14 h-12 rounded-lg bg-muted text-center text-xl font-black text-foreground border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="0"
                />
              </div>
              <span className="text-muted-foreground font-bold text-lg">×</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={scoreB}
                  onChange={(e) => setScoreB(e.target.value === "" ? "" : parseInt(e.target.value))}
                  className="w-14 h-12 rounded-lg bg-muted text-center text-xl font-black text-foreground border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="0"
                />
                <span className="text-lg">{flagB}</span>
              </div>
            </div>
          </div>

          {/* Vencedor */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
              Vencedor / Empate <span className="text-primary">(10 pts)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "A" as const, label: teamA },
                { key: "X" as const, label: "Empate" },
                { key: "B" as const, label: teamB },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setWinner(winner === key ? null : key)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    winner === key
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Gol 1º Tempo */}
            <ToggleField label="Gol no 1º Tempo" points={5} value={goalFirstHalf} onChange={setGoalFirstHalf} />
            <ToggleField label="Gol no 2º Tempo" points={5} value={goalSecondHalf} onChange={setGoalSecondHalf} />
            <ToggleField label="Terá Expulsão?" points={7} value={redCard} onChange={setRedCard} />
            <ToggleField label="Terá Pênalti?" points={7} value={penalty} onChange={setPenalty} />
          </div>

          {/* Quem marca primeiro */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
              Quem marca 1º? <span className="text-primary">(8 pts)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "A" as const, label: teamA },
                { key: "N" as const, label: "Ninguém" },
                { key: "B" as const, label: teamB },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFirstGoal(firstGoal === key ? null : key)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    firstGoal === key
                      ? "bg-secondary text-secondary-foreground shadow-lg"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mais Posse */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
              Mais Posse de Bola <span className="text-primary">(5 pts)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "A" as const, label: teamA },
                { key: "B" as const, label: teamB },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPossession(possession === key ? null : key)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    possession === key
                      ? "bg-secondary text-secondary-foreground shadow-lg"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              saved
                ? "bg-secondary text-secondary-foreground"
                : "btn-gold"
            }`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" /> Palpite Salvo!
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" /> Salvar Palpite
              </>
            )}
          </button>

          {filledCount === 8 && (
            <div className="text-center text-[10px] text-primary font-semibold animate-pulse-gold p-2 rounded-lg bg-glass-gold">
              🏆 Todos os 8 palpites preenchidos — Potencial máximo: 82 pts!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ToggleFieldProps {
  label: string;
  points: number;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}

const ToggleField = ({ label, points, value, onChange }: ToggleFieldProps) => (
  <div className="bg-muted/50 rounded-lg p-3">
    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
      {label} <span className="text-primary">({points} pts)</span>
    </label>
    <div className="flex gap-2">
      <button
        onClick={() => onChange(value === true ? null : true)}
        className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
          value === true ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        Sim
      </button>
      <button
        onClick={() => onChange(value === false ? null : false)}
        className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
          value === false ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        Não
      </button>
    </div>
  </div>
);

export default MatchCard;
