import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, ChevronUp, Check, Zap, Loader2, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getPhaseMultiplier, parseMatchDateTime } from "@/data/matches";
import { MAX_BASE_POINTS } from "@/lib/scoring";

// ── Flag helpers ──────────────────────────────────────────────────────────────

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
  "Indonésia": "id", "Uzbequistão": "uz", "Nova Zelândia": "nz", "Curaçao": "cw",
};

function getFlagUrl(name: string): string | null {
  const c = FLAG_CODE[name];
  return c ? `https://flagcdn.com/w80/${c}.png` : null;
}

function getLocalTime(date: string | undefined, time: string): string {
  if (!date) return time;
  try {
    return parseMatchDateTime(date, time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return time; }
}

// ── UTC-safe timestamp parser ─────────────────────────────────────────────────
// Supabase timestamptz returns ISO strings like "2026-06-14T22:00:00+00:00".
// If the string has no timezone suffix (naive), force UTC interpretation with 'Z'.
function parseStartMs(iso: string): number {
  const hasZone = /[Zz]$|[+-]\d{2}:\d{2}$/.test(iso);
  return hasZone ? new Date(iso).getTime() : new Date(iso + "Z").getTime();
}

// ── 4-state match status ──────────────────────────────────────────────────────

type MatchStatus = "open" | "locked" | "live" | "scored";

function computeStatus(
  startsAt: string | null | undefined,
  date: string | undefined,
  time: string,
  scored: boolean | undefined,
): MatchStatus {
  if (scored) return "scored";

  // Resolve start time in UTC milliseconds
  let startMs: number | null = null;
  if (startsAt) {
    startMs = parseStartMs(startsAt);
  } else if (date) {
    try { startMs = parseMatchDateTime(date, time).getTime(); } catch { /* skip */ }
  }

  if (startMs === null) return "open";

  const now = Date.now();
  if (now >= startMs)                           return "live";
  if (now >= startMs - 30 * 60 * 1000)         return "locked";
  return "open";
}

// ── Per-state visual config ───────────────────────────────────────────────────

interface StatusStyle {
  badge: JSX.Element;
  cardRing: string;
  cardBg: string;
}

const LIVE_BADGE = (
  <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
    </span>
    Ao Vivo
  </span>
);

function getStatusStyle(status: MatchStatus): StatusStyle {
  switch (status) {
    case "open":
      return {
        badge: <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">Aberto</span>,
        cardRing: "border-l-[3px] border-l-green-500/50",
        cardBg:   "",
      };
    case "locked":
      return {
        badge: <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">Encerrado</span>,
        cardRing: "border-l-[3px] border-l-amber-500/60",
        cardBg:   "bg-amber-500/[0.02]",
      };
    case "live":
      return {
        badge: LIVE_BADGE,
        cardRing: "border-l-[3px] border-l-red-500",
        cardBg:   "bg-red-500/[0.03]",
      };
    case "scored":
      return {
        badge: <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">Pontuado</span>,
        cardRing: "border-l-[3px] border-l-muted-foreground/20",
        cardBg:   "",
      };
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

const FlagImg = ({ teamName, className }: { teamName: string; className?: string }) => {
  const src = getFlagUrl(teamName);
  if (!src) return null;
  return <img src={src} alt="" className={className} onError={e => { e.currentTarget.style.display = "none"; }} />;
};

interface ToggleFieldProps {
  label: string;
  pointsSim: number;
  pointsNao: number;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  disabled?: boolean;
  /** When provided (scored state), shows which answer is correct */
  resultValue?: boolean | null;
}

const ToggleField = ({ label, pointsSim, pointsNao, value, onChange, disabled, resultValue }: ToggleFieldProps) => {
  const isScored = resultValue !== undefined && resultValue !== null;
  const ptLabel  = pointsSim === pointsNao ? `${pointsSim} pts` : `Sim ${pointsSim} / Não ${pointsNao} pts`;
  const userCorrect = isScored && value === resultValue;

  const simIsCorrect   = isScored && resultValue === true;
  const naoIsCorrect   = isScored && resultValue === false;
  const userPickedSim  = value === true;
  const userPickedNao  = value === false;

  function simClass(): string {
    if (isScored) {
      if (simIsCorrect)                            return "bg-green-500/20 text-green-400 border border-green-500/30";
      if (userPickedSim && !simIsCorrect)           return "bg-red-500/20 text-red-400/70 border border-red-500/20";
      return "bg-muted/40 text-muted-foreground/40";
    }
    return value === true ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground disabled:opacity-40";
  }
  function naoClass(): string {
    if (isScored) {
      if (naoIsCorrect)                            return "bg-green-500/20 text-green-400 border border-green-500/30";
      if (userPickedNao && !naoIsCorrect)           return "bg-red-500/20 text-red-400/70 border border-red-500/20";
      return "bg-muted/40 text-muted-foreground/40";
    }
    return value === false ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground disabled:opacity-40";
  }

  return (
    <div className={`rounded-lg p-3 transition-colors ${userCorrect ? "bg-green-500/10 border border-green-500/20" : "bg-muted/50"}`}>
      <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center justify-between">
        <span>{label} <span className="text-primary">({ptLabel})</span></span>
        {userCorrect && <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />}
      </label>
      <div className="flex gap-2">
        <button
          onClick={() => !disabled && onChange(value === true ? null : true)}
          disabled={disabled}
          className={`flex-1 py-2 rounded-md text-xs font-bold transition-all disabled:cursor-not-allowed ${simClass()}`}
        >Sim</button>
        <button
          onClick={() => !disabled && onChange(value === false ? null : false)}
          disabled={disabled}
          className={`flex-1 py-2 rounded-md text-xs font-bold transition-all disabled:cursor-not-allowed ${naoClass()}`}
        >Não</button>
      </div>
    </div>
  );
};

// ── Props ─────────────────────────────────────────────────────────────────────

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
  hasPaid?: boolean;
  scored?: boolean;
  startsAt?: string | null;
  hasSavedPrediction?: boolean;
  // Result fields (populated after scoring)
  resultHome?: number | null;
  resultAway?: number | null;
  resultWinner?: string | null;
  resultGoalFirstHalf?: boolean | null;
  resultGoalSecondHalf?: boolean | null;
  resultRedCard?: boolean | null;
  resultPenalty?: boolean | null;
  resultFirstToScore?: string | null;
  resultPossession?: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

const MatchCard = ({
  id, teamA, teamB, time, group, stage, date,
  hasPaid = false, scored, startsAt,
  hasSavedPrediction: externalHasSaved = false,
  resultHome = null, resultAway = null, resultWinner = null,
  resultGoalFirstHalf = null, resultGoalSecondHalf = null,
  resultRedCard = null, resultPenalty = null,
  resultFirstToScore = null, resultPossession = null,
}: MatchCardProps) => {
  const multiplier   = getPhaseMultiplier(stage ?? "Group Stage");
  const localTime    = getLocalTime(date, time);
  const { user }     = useAuth();
  const { isActive } = useSubscription();
  const { settings } = useSiteSettings();
  const paywallActive = settings.feature_flags?.paywall_active ?? true;
  const navigate     = useNavigate();

  // ── State ───────────────────────────────────────────────────────────────────
  const [expanded,           setExpanded]           = useState(false);
  const [predictionLoaded,   setPredictionLoaded]   = useState(false);
  const [loadingPrediction,  setLoadingPrediction]  = useState(false);
  const [scoreA,             setScoreA]             = useState<number | "">("");
  const [scoreB,             setScoreB]             = useState<number | "">("");
  const [winner,             setWinner]             = useState<"A" | "X" | "B" | null>(null);
  const [goalFirstHalf,      setGoalFirstHalf]      = useState<boolean | null>(null);
  const [goalSecondHalf,     setGoalSecondHalf]     = useState<boolean | null>(null);
  const [redCard,            setRedCard]            = useState<boolean | null>(null);
  const [penalty,            setPenalty]            = useState<boolean | null>(null);
  const [firstGoal,          setFirstGoal]          = useState<"A" | "N" | "B" | null>(null);
  const [possession,         setPossession]         = useState<"A" | "B" | null>(null);
  const [hasSavedPrediction, setHasSavedPrediction] = useState(externalHasSaved);
  const [saved,              setSaved]              = useState(false);
  const [pointsEarned,       setPointsEarned]       = useState<number | null>(null);

  // ── Reactive status (recalculated every 30s) ────────────────────────────────
  const [matchStatus, setMatchStatus] = useState<MatchStatus>(() =>
    computeStatus(startsAt, date, time, scored)
  );

  useEffect(() => {
    const update = () => setMatchStatus(computeStatus(startsAt, date, time, scored));
    update();
    const t = setInterval(update, 30_000);
    return () => clearInterval(t);
  }, [startsAt, date, time, scored]);

  const isLocked = matchStatus !== "open";
  const statusStyle = getStatusStyle(matchStatus);
  const localKey = user ? `prediction:${user.id}:${id}` : null;

  // Sync external hasSaved signal (from Matches bulk fetch)
  useEffect(() => {
    if (externalHasSaved) setHasSavedPrediction(true);
  }, [externalHasSaved]);

  // ── Hydration 1: localStorage (síncrono, sem flicker) ───────────────────────
  useEffect(() => {
    if (!localKey) return;
    try {
      const raw = localStorage.getItem(localKey);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.home_score       != null) setScoreA(d.home_score);
      if (d.away_score       != null) setScoreB(d.away_score);
      if (d.winner_pick)              setWinner(d.winner_pick);
      if (d.goal_first_half  != null) setGoalFirstHalf(d.goal_first_half);
      if (d.goal_second_half != null) setGoalSecondHalf(d.goal_second_half);
      if (d.has_red_card     != null) setRedCard(d.has_red_card);
      if (d.has_penalty      != null) setPenalty(d.has_penalty);
      if (d.first_to_score)           setFirstGoal(d.first_to_score);
      if (d.possession_winner)        setPossession(d.possession_winner);
      setHasSavedPrediction(true);
    } catch { /* corrompido — ignorar */ }
  }, [localKey]);

  // ── Hydration 2: Supabase (automático ao montar, servidor manda) ─────────────
  const fetchFromServer = useCallback(async () => {
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
      setScoreA(data.home_score       != null ? data.home_score       : "");
      setScoreB(data.away_score       != null ? data.away_score       : "");
      setWinner((data.winner_pick     as "A" | "X" | "B") ?? null);
      setGoalFirstHalf( (data.goal_first_half  as boolean) ?? null);
      setGoalSecondHalf((data.goal_second_half as boolean) ?? null);
      setRedCard(       (data.has_red_card     as boolean) ?? null);
      setPenalty(       (data.has_penalty      as boolean) ?? null);
      setFirstGoal( (data.first_to_score    as "A" | "N" | "B") ?? null);
      setPossession((data.possession_winner as "A" | "B")      ?? null);
      if (data.points_earned != null) setPointsEarned(data.points_earned as number);
      setHasSavedPrediction(true);
      if (localKey) {
        try {
          localStorage.setItem(localKey, JSON.stringify({
            home_score: data.home_score, away_score: data.away_score,
            winner_pick: data.winner_pick, goal_first_half: data.goal_first_half,
            goal_second_half: data.goal_second_half, has_red_card: data.has_red_card,
            has_penalty: data.has_penalty, first_to_score: data.first_to_score,
            possession_winner: data.possession_winner,
          }));
        } catch { /* ignorar */ }
      }
    }
    setLoadingPrediction(false);
  }, [user, id, predictionLoaded, localKey]);

  useEffect(() => {
    if (user) fetchFromServer();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleExpand = () => {
    if (!expanded && !predictionLoaded) fetchFromServer();
    setExpanded(e => !e);
  };

  // ── Field-level correctness (computed when scored) ──────────────────────────
  const fieldChecks = useMemo(() => {
    if (!scored || resultHome == null || resultAway == null) return null;
    return {
      scoreHome:    scoreA !== "" && (scoreA as number) === resultHome,
      scoreAway:    scoreB !== "" && (scoreB as number) === resultAway,
      winner:       winner !== null && winner === resultWinner,
      firstGoal:    firstGoal !== null && firstGoal === resultFirstToScore,
      possession:   possession !== null && possession === resultPossession,
    };
  }, [scored, resultHome, resultAway, resultWinner, resultFirstToScore, resultPossession,
      scoreA, scoreB, winner, firstGoal, possession]);

  // ── Filled-fields counter ────────────────────────────────────────────────────
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

  // ── Botão label / class ──────────────────────────────────────────────────────
  const buttonLabel = () => {
    if (isLocked)           return <><Lock className="w-4 h-4" /> Apostas Encerradas</>;
    if (saved)              return <><Check className="w-4 h-4" /> Palpite Salvo!</>;
    if (hasSavedPrediction) return <><Zap className="w-4 h-4" /> Alterar Palpite</>;
    return                         <><Zap className="w-4 h-4" /> Salvar Palpite</>;
  };

  const buttonClass = () => {
    if (isLocked) return "bg-muted text-muted-foreground cursor-not-allowed opacity-60";
    if (saved)    return "bg-secondary text-secondary-foreground";
    return "btn-gold";
  };

  // ── Salvar ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (isLocked) return;
    if (!user) { toast.error("Faça login para salvar palpites."); navigate("/auth"); return; }
    if (paywallActive && !isActive && !hasPaid) {
      toast.error("Assine o plano para participar da Copa!", {
        action: { label: "Ver Planos", onClick: () => navigate("/planos") },
      });
      return;
    }

    // Anti-fraude: valida horário no servidor contra deadline de 30 min (UTC)
    const deadlineMs = startsAt
      ? parseStartMs(startsAt) - 30 * 60 * 1000
      : date
        ? parseMatchDateTime(date, time).getTime() - 30 * 60 * 1000
        : null;

    if (deadlineMs !== null) {
      const { data: serverTime, error: timeErr } = await supabase.rpc("get_server_time");
      if (!timeErr && serverTime) {
        if (new Date(serverTime as string).getTime() >= deadlineMs) {
          toast.error("Apostas encerradas! Faltam menos de 30 minutos para o jogo.");
          setMatchStatus("locked");
          return;
        }
      }
    }

    const { error } = await supabase.from("predictions").upsert({
      user_id: user.id, match_id: id,
      home_score:        scoreA === "" ? null : (scoreA as number),
      away_score:        scoreB === "" ? null : (scoreB as number),
      winner_pick:       winner,
      goal_first_half:   goalFirstHalf,
      goal_second_half:  goalSecondHalf,
      has_red_card:      redCard,
      has_penalty:       penalty,
      first_to_score:    firstGoal,
      possession_winner: possession,
      points_earned:     0,
      updated_at:        new Date().toISOString(),
    }, { onConflict: "user_id,match_id" });

    if (error) { toast.error("Erro ao salvar palpite."); return; }

    if (localKey) {
      try {
        localStorage.setItem(localKey, JSON.stringify({
          home_score: scoreA === "" ? null : scoreA, away_score: scoreB === "" ? null : scoreB,
          winner_pick: winner, goal_first_half: goalFirstHalf, goal_second_half: goalSecondHalf,
          has_red_card: redCard, has_penalty: penalty, first_to_score: firstGoal,
          possession_winner: possession,
        }));
      } catch { /* ignorar */ }
    }

    setHasSavedPrediction(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // ── Helpers de estilo condicional para campos de placar ───────────────────────
  function scoreInputClass(side: "home" | "away"): string {
    const isCorrect = side === "home" ? fieldChecks?.scoreHome : fieldChecks?.scoreAway;
    const val       = side === "home" ? scoreA : scoreB;
    const base      = "w-14 h-12 rounded-lg bg-muted text-center text-xl font-black text-foreground outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed";
    if (scored && val !== "") {
      if (isCorrect) return `${base} border-2 border-green-500 text-green-400`;
      return `${base} border border-red-500/40 text-muted-foreground`;
    }
    return `${base} border border-border focus:border-primary focus:ring-1 focus:ring-primary`;
  }

  function choiceButtonClass(selected: boolean, correct: boolean | null): string {
    const base = "py-2.5 px-3 rounded-lg text-xs font-bold transition-all disabled:cursor-not-allowed";
    if (scored && correct !== null) {
      if (correct)   return `${base} bg-green-500/20 text-green-400 border border-green-500/30`;
      if (selected)  return `${base} bg-red-500/15 text-red-400/70 border border-red-500/20`;
      return `${base} bg-muted/40 text-muted-foreground/40`;
    }
    if (selected) return `${base} bg-primary text-primary-foreground shadow-lg`;
    return `${base} bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40`;
  }

  function altChoiceClass(selected: boolean, correct: boolean | null): string {
    const base = "py-2.5 px-3 rounded-lg text-xs font-bold transition-all disabled:cursor-not-allowed";
    if (scored && correct !== null) {
      if (correct)   return `${base} bg-green-500/20 text-green-400 border border-green-500/30`;
      if (selected)  return `${base} bg-red-500/15 text-red-400/70 border border-red-500/20`;
      return `${base} bg-muted/40 text-muted-foreground/40`;
    }
    if (selected) return `${base} bg-secondary text-secondary-foreground shadow-lg`;
    return `${base} bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40`;
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={`card-match rounded-xl overflow-hidden transition-all duration-300 ${statusStyle.cardBg} ${statusStyle.cardRing} ${expanded ? "ring-1 ring-primary/20" : ""}`}>

      {/* ── Header ── */}
      <button onClick={handleToggleExpand} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FlagImg teamName={teamA} className="h-6 rounded shadow-sm shrink-0" />
            <span className="font-bold text-sm text-foreground truncate">{teamA}</span>
          </div>
          <div className="flex flex-col items-center px-2 shrink-0">
            <span className="text-xs text-muted-foreground font-medium uppercase">{group}</span>
            {/* Show result score when scored, else VS */}
            {scored && resultHome != null && resultAway != null ? (
              <span className="text-sm font-black text-foreground tabular-nums">
                {resultHome}<span className="text-muted-foreground mx-0.5">–</span>{resultAway}
              </span>
            ) : (
              <span className="text-xs font-bold text-primary">VS</span>
            )}
            <span className="text-xs text-muted-foreground">{localTime}</span>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <span className="font-bold text-sm text-foreground truncate text-right">{teamB}</span>
            <FlagImg teamName={teamB} className="h-6 rounded shadow-sm shrink-0" />
          </div>
        </div>

        {/* Right-side badges */}
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {/* Status badge */}
          {statusStyle.badge}

          {/* Points badge (scored + prediction loaded) */}
          {scored && hasSavedPrediction && pointsEarned != null && (
            <span className="flex items-center justify-center min-w-[2rem] h-6 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black tabular-nums">
              {pointsEarned}pts
            </span>
          )}

          {/* Prediction check */}
          {hasSavedPrediction && matchStatus === "open" && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">✓</span>
          )}

          {/* Filled count (open only) */}
          {filledCount > 0 && matchStatus === "open" && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              filledCount === 8 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>{filledCount}/8</span>
          )}

          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* ── Body ── */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-slide-up">
          <div className="h-px bg-border" />

          {/* Resultado oficial + pontuação detalhada */}
          {scored && resultHome != null && resultAway != null && (
            <div className="bg-muted/40 rounded-xl p-4 space-y-3 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold text-center">
                Resultado Oficial
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                  <FlagImg teamName={teamA} className="h-5 rounded shadow-sm" />
                  <span className="text-sm font-bold text-foreground">{teamA}</span>
                </div>
                <span className="text-3xl font-black text-foreground tabular-nums">
                  {resultHome}<span className="text-muted-foreground text-xl mx-1">×</span>{resultAway}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{teamB}</span>
                  <FlagImg teamName={teamB} className="h-5 rounded shadow-sm" />
                </div>
              </div>

              {hasSavedPrediction && (
                <div className="flex flex-col items-center gap-1 pt-2 border-t border-border">
                  {pointsEarned != null ? (
                    <>
                      <span className="text-3xl font-black text-primary tabular-nums leading-tight">
                        {pointsEarned}<span className="text-base font-semibold ml-1">pts</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fieldChecks?.scoreHome && fieldChecks?.scoreAway
                          ? "Placar exato!"
                          : fieldChecks?.winner
                            ? "Acertou o vencedor/empate"
                            : "Resultado não acertado"}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" /> Carregando pontos...
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Banner de travado/ao vivo */}
          {(matchStatus === "locked" || matchStatus === "live") && (
            <div className={`flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-semibold ${
              matchStatus === "live"
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}>
              {matchStatus === "live"
                ? <><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"/></span> Jogo em andamento</>
                : <><Lock className="w-4 h-4" /> Apostas encerradas — jogo começa em breve</>
              }
            </div>
          )}
          {matchStatus === "scored" && (
            <div className="flex items-center justify-center gap-2 py-3 rounded-lg bg-muted/60 text-muted-foreground text-xs font-semibold">
              <Lock className="w-4 h-4" /> Partida encerrada
            </div>
          )}

          {loadingPrediction && (
            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground text-xs">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando seu palpite...
            </div>
          )}

          <div className={loadingPrediction ? "hidden" : "space-y-4"}>

            {/* Placar */}
            <div>
              <label className={`text-xs uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5 ${
                fieldChecks?.scoreHome && fieldChecks?.scoreAway ? "text-green-400" : "text-muted-foreground"
              }`}>
                Placar Exato <span className="text-primary">(25 pts)</span>
                {fieldChecks?.scoreHome && fieldChecks?.scoreAway && <Check className="w-3.5 h-3.5" />}
              </label>
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                  <FlagImg teamName={teamA} className="h-5 rounded shadow-sm" />
                  <input
                    type="number" min={0} max={20} placeholder="0"
                    value={scoreA} disabled={isLocked}
                    onChange={e => setScoreA(e.target.value === "" ? "" : parseInt(e.target.value))}
                    className={scoreInputClass("home")}
                  />
                </div>
                <span className="text-muted-foreground font-bold text-lg">×</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={0} max={20} placeholder="0"
                    value={scoreB} disabled={isLocked}
                    onChange={e => setScoreB(e.target.value === "" ? "" : parseInt(e.target.value))}
                    className={scoreInputClass("away")}
                  />
                  <FlagImg teamName={teamB} className="h-5 rounded shadow-sm" />
                </div>
              </div>
            </div>

            {/* Vencedor */}
            <div>
              <label className={`text-xs uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5 ${
                fieldChecks?.winner ? "text-green-400" : "text-muted-foreground"
              }`}>
                Vencedor / Empate <span className="text-primary">(10 pts)</span>
                {fieldChecks?.winner && <Check className="w-3.5 h-3.5" />}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: "A" as const, label: teamA },
                  { key: "X" as const, label: "Empate" },
                  { key: "B" as const, label: teamB },
                ]).map(({ key, label }) => {
                  const isSelected = winner === key;
                  const isCorrect  = scored && resultWinner != null ? key === resultWinner : null;
                  return (
                    <button
                      key={key} disabled={isLocked}
                      onClick={() => !isLocked && setWinner(winner === key ? null : key)}
                      className={choiceButtonClass(isSelected, isCorrect)}
                    >{label}</button>
                  );
                })}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <ToggleField
                label="Gol no 1º Tempo"  pointsSim={5}  pointsNao={5}
                value={goalFirstHalf}  onChange={setGoalFirstHalf}  disabled={isLocked}
                resultValue={scored ? resultGoalFirstHalf : undefined}
              />
              <ToggleField
                label="Gol no 2º Tempo"  pointsSim={5}  pointsNao={5}
                value={goalSecondHalf} onChange={setGoalSecondHalf} disabled={isLocked}
                resultValue={scored ? resultGoalSecondHalf : undefined}
              />
              <ToggleField
                label="Terá Expulsão?"   pointsSim={12} pointsNao={5}
                value={redCard}        onChange={setRedCard}        disabled={isLocked}
                resultValue={scored ? resultRedCard : undefined}
              />
              <ToggleField
                label="Terá Pênalti?"    pointsSim={12} pointsNao={12}
                value={penalty}        onChange={setPenalty}        disabled={isLocked}
                resultValue={scored ? resultPenalty : undefined}
              />
            </div>

            {/* 1º a marcar */}
            <div>
              <label className={`text-xs uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5 ${
                fieldChecks?.firstGoal ? "text-green-400" : "text-muted-foreground"
              }`}>
                Quem marca 1º? <span className="text-primary">(8 pts)</span>
                {fieldChecks?.firstGoal && <Check className="w-3.5 h-3.5" />}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: "A" as const, label: teamA },
                  { key: "N" as const, label: "Ninguém" },
                  { key: "B" as const, label: teamB },
                ]).map(({ key, label }) => {
                  const isSelected = firstGoal === key;
                  const isCorrect  = scored && resultFirstToScore != null ? key === resultFirstToScore : null;
                  return (
                    <button
                      key={key} disabled={isLocked}
                      onClick={() => !isLocked && setFirstGoal(firstGoal === key ? null : key)}
                      className={altChoiceClass(isSelected, isCorrect)}
                    >{label}</button>
                  );
                })}
              </div>
            </div>

            {/* Posse */}
            <div>
              <label className={`text-xs uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5 ${
                fieldChecks?.possession ? "text-green-400" : "text-muted-foreground"
              }`}>
                Mais Posse de Bola <span className="text-primary">(5 pts)</span>
                {fieldChecks?.possession && <Check className="w-3.5 h-3.5" />}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([{ key: "A" as const, label: teamA }, { key: "B" as const, label: teamB }]).map(({ key, label }) => {
                  const isSelected = possession === key;
                  const isCorrect  = scored && resultPossession != null ? key === resultPossession : null;
                  return (
                    <button
                      key={key} disabled={isLocked}
                      onClick={() => !isLocked && setPossession(possession === key ? null : key)}
                      className={altChoiceClass(isSelected, isCorrect)}
                    >{label}</button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Botão salvar */}
          <button
            onClick={handleSave}
            disabled={isLocked}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${buttonClass()}`}
          >
            {buttonLabel()}
          </button>

          {/* Potencial máximo */}
          {filledCount === 8 && matchStatus === "open" && (
            <div className="text-center text-xs text-primary font-semibold animate-pulse-gold p-2 rounded-lg bg-glass-gold">
              🏆 Palpite completo — Potencial: até {MAX_BASE_POINTS * multiplier} pts
              {multiplier > 1 && <span className="ml-1 opacity-70">(×{multiplier} fase)</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchCard;
