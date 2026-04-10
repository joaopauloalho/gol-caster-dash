import { useState } from "react";
import { ChevronDown, ChevronUp, Check, Zap, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getPhaseMultiplier, parseMatchDateTime } from "@/data/matches";

// ISO 3166-1 alpha-2 codes for flagcdn.com (keyed by translated PT-BR name)
const FLAG_CODE: Record<string, string> = {
  "México": "mx", "Estados Unidos": "us", "Canadá": "ca", "Costa Rica": "cr",
  "Panamá": "pa", "Honduras": "hn", "El Salvador": "sv", "Jamaica": "jm",
  "Haiti": "ht", "Trinidad e Tobago": "tt",
  "Brasil": "br", "Argentina": "ar", "Colômbia": "co", "Uruguai": "uy",
  "Equador": "ec", "Chile": "cl", "Peru": "pe", "Bolívia": "bo",
  "Paraguai": "py", "Venezuela": "ve",
  "França": "fr", "Alemanha": "de", "Espanha": "es", "Inglaterra": "gb-eng",
  "Portugal": "pt", "Holanda": "nl", "Bélgica": "be", "Itália": "it",
  "Croácia": "hr", "Suíça": "ch", "Dinamarca": "dk", "Suécia": "se",
  "Noruega": "no", "Polônia": "pl", "República Tcheca": "cz", "Áustria": "at",
  "Hungria": "hu", "Romênia": "ro", "Sérvia": "rs", "Ucrânia": "ua",
  "Escócia": "gb-sct", "País de Gales": "gb-wls", "Turquia": "tr",
  "Grécia": "gr", "Eslováquia": "sk", "Eslovênia": "si", "Albânia": "al",
  "Geórgia": "ge", "Islândia": "is", "Macedônia do Norte": "mk",
  "Bósnia e Herzegovina": "ba", "Montenegro": "me", "Bulgária": "bg",
  "África do Sul": "za", "Marrocos": "ma", "Egito": "eg", "Nigéria": "ng",
  "Senegal": "sn", "Camarões": "cm", "Gana": "gh", "Costa do Marfim": "ci",
  "Argélia": "dz", "Tunísia": "tn", "Congo": "cd", "Cabo Verde": "cv",
  "Guiné": "gn", "Mali": "ml",
  "Japão": "jp", "Coreia do Sul": "kr", "Austrália": "au",
  "Arábia Saudita": "sa", "Irã": "ir", "Catar": "qa", "China": "cn",
  "Iraque": "iq", "Jordânia": "jo", "Emirados Árabes": "ae",
  "Indonésia": "id", "Uzbequistão": "uz", "Nova Zelândia": "nz",
  "Curaçao": "cw",
};

function getFlagUrl(teamName: string): string | null {
  const code = FLAG_CODE[teamName];
  if (!code) return null;
  return `https://flagcdn.com/w80/${code}.png`;
}

function getLocalTime(date: string | undefined, time: string): string {
  if (!date) return time;
  try {
    const dt = parseMatchDateTime(date, time);
    return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return time;
  }
}

interface FlagImgProps {
  teamName: string;
  className?: string;
}
const FlagImg = ({ teamName, className }: FlagImgProps) => {
  const src = getFlagUrl(teamName);
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      className={className}
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );
};

interface MatchCardProps {
  id: number;
  teamA: string;
  teamB: string;
  flagA: string;
  flagB: string;
  time: string;
  group: string;
  city: string;
  matchNumber: number;
  date?: string;
  stage?: string;
}

const MatchCard = ({ id, teamA, teamB, time, group, matchNumber, stage, date }: MatchCardProps) => {
  const multiplier = getPhaseMultiplier(stage ?? "Group Stage");
  const localTime = getLocalTime(date, time);
  const { user } = useAuth();
  const { isActive } = useSubscription();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [predictionLoaded, setPredictionLoaded] = useState(false);
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
  const [hasSavedPrediction, setHasSavedPrediction] = useState(false);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  const loadExistingPrediction = async () => {
    if (!user || predictionLoaded) return;
    setPredictionLoaded(true);
    setLoadingPrediction(true);
    const { data } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", user.id)
      .eq("match_id", id)
      .maybeSingle();
    if (data) {
      if (data.home_score !== null) setScoreA(data.home_score);
      if (data.away_score !== null) setScoreB(data.away_score);
      if (data.winner_pick) setWinner(data.winner_pick as "A" | "X" | "B");
      if (data.goal_first_half !== null) setGoalFirstHalf(data.goal_first_half);
      if (data.goal_second_half !== null) setGoalSecondHalf(data.goal_second_half);
      if (data.has_red_card !== null) setRedCard(data.has_red_card);
      if (data.has_penalty !== null) setPenalty(data.has_penalty);
      if (data.first_to_score) setFirstGoal(data.first_to_score as "A" | "N" | "B");
      if (data.possession_winner) setPossession(data.possession_winner as "A" | "B");
      setHasSavedPrediction(true);
    }
    setLoadingPrediction(false);
  };

  const handleToggleExpand = () => {
    if (!expanded) loadExistingPrediction();
    setExpanded(!expanded);
  };

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

  const handleSave = async () => {
    if (!user) {
      toast.error("Faça login para salvar palpites.");
      navigate("/auth");
      return;
    }
    if (!isActive) {
      toast.error("Assine o plano para participar da Copa!", {
        action: { label: "Ver Planos", onClick: () => navigate("/planos") },
      });
      return;
    }

    // Verifica horário do servidor (anti-fraude: ignora relógio local)
    if (date) {
      const { data: serverTime, error: timeErr } = await supabase.rpc("get_server_time");
      if (!timeErr && serverTime) {
        const gameStart = parseMatchDateTime(date, time);
        if (new Date(serverTime as string) >= gameStart) {
          toast.error("Prazo encerrado! Este jogo já começou.");
          return;
        }
      }
    }

    const { error } = await supabase.from("predictions").upsert(
      {
        user_id: user.id,
        match_id: id,
        home_score: scoreA === "" ? null : (scoreA as number),
        away_score: scoreB === "" ? null : (scoreB as number),
        winner_pick: winner,
        goal_first_half: goalFirstHalf,
        goal_second_half: goalSecondHalf,
        has_red_card: redCard,
        has_penalty: penalty,
        first_to_score: firstGoal,
        possession_winner: possession,
        points_earned: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,match_id" }
    );

    if (error) {
      toast.error("Erro ao salvar palpite.");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={`card-match rounded-xl overflow-hidden transition-all duration-300 ${expanded ? "ring-1 ring-primary/30" : ""}`}>
      <button
        onClick={handleToggleExpand}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2 flex-1">
            <FlagImg teamName={teamA} className="h-6 rounded shadow-sm" />
            <span className="font-bold text-sm text-foreground">{teamA}</span>
          </div>
          <div className="flex flex-col items-center px-3">
            <span className="text-xs text-muted-foreground font-medium uppercase">{group}</span>
            <span className="text-xs font-bold text-primary">VS</span>
            <span className="text-xs text-muted-foreground">{localTime}</span>
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className="font-bold text-sm text-foreground">{teamB}</span>
            <FlagImg teamName={teamB} className="h-6 rounded shadow-sm" />
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3">
          {hasSavedPrediction && filledCount === 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary/20 text-secondary">
              ✓
            </span>
          )}
          {filledCount > 0 && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              filledCount === 8 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {filledCount}/8
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-slide-up">
          <div className="h-px bg-border" />
          {loadingPrediction && (
            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground text-xs">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando seu palpite...
            </div>
          )}
          <div className={loadingPrediction ? "hidden" : ""}>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
              Placar Exato <span className="text-primary">(25 pts)</span>
            </label>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <FlagImg teamName={teamA} className="h-5 rounded shadow-sm" />
                <input type="number" min={0} max={20} value={scoreA} onChange={(e) => setScoreA(e.target.value === "" ? "" : parseInt(e.target.value))} className="w-14 h-12 rounded-lg bg-muted text-center text-xl font-black text-foreground border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="0" />
              </div>
              <span className="text-muted-foreground font-bold text-lg">×</span>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={20} value={scoreB} onChange={(e) => setScoreB(e.target.value === "" ? "" : parseInt(e.target.value))} className="w-14 h-12 rounded-lg bg-muted text-center text-xl font-black text-foreground border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="0" />
                <FlagImg teamName={teamB} className="h-5 rounded shadow-sm" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
              Vencedor / Empate <span className="text-primary">(10 pts)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([{ key: "A" as const, label: teamA }, { key: "X" as const, label: "Empate" }, { key: "B" as const, label: teamB }]).map(({ key, label }) => (
                <button key={key} onClick={() => setWinner(winner === key ? null : key)} className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${winner === key ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{label}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ToggleField label="Gol no 1º Tempo" points={5} value={goalFirstHalf} onChange={setGoalFirstHalf} />
            <ToggleField label="Gol no 2º Tempo" points={5} value={goalSecondHalf} onChange={setGoalSecondHalf} />
            <ToggleField label="Terá Expulsão?" points={7} value={redCard} onChange={setRedCard} />
            <ToggleField label="Terá Pênalti?" points={7} value={penalty} onChange={setPenalty} />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
              Quem marca 1º? <span className="text-primary">(8 pts)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([{ key: "A" as const, label: teamA }, { key: "N" as const, label: "Ninguém" }, { key: "B" as const, label: teamB }]).map(({ key, label }) => (
                <button key={key} onClick={() => setFirstGoal(firstGoal === key ? null : key)} className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${firstGoal === key ? "bg-secondary text-secondary-foreground shadow-lg" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
              Mais Posse de Bola <span className="text-primary">(5 pts)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([{ key: "A" as const, label: teamA }, { key: "B" as const, label: teamB }]).map(({ key, label }) => (
                <button key={key} onClick={() => setPossession(possession === key ? null : key)} className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${possession === key ? "bg-secondary text-secondary-foreground shadow-lg" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{label}</button>
              ))}
            </div>
          </div>

          </div>
          <button onClick={handleSave} className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${saved ? "bg-secondary text-secondary-foreground" : "btn-gold"}`}>
            {saved ? (<><Check className="w-4 h-4" /> Palpite Salvo!</>) : (<><Zap className="w-4 h-4" /> Salvar Palpite</>)}
          </button>

          {filledCount === 8 && (
            <div className="text-center text-xs text-primary font-semibold animate-pulse-gold p-2 rounded-lg bg-glass-gold">
              🏆 Todos os 8 palpites preenchidos — Potencial máximo: {82 * multiplier} pts
              {multiplier > 1 && <span className="ml-1 opacity-70">(×{multiplier})</span>}
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
    <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
      {label} <span className="text-primary">({points} pts)</span>
    </label>
    <div className="flex gap-2">
      <button onClick={() => onChange(value === true ? null : true)} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${value === true ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>Sim</button>
      <button onClick={() => onChange(value === false ? null : false)} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${value === false ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"}`}>Não</button>
    </div>
  </div>
);

export default MatchCard;
