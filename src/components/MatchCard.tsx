import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { Check, Zap, Loader2, Lock, ChevronDown, ChevronUp, Clock, Star, ScanSearch, Footprints, Square, Timer, Swords } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getPhaseMultiplier, parseMatchDateTime } from "@/data/matches";
import { MAX_BASE_POINTS } from "@/lib/scoring";
import { cn } from "@/lib/utils";

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

function parseStartMs(iso: string): number {
  const hasZone = /[Zz]$|[+-]\d{2}:\d{2}$/.test(iso);
  return hasZone ? new Date(iso).getTime() : new Date(iso + "Z").getTime();
}

// ── Status types ──────────────────────────────────────────────────────────────

type MatchStatus = "open" | "locked" | "live" | "scored";

function computeStatus(
  startsAt: string | null | undefined,
  date: string | undefined,
  time: string,
  scored: boolean | undefined,
): MatchStatus {
  if (scored) return "scored";
  let startMs: number | null = null;
  if (startsAt) {
    startMs = parseStartMs(startsAt);
  } else if (date) {
    try { startMs = parseMatchDateTime(date, time).getTime(); } catch { /* skip */ }
  }
  if (startMs === null) return "open";
  const now = Date.now();
  if (now >= startMs) return "live";
  if (now >= startMs - 30 * 60 * 1000) return "locked";
  return "open";
}

// ── Sub-components ────────────────────────────────────────────────────────────

const FlagImg = ({ teamName, className }: { teamName: string; className?: string }) => {
  const src = getFlagUrl(teamName);
  if (!src) return null;
  return <img src={src} alt="" className={className} onError={e => { e.currentTarget.style.display = "none"; }} />;
};

// ── Countdown timer (memoized — ticks never re-render the parent card) ────────

interface MatchCountdownProps {
  deadlineMs: number;
}

const MatchCountdown = memo(({ deadlineMs }: MatchCountdownProps) => {
  const [remaining, setRemaining] = useState(() => deadlineMs - Date.now());

  useEffect(() => {
    const tick = () => setRemaining(deadlineMs - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineMs]);

  if (remaining <= 0) return null;

  const totalSecs  = Math.floor(remaining / 1000);
  const days  = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins  = Math.floor((totalSecs % 3600) / 60);
  const secs  = totalSecs % 60;
  const pad   = (n: number) => String(n).padStart(2, "0");

  const isRelaxed   = remaining > 24 * 3600_000;
  const isAttention = remaining > 3600_000 && remaining <= 24 * 3600_000;
  const isCrisis    = remaining <= 3600_000;

  const display = isRelaxed
    ? `${days}d ${pad(hours)}h`
    : `${pad(hours)}:${pad(mins)}:${pad(secs)}`;

  return (
    <div className={cn(
      "flex items-center justify-center gap-1.5 py-1 text-[11px] font-semibold transition-colors",
      isRelaxed   && "text-muted-foreground/70",
      isAttention && "bg-amber-500/[0.06] text-amber-400",
      isCrisis    && "bg-red-500/[0.08] text-red-500 animate-pulse",
    )}>
      <Clock className={cn("w-3 h-3 shrink-0", isCrisis && "w-3.5 h-3.5")} />
      <span className={cn("tabular-nums", isCrisis && "font-black tracking-wide")}>
        {isCrisis ? "FECHA EM " : "Fecha em "}{display}
      </span>
    </div>
  );
});
MatchCountdown.displayName = "MatchCountdown";

// Score +/- control with hold-to-auto-increment
interface ScoreControlProps {
  value: number | "";
  onChange: (v: number | "") => void;
  disabled?: boolean;
  isCorrect?: boolean | null;
  isScored?: boolean;
}

const ScoreControl = ({ value, onChange, disabled, isCorrect, isScored }: ScoreControlProps) => {
  const holdTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const numVal = value === "" ? 0 : (value as number);

  const increment = useCallback(() => onChange(Math.min(20, numVal + 1)), [numVal, onChange]);
  const decrement = useCallback(() => onChange(Math.max(0, numVal - 1)), [numVal, onChange]);

  const startHold = (fn: () => void) => {
    if (disabled) return;
    fn();
    holdTimer.current = setTimeout(() => {
      holdInterval.current = setInterval(fn, 150);
    }, 450);
  };
  const stopHold = () => {
    if (holdTimer.current)    clearTimeout(holdTimer.current);
    if (holdInterval.current) clearInterval(holdInterval.current);
  };

  useEffect(() => () => stopHold(), []);

  const isEmpty = value === "";

  const btnClass = cn(
    "w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xl",
    "bg-muted text-muted-foreground transition-all active:scale-95 select-none",
    disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-muted/70 hover:text-foreground",
  );

  const inputClass = cn(
    "w-12 h-12 text-center font-mono text-2xl font-black tabular-nums rounded-xl border-2",
    "bg-background focus:ring-0 focus:outline-none transition-all",
    "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
    isEmpty
      ? "border-border/50 text-muted-foreground/40"
      : isScored
        ? isCorrect
          ? "border-green-500/40 text-green-400"
          : "border-border/30 text-muted-foreground/50"
        : "border-primary/40 text-foreground focus:border-primary",
    disabled ? "opacity-40 cursor-not-allowed" : "",
  );

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onPointerDown={() => startHold(decrement)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        disabled={disabled}
        aria-label="Diminuir"
        className={btnClass}
      >−</button>
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        min={0}
        max={99}
        value={isEmpty ? "" : String(value)}
        onChange={e => {
          if (disabled) return;
          const v = e.target.value;
          if (v === "") { onChange(""); return; }
          const n = parseInt(v, 10);
          if (!isNaN(n) && n >= 0 && n <= 20) onChange(n);
        }}
        onFocus={e => e.target.select()}
        disabled={disabled}
        placeholder="—"
        aria-label="Placar"
        className={inputClass}
      />
      <button
        type="button"
        onPointerDown={() => startHold(increment)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        disabled={disabled}
        aria-label="Aumentar"
        className={btnClass}
      >+</button>
    </div>
  );
};

interface ToggleFieldProps {
  label: string;
  pointsSim: number;
  pointsNao: number;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  disabled?: boolean;
  resultValue?: boolean | null;
}

const ToggleField = ({ label, pointsSim, pointsNao, value, onChange, disabled, resultValue }: ToggleFieldProps) => {
  const isScored     = resultValue !== undefined && resultValue !== null;
  const ptLabel      = pointsSim === pointsNao ? `${pointsSim} pts` : `Sim ${pointsSim} / Não ${pointsNao}`;
  const userCorrect  = isScored && value === resultValue;

  const simIsCorrect  = isScored && resultValue === true;
  const naoIsCorrect  = isScored && resultValue === false;
  const userPickedSim = value === true;
  const userPickedNao = value === false;

  function simClass(): string {
    if (isScored) {
      if (simIsCorrect)                  return "bg-green-500/20 text-green-400 border border-green-500/30";
      if (userPickedSim && !simIsCorrect) return "bg-red-500/20 text-red-400/70 border border-red-500/20";
      return "bg-muted/40 text-muted-foreground/40";
    }
    return value === true ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground disabled:opacity-40";
  }
  function naoClass(): string {
    if (isScored) {
      if (naoIsCorrect)                  return "bg-green-500/20 text-green-400 border border-green-500/30";
      if (userPickedNao && !naoIsCorrect) return "bg-red-500/20 text-red-400/70 border border-red-500/20";
      return "bg-muted/40 text-muted-foreground/40";
    }
    return value === false ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground disabled:opacity-40";
  }

  return (
    <div className={cn("rounded-xl p-3 transition-colors", userCorrect ? "bg-green-500/10 border border-green-500/20" : "bg-muted/50")}>
      <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center justify-between">
        <span>{label} <span className="text-primary">({ptLabel})</span></span>
        {userCorrect && <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />}
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={() => !disabled && onChange(value === true ? null : true)} disabled={disabled}
          className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:cursor-not-allowed", simClass())}>Sim</button>
        <button type="button" onClick={() => !disabled && onChange(value === false ? null : false)} disabled={disabled}
          className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:cursor-not-allowed", naoClass())}>Não</button>
      </div>
    </div>
  );
};

// ── ExpertToggle — compact icon+label boolean field for the Expert Panel ────────

interface ExpertToggleProps {
  icon: React.ReactNode;
  label: string;
  pts: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  disabled?: boolean;
  resultValue?: boolean | null;
}

const ExpertToggle = ({ icon, label, pts, value, onChange, disabled, resultValue }: ExpertToggleProps) => {
  const isScored   = resultValue !== undefined && resultValue !== null;
  const isCorrect  = isScored && value === resultValue;
  const simCorrect = isScored && resultValue === true;
  const naoCorrect = isScored && resultValue === false;

  const btnCls = (pick: boolean) => {
    const base = "flex-1 h-8 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:cursor-not-allowed";
    if (isScored) {
      const correct = pick ? simCorrect : naoCorrect;
      if (correct)        return `${base} bg-green-500/20 text-green-400 border border-green-500/30`;
      if (value === pick) return `${base} bg-red-500/10 text-red-400/60`;
      return `${base} bg-muted/20 text-muted-foreground/30`;
    }
    if (value === pick) {
      return pick
        ? `${base} bg-secondary text-secondary-foreground shadow-sm`
        : `${base} bg-destructive/80 text-destructive-foreground shadow-sm`;
    }
    return `${base} bg-muted text-muted-foreground ${disabled ? "" : "hover:text-foreground"}`;
  };

  return (
    <div className={cn(
      "rounded-xl p-2.5 flex flex-col gap-2 transition-colors",
      isCorrect ? "bg-green-500/10 border border-green-500/20" : "bg-muted/50 border border-border/30",
    )}>
      <div className="flex items-center gap-1.5 leading-none">
        <span className={cn("shrink-0", isCorrect ? "text-green-400" : "text-muted-foreground/60")}>{icon}</span>
        <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wide truncate">{label}</span>
        {isCorrect && <Check className="w-3 h-3 text-green-400 shrink-0 ml-auto" />}
      </div>
      <div className="text-[10px] text-primary font-semibold leading-none">{pts}</div>
      <div className="flex gap-1.5">
        <button type="button" disabled={disabled}
          onClick={() => !disabled && onChange(value === true ? null : true)}
          className={btnCls(true)}>Sim</button>
        <button type="button" disabled={disabled}
          onClick={() => !disabled && onChange(value === false ? null : false)}
          className={btnCls(false)}>Não</button>
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
  onCompletionChange?: (id: number, isComplete: boolean) => void;
  saveSignal?: number;
  onSaved?: (id: number) => void;
  goldenMatchIdForDay?: number | null;
  onGoldenChange?: (matchId: number, isGolden: boolean) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const MatchCard = ({
  id, teamA, teamB, time, group, stage, date,
  hasPaid = false, scored, startsAt,
  hasSavedPrediction: externalHasSaved = false,
  resultHome = null, resultAway = null, resultWinner = null,
  resultGoalFirstHalf = null, resultGoalSecondHalf = null,
  resultRedCard = null, resultPenalty = null, resultVarGoal = null,
  resultFirstToScore = null, resultPossession = null, resultFirstGoalMinute = null,
  resultOvertime = null, resultShootout = null,
  onCompletionChange, saveSignal, onSaved,
  goldenMatchIdForDay = null, onGoldenChange,
}: MatchCardProps) => {
  const multiplier   = getPhaseMultiplier(stage ?? "Group Stage");
  const localTime    = getLocalTime(date, time);
  const isKnockout   = ["Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "Final", "Third Place"].includes(stage ?? "");
  const { user }     = useAuth();
  const { isActive } = useSubscription();
  const { settings } = useSiteSettings();
  const paywallActive = settings.feature_flags?.paywall_active ?? true;
  const navigate     = useNavigate();

  // ── State ───────────────────────────────────────────────────────────────────
  const [predictionLoaded,   setPredictionLoaded]   = useState(false);
  const [loadingPrediction,  setLoadingPrediction]  = useState(false);
  const [scoreA,             setScoreA]             = useState<number | "">("");
  const [scoreB,             setScoreB]             = useState<number | "">("");
  const [winner,             setWinner]             = useState<"A" | "X" | "B" | null>(null);
  const [goalFirstHalf,      setGoalFirstHalf]      = useState<boolean | null>(null);
  const [goalSecondHalf,     setGoalSecondHalf]     = useState<boolean | null>(null);
  const [redCard,            setRedCard]            = useState<boolean | null>(null);
  const [penalty,            setPenalty]            = useState<boolean | null>(null);
  const [varGoal,            setVarGoal]            = useState<boolean | null>(null);
  const [firstGoal,          setFirstGoal]          = useState<"A" | "N" | "B" | null>(null);
  const [possession,         setPossession]         = useState<"A" | "B" | null>(null);
  const [firstGoalMinute,    setFirstGoalMinute]    = useState<number | null>(null);
  const [overtime,           setOvertime]           = useState<boolean | null>(null);
  const [shootout,           setShootout]           = useState<boolean | null>(null);
  const [isDoublePoints,     setIsDoublePoints]     = useState(false);
  const [hasSavedPrediction, setHasSavedPrediction] = useState(externalHasSaved);
  const [saved,              setSaved]              = useState(false);
  const [isSaving,           setIsSaving]           = useState(false);
  const [pointsEarned,       setPointsEarned]       = useState<number | null>(null);

  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Refs
  const autoWinnerRef      = useRef<"A" | "X" | "B" | null>(null);
  const prevSaveSignalRef  = useRef(0);
  // handleSave ref to avoid stale closure in saveSignal effect
  const handleSaveRef      = useRef<() => void>(() => {});

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
  const localKey = user ? `prediction:${user.id}:${id}` : null;

  useEffect(() => {
    if (externalHasSaved) setHasSavedPrediction(true);
  }, [externalHasSaved]);

  // ── Hydration: localStorage ─────────────────────────────────────────────────
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
      if (d.has_var_goal     != null) setVarGoal(d.has_var_goal);
      if (d.first_to_score)             setFirstGoal(d.first_to_score);
      if (d.possession_winner)          setPossession(d.possession_winner);
      if (d.first_goal_minute != null)  setFirstGoalMinute(d.first_goal_minute);
      if (d.has_overtime      != null)  setOvertime(d.has_overtime);
      if (d.has_shootout      != null)  setShootout(d.has_shootout);
      if (d.is_double_points != null)   setIsDoublePoints(d.is_double_points);
      setHasSavedPrediction(true);
    } catch { /* corrompido — ignorar */ }
  }, [localKey]);

  // ── Hydration: Supabase ─────────────────────────────────────────────────────
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
      setVarGoal(       (data.has_var_goal     as boolean) ?? null);
      setFirstGoal(      (data.first_to_score    as "A" | "N" | "B") ?? null);
      setPossession(     (data.possession_winner as "A" | "B")      ?? null);
      setFirstGoalMinute((data.first_goal_minute as number)          ?? null);
      setOvertime(       (data.has_overtime      as boolean)         ?? null);
      setShootout(       (data.has_shootout      as boolean)         ?? null);
      setIsDoublePoints( (data.is_double_points  as boolean)         ?? false);
      if (data.points_earned != null) setPointsEarned(data.points_earned as number);
      setHasSavedPrediction(true);
      if (localKey) {
        try {
          localStorage.setItem(localKey, JSON.stringify({
            home_score: data.home_score, away_score: data.away_score,
            winner_pick: data.winner_pick, goal_first_half: data.goal_first_half,
            goal_second_half: data.goal_second_half, has_red_card: data.has_red_card,
            has_penalty: data.has_penalty, has_var_goal: data.has_var_goal, first_to_score: data.first_to_score,
            possession_winner: data.possession_winner, first_goal_minute: data.first_goal_minute,
            has_overtime: data.has_overtime, has_shootout: data.has_shootout,
          }));
        } catch { /* ignorar */ }
      }
    }
    setLoadingPrediction(false);
  }, [user, id, predictionLoaded, localKey]);

  useEffect(() => {
    if (user) fetchFromServer();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived state ────────────────────────────────────────────────────────────
  const hasScore = scoreA !== "" && scoreB !== "";

  // For locked/scored cards always show advanced fields regardless of state
  const shouldShowAdvanced = advancedOpen || isLocked || matchStatus === "scored";

  // Count of the advanced fields (winner counted separately)
  const requiredAdvancedCount = isKnockout ? 10 : 8;
  const advancedFilledCount = [
    goalFirstHalf !== null,
    goalSecondHalf !== null,
    redCard !== null,
    penalty !== null,
    varGoal !== null,
    firstGoal !== null,
    possession !== null,
    firstGoalMinute !== null,
    ...(isKnockout ? [overtime !== null, shootout !== null] : []),
  ].filter(Boolean).length;

  // Full count for potential points display
  const filledCount = [
    hasScore,
    winner !== null,
    goalFirstHalf !== null,
    goalSecondHalf !== null,
    redCard !== null,
    penalty !== null,
    varGoal !== null,
    firstGoal !== null,
    possession !== null,
    firstGoalMinute !== null,
    ...(isKnockout ? [overtime !== null, shootout !== null] : []),
  ].filter(Boolean).length;

  const isComplete = hasScore && winner !== null && advancedFilledCount === requiredAdvancedCount;

  // Deadline = match start minus the 30-min lock window
  const deadlineMs = useMemo(() => {
    if (startsAt) return parseStartMs(startsAt) - 30 * 60_000;
    if (date) {
      try { return parseMatchDateTime(date, time).getTime() - 30 * 60_000; } catch { /* skip */ }
    }
    return null;
  }, [startsAt, date, time]);

  // ── Auto-open advanced fields when any score is entered ──────────────────────
  useEffect(() => {
    if ((scoreA !== "" || scoreB !== "") && !isLocked) {
      setAdvancedOpen(true);
    }
  }, [scoreA, scoreB]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-fill winner from score ──────────────────────────────────────────────
  useEffect(() => {
    if (isLocked || !hasScore) return;
    const a = scoreA as number;
    const b = scoreB as number;
    const computed: "A" | "X" | "B" = a > b ? "A" : b > a ? "B" : "X";
    // Only auto-update if winner is null or still matches our last auto-set value
    if (winner === null || winner === autoWinnerRef.current) {
      autoWinnerRef.current = computed;
      setWinner(computed);
    }
  }, [scoreA, scoreB]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Notify parent of completion change ───────────────────────────────────────
  useEffect(() => {
    onCompletionChange?.(id, isComplete);
  }, [isComplete, id, onCompletionChange]);

  // ── Parent-triggered save ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!saveSignal || saveSignal === prevSaveSignalRef.current) return;
    prevSaveSignalRef.current = saveSignal;
    if (isComplete && !hasSavedPrediction && !isLocked) {
      handleSaveRef.current();
    }
  }, [saveSignal, isComplete, hasSavedPrediction, isLocked]);

  // ── Field correctness ────────────────────────────────────────────────────────
  const fieldChecks = useMemo(() => {
    if (!scored || resultHome == null || resultAway == null) return null;
    const minuteCorrect = firstGoalMinute !== null && (() => {
      const predNoGoal = firstGoalMinute === 0;
      const realNoGoal = resultFirstGoalMinute === null || resultFirstGoalMinute === 0;
      return (predNoGoal && realNoGoal) ||
             (!predNoGoal && !realNoGoal && firstGoalMinute === resultFirstGoalMinute);
    })();
    return {
      scoreHome:  scoreA !== "" && (scoreA as number) === resultHome,
      scoreAway:  scoreB !== "" && (scoreB as number) === resultAway,
      winner:     winner !== null && winner === resultWinner,
      firstGoal:  firstGoal !== null && firstGoal === resultFirstToScore,
      possession: possession !== null && possession === resultPossession,
      minute:     minuteCorrect,
    };
  }, [scored, resultHome, resultAway, resultWinner, resultFirstToScore, resultPossession,
      resultFirstGoalMinute, scoreA, scoreB, winner, firstGoal, possession, firstGoalMinute]);

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (isLocked || isSaving) return;
    if (!user) { toast.error("Faça login para salvar palpites."); navigate("/auth"); return; }
    setIsSaving(true);
    if (paywallActive && !isActive && !hasPaid) {
      toast.error("Assine o plano para participar da Copa!", {
        action: { label: "Ver Planos", onClick: () => navigate("/planos") },
      });
      return;
    }

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("predictions") as any).upsert({
      user_id: user.id, match_id: id,
      home_score:        scoreA === "" ? null : (scoreA as number),
      away_score:        scoreB === "" ? null : (scoreB as number),
      winner_pick:       winner,
      goal_first_half:   goalFirstHalf,
      goal_second_half:  goalSecondHalf,
      has_red_card:      redCard,
      has_penalty:       penalty,
      has_var_goal:      varGoal,
      first_to_score:    firstGoal,
      possession_winner: possession,
      first_goal_minute: firstGoalMinute,
      has_overtime:      isKnockout ? overtime : null,
      has_shootout:      isKnockout ? shootout : null,
      is_double_points:  isDoublePoints,
      updated_at:        new Date().toISOString(),
    }, { onConflict: "user_id,match_id" });

    if (error) { console.error("Supabase upsert error:", error); toast.error("Erro ao salvar palpite."); setIsSaving(false); return; }

    if (localKey) {
      try {
        localStorage.setItem(localKey, JSON.stringify({
          home_score: scoreA, away_score: scoreB,
          winner_pick: winner, goal_first_half: goalFirstHalf,
          goal_second_half: goalSecondHalf, has_red_card: redCard,
          has_penalty: penalty, has_var_goal: varGoal, first_to_score: firstGoal,
          possession_winner: possession, first_goal_minute: firstGoalMinute,
          has_overtime: overtime, has_shootout: shootout,
          is_double_points: isDoublePoints,
        }));
      } catch { /* ignorar */ }
    }

    setHasSavedPrediction(true);
    setSaved(true);
    setAdvancedOpen(false);
    setIsSaving(false);
    onGoldenChange?.(id, isDoublePoints);
    onSaved?.(id);
    setTimeout(() => setSaved(false), 3000);
  };

  // Keep handleSaveRef in sync
  handleSaveRef.current = handleSave;

  // ── Visual state ─────────────────────────────────────────────────────────────
  const isExact    = fieldChecks?.scoreHome && fieldChecks?.scoreAway;
  const isCorrect  = (pointsEarned ?? 0) > 0;
  const isPerfect  = pointsEarned !== null && pointsEarned === MAX_BASE_POINTS * multiplier * (isDoublePoints ? 2 : 1);
  const goldenUsedElsewhere = goldenMatchIdForDay != null && goldenMatchIdForDay !== id;

  const cardBorderClass = () => {
    if (matchStatus === "scored" && hasSavedPrediction && pointsEarned !== null) {
      if (isPerfect)  return "border-yellow-400/60";
      if (isExact)    return "border-primary/50";
      if (isCorrect)  return "border-green-500/35";
      return "border-destructive/30";
    }
    if (matchStatus === "locked" || matchStatus === "live") return "border-amber-500/25";
    if (saved || hasSavedPrediction) return "border-green-500/25";
    return "border-border/60";
  };

  const cardBgClass = () => {
    if (matchStatus === "scored" && hasSavedPrediction && pointsEarned !== null) {
      if (isPerfect)  return "bg-yellow-400/[0.04]";
      if (isExact)    return "bg-primary/[0.03]";
      if (isCorrect)  return "bg-green-500/[0.03]";
      return "bg-destructive/[0.02]";
    }
    if (matchStatus === "locked" || matchStatus === "live") return "bg-amber-500/[0.02]";
    return "";
  };

  const resultBadge = () => {
    if (matchStatus === "scored" && hasSavedPrediction && pointsEarned !== null) {
      if (isPerfect) return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 animate-pulse-gold">🏆 GABARITO!</span>;
      if (isExact)   return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 animate-pulse-gold">{isDoublePoints ? "⭐ Exato 2×!" : "⭐ Placar Exato!"}</span>;
      if (isCorrect) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">{isDoublePoints ? "⭐ " : "✓ "}{pointsEarned} pts</span>;
      return          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/25">✗ Errou</span>;
    }
    if (saved)                                         return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">✓ Salvo!</span>;
    if (hasSavedPrediction && matchStatus === "open")  return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">✓</span>;
    return null;
  };

  const statusBadge = () => {
    switch (matchStatus) {
      case "open":   return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">Aberto</span>;
      case "locked": return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">Encerrado</span>;
      case "live":   return (
        <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          Ao Vivo
        </span>
      );
      case "scored": return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">Pontuado</span>;
    }
  };

  const choiceButtonClass = (selected: boolean, correct: boolean | null): string => {
    const base = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all disabled:cursor-not-allowed";
    if (scored && correct !== null) {
      if (correct)  return `${base} bg-green-500/20 text-green-400 border border-green-500/30`;
      if (selected) return `${base} bg-red-500/15 text-red-400/70 border border-red-500/20`;
      return `${base} bg-muted/40 text-muted-foreground/40`;
    }
    if (selected) return `${base} bg-primary text-primary-foreground shadow-lg`;
    return `${base} bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40`;
  };

  const altChoiceClass = (selected: boolean, correct: boolean | null): string => {
    const base = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all disabled:cursor-not-allowed";
    if (scored && correct !== null) {
      if (correct)  return `${base} bg-green-500/20 text-green-400 border border-green-500/30`;
      if (selected) return `${base} bg-red-500/15 text-red-400/70 border border-red-500/20`;
      return `${base} bg-muted/40 text-muted-foreground/40`;
    }
    if (selected) return `${base} bg-secondary text-secondary-foreground shadow-lg`;
    return `${base} bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40`;
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden transition-all duration-normal relative",
        cardBorderClass(),
        cardBgClass(),
        isExact && matchStatus === "scored" && "shadow-glow-gold",
        isDoublePoints && "ring-2 ring-[#BF953F] shadow-[0_0_20px_rgba(191,149,63,0.3)]",
      )}
      style={{ background: "var(--gradient-surface)" }}
    >
      {/* ── Golden shimmer sweep ── */}
      {isDoublePoints && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <div className="absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-[#FCF6BA]/8 to-transparent animate-gold-shimmer" />
        </div>
      )}

      {/* ── Golden badge (top-right corner) ── */}
      {isDoublePoints && (
        <div className="absolute top-0 right-0 z-20 pointer-events-none">
          <span className="block text-[10px] font-black text-black px-2.5 py-1 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] rounded-bl-xl tracking-wider leading-none select-none">
            PALPITE DE OURO 2×
          </span>
        </div>
      )}

      {/* ── Header row ── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-secondary/30 bg-secondary/10 text-secondary-foreground/80 uppercase tracking-wider">
          {group}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">{localTime}</span>
          {statusBadge()}
          {resultBadge()}
        </div>
      </div>

      {/* ── Countdown strip — only for open matches with a known deadline ── */}
      {matchStatus === "open" && deadlineMs !== null && deadlineMs > Date.now() && (
        <MatchCountdown deadlineMs={deadlineMs} />
      )}

      {/* ── Score section ── */}
      <div className="px-4 pb-3">
        {/* Scored result row (when pontuado) */}
        {matchStatus === "scored" && resultHome != null && resultAway != null && (
          <div className="flex items-center justify-center gap-2 mb-3 py-2 rounded-xl bg-muted/40 border border-border/40">
            <span className="text-xs font-semibold text-muted-foreground">Resultado oficial:</span>
            <span className="text-lg font-black text-foreground tabular-nums">
              {resultHome}<span className="text-muted-foreground mx-1">×</span>{resultAway}
            </span>
          </div>
        )}

        {/* Row 1: Teams — each side gets flex-1, no constraint from score controls */}
        <div className="flex items-center justify-between mb-3">
          {/* Team A */}
          <div className="flex-1 flex flex-col items-center gap-1 px-1">
            <FlagImg teamName={teamA} className="h-8 rounded shadow-sm" />
            <span className="text-xs font-bold text-foreground text-center leading-tight w-full">{teamA}</span>
          </div>

          {/* VS separator */}
          <div className="shrink-0 flex flex-col items-center justify-center px-2">
            {isDoublePoints ? (
              <Star className="w-5 h-5 fill-[#FCF6BA] text-[#BF953F] drop-shadow-[0_0_6px_rgba(191,149,63,0.8)]" />
            ) : (
              <span className="text-[11px] font-black text-muted-foreground/50 tracking-widest">VS</span>
            )}
          </div>

          {/* Team B */}
          <div className="flex-1 flex flex-col items-center gap-1 px-1">
            <FlagImg teamName={teamB} className="h-8 rounded shadow-sm" />
            <span className="text-xs font-bold text-foreground text-center leading-tight w-full">{teamB}</span>
          </div>
        </div>

        {/* Row 2: Score controls — centered, unconstrained width */}
        <div className="flex items-center justify-center gap-2">
          <ScoreControl
            value={scoreA}
            onChange={setScoreA}
            disabled={isLocked}
            isCorrect={fieldChecks?.scoreHome ?? null}
            isScored={!!scored}
          />
          <span className="text-muted-foreground font-bold text-xl tabular-nums">×</span>
          <ScoreControl
            value={scoreB}
            onChange={setScoreB}
            disabled={isLocked}
            isCorrect={fieldChecks?.scoreAway ?? null}
            isScored={!!scored}
          />
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-border/50 mx-4" />

      {/* ── CTA ── */}
      <div className="px-4 py-3 space-y-2">
        {/* Locked/live/scored state banners */}
        {(matchStatus === "locked" || matchStatus === "live") && (
          <div className={cn(
            "flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold",
            matchStatus === "live"
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20",
          )}>
            {matchStatus === "live"
              ? <><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"/></span> Jogo em andamento</>
              : <><Lock className="w-3.5 h-3.5" /> Apostas encerradas — jogo começa em breve</>
            }
          </div>
        )}

        {matchStatus === "scored" && hasSavedPrediction && (
          <div className="flex items-center justify-center gap-3 py-2.5">
            {pointsEarned != null ? (
              isPerfect ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl font-black text-yellow-300 tabular-nums leading-tight">
                    {pointsEarned}<span className="text-sm font-semibold ml-0.5">pts</span>
                  </span>
                  <span className="text-xs font-black text-yellow-300 tracking-wide animate-pulse-gold">🏆 GABARITO PERFEITO!</span>
                </div>
              ) : (
                <>
                  <span className="text-3xl font-black text-primary tabular-nums leading-tight">
                    {pointsEarned}<span className="text-sm font-semibold ml-0.5">pts</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isExact ? "Placar exato!" : fieldChecks?.winner ? "Acertou o vencedor" : "Resultado não acertado"}
                  </span>
                </>
              )
            ) : (
              <span className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Carregando pontos...
              </span>
            )}
          </div>
        )}

        {matchStatus === "open" && (
          <>
            {/* State: saved 3s flash */}
            {saved ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full py-3 rounded-xl bg-green-500/20 text-green-400 border border-green-500/25 text-sm font-bold flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Palpite Salvo!
              </motion.div>
            ) : hasSavedPrediction ? (
              /* State: confirmed */
              <div className="flex gap-2">
                <div className="flex-1 py-3 rounded-xl bg-green-500/20 text-green-400 border border-green-500/25 text-sm font-bold flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Confirmado
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="px-4 py-3 rounded-xl border border-border/50 bg-muted/40 text-muted-foreground text-sm font-bold hover:bg-muted transition-colors"
                    >
                      Alterar
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Alterar palpite?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Seus dados serão mantidos — mas você precisará confirmar novamente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => setHasSavedPrediction(false)}>
                        Alterar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              /* State: disabled / filling / complete */
              <motion.button
                type="button"
                onClick={handleSave}
                disabled={!isComplete || isSaving}
                whileTap={isComplete && !isSaving ? { scale: 0.98 } : undefined}
                className={cn(
                  "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                  isComplete && !isSaving
                    ? "btn-gold animate-pulse-gold"
                    : "bg-muted/40 text-muted-foreground/40 cursor-not-allowed border border-border/30",
                )}
              >
                <AnimatePresence mode="wait">
                  {isSaving ? (
                    <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Salvando…
                    </motion.span>
                  ) : isComplete ? (
                    <motion.span key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Confirmar Palpite
                    </motion.span>
                  ) : !hasScore ? (
                    <motion.span key="noscore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <Zap className="w-4 h-4 opacity-40" /> Preencha o placar para continuar
                    </motion.span>
                  ) : (
                    <motion.span key="partial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <Zap className="w-4 h-4 opacity-40" />
                      {advancedFilledCount}/{requiredAdvancedCount} campos avançados preenchidos
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </>
        )}
      </div>

      {/* ── Toggle button — visible in all card states ── */}
      <button
        type="button"
        onClick={() => setAdvancedOpen(o => !o)}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border/40"
      >
        {advancedOpen
          ? <><ChevronUp className="w-3.5 h-3.5" /> Fechar campos avançados</>
          : <><ChevronDown className="w-3.5 h-3.5" /> Ver campos avançados</>
        }
      </button>

      {/* ── Advanced prediction fields ── */}
      <AnimatePresence>
        {advancedOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/40">
              {/* Section header with progress */}
              {matchStatus === "open" && !hasSavedPrediction && (
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                    Campos Avançados
                  </span>
                  <span className={cn(
                    "text-[11px] font-bold tabular-nums",
                    advancedFilledCount === requiredAdvancedCount ? "text-primary" : "text-muted-foreground",
                  )}>
                    {advancedFilledCount}/{requiredAdvancedCount}
                  </span>
                </div>
              )}

              <div className="px-4 pb-4 space-y-3 pt-3">
                {loadingPrediction && (
                  <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                  </div>
                )}

                <div className={loadingPrediction ? "hidden" : "space-y-3"}>
                  {/* ── Vencedor / Empate (full width) ── */}
                  <div>
                    <label className={cn(
                      "text-xs uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5",
                      fieldChecks?.winner ? "text-green-400" : "text-muted-foreground",
                    )}>
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
                        const isCrt = scored && resultWinner != null ? key === resultWinner : null;
                        return (
                          <button key={key} type="button" disabled={isLocked}
                            onClick={() => {
                              if (isLocked) return;
                              const next = winner === key ? null : key;
                              autoWinnerRef.current = null;
                              setWinner(next);
                            }}
                            className={choiceButtonClass(isSelected, isCrt)}
                          >{label}</button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Gol 1ºT + Gol 2ºT ── */}
                  <div className="grid grid-cols-2 gap-3">
                    <ToggleField label="Gol no 1º Tempo" pointsSim={5}  pointsNao={5}
                      value={goalFirstHalf}  onChange={setGoalFirstHalf}  disabled={isLocked}
                      resultValue={scored ? resultGoalFirstHalf : undefined} />
                    <ToggleField label="Gol no 2º Tempo" pointsSim={5}  pointsNao={5}
                      value={goalSecondHalf} onChange={setGoalSecondHalf} disabled={isLocked}
                      resultValue={scored ? resultGoalSecondHalf : undefined} />
                  </div>

                  {/* ── Knockout only: Prorrogação + Pênaltis ── */}
                  {isKnockout && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 px-0.5">
                        <Timer className="w-3 h-3 text-amber-400/70" />
                        <span className="text-[10px] font-black text-amber-400/70 uppercase tracking-wider">Fase eliminatória</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <ToggleField label="Terá Prorrogação?" pointsSim={8}  pointsNao={5}
                          value={overtime} onChange={setOvertime} disabled={isLocked}
                          resultValue={scored ? resultOvertime : undefined} />
                        <ToggleField label="Pênaltis?"         pointsSim={12} pointsNao={5}
                          value={shootout} onChange={setShootout} disabled={isLocked}
                          resultValue={scored ? resultShootout : undefined} />
                      </div>
                    </div>
                  )}

                  {/* ── 1º a marcar ── */}
                  <div>
                    <label className={cn(
                      "text-xs uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5",
                      fieldChecks?.firstGoal ? "text-green-400" : "text-muted-foreground",
                    )}>
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
                        const isCrt  = scored && resultFirstToScore != null ? key === resultFirstToScore : null;
                        return (
                          <button key={key} type="button" disabled={isLocked}
                            onClick={() => !isLocked && setFirstGoal(firstGoal === key ? null : key)}
                            className={altChoiceClass(isSelected, isCrt)}
                          >{label}</button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Posse ── */}
                  <div>
                    <label className={cn(
                      "text-xs uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5",
                      fieldChecks?.possession ? "text-green-400" : "text-muted-foreground",
                    )}>
                      Mais Posse de Bola <span className="text-primary">(5 pts)</span>
                      {fieldChecks?.possession && <Check className="w-3.5 h-3.5" />}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {([{ key: "A" as const, label: teamA }, { key: "B" as const, label: teamB }]).map(({ key, label }) => {
                        const isSelected = possession === key;
                        const isCrt  = scored && resultPossession != null ? key === resultPossession : null;
                        return (
                          <button key={key} type="button" disabled={isLocked}
                            onClick={() => !isLocked && setPossession(possession === key ? null : key)}
                            className={altChoiceClass(isSelected, isCrt)}
                          >{label}</button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Especialista panel (ao final do formulário) ── */}
                  {(() => {
                    const isNoGoal      = firstGoalMinute === 0;
                    const minuteCorrect = fieldChecks?.minute ?? false;
                    return (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.02] overflow-hidden">

                        {/* Panel header */}
                        <div className="px-4 py-2.5 border-b border-amber-500/15 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Swords className="w-3.5 h-3.5 text-amber-500/60" />
                            <span className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest">Especialista</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/50 font-medium">campos bônus</span>
                        </div>

                        {/* Minute input */}
                        <div className="px-4 pt-3 pb-3 border-b border-amber-500/10">
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-1.5">
                              <Clock className={cn("w-3.5 h-3.5 shrink-0", minuteCorrect ? "text-green-400" : "text-muted-foreground/60")} />
                              <span className={cn("text-xs font-bold uppercase tracking-wide", minuteCorrect ? "text-green-400" : "text-muted-foreground")}>
                                Minuto do 1º Gol
                              </span>
                              {minuteCorrect && <Check className="w-3.5 h-3.5 text-green-400" />}
                            </div>
                            <span className="text-xs font-bold text-primary">25 pts</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={isNoGoal || firstGoalMinute === null ? "" : String(firstGoalMinute)}
                              onChange={e => {
                                if (isLocked) return;
                                const raw = e.target.value.replace(/\D/g, "");
                                if (raw === "") { setFirstGoalMinute(null); return; }
                                const n = Math.min(90, parseInt(raw, 10));
                                if (!isNaN(n) && n > 0) setFirstGoalMinute(n);
                              }}
                              disabled={isLocked || isNoGoal}
                              placeholder="—"
                              className={cn(
                                "flex-1 min-w-0 h-11 text-center text-2xl font-black rounded-xl border-2 bg-background focus:outline-none transition-all",
                                "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none",
                                isNoGoal
                                  ? "border-border/20 text-muted-foreground/30"
                                  : firstGoalMinute !== null
                                    ? minuteCorrect
                                      ? "border-green-500/40 text-green-400"
                                      : "border-primary/40 text-foreground"
                                    : "border-border/50 text-muted-foreground/40",
                                (isLocked || isNoGoal) && "opacity-50 cursor-not-allowed",
                              )}
                            />
                            <button type="button" disabled={isLocked}
                              onClick={() => !isLocked && setFirstGoalMinute(isNoGoal ? null : 0)}
                              className={cn(
                                "flex-shrink-0 h-11 px-3 rounded-xl text-sm font-bold transition-all active:scale-95",
                                isNoGoal
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                  : "bg-muted text-muted-foreground hover:text-foreground",
                                isLocked && "opacity-50 cursor-not-allowed",
                              )}>
                              0-0
                            </button>
                            {([45, 90] as const).map(m => (
                              <button key={m} type="button"
                                disabled={isLocked || isNoGoal}
                                onClick={() => !isLocked && !isNoGoal && setFirstGoalMinute(m)}
                                title={m === 45 ? "45º min + acréscimos do 1º tempo" : "90º min + acréscimos do 2º tempo"}
                                className={cn(
                                  "flex-shrink-0 h-11 px-3 rounded-xl text-sm font-bold transition-all active:scale-95",
                                  firstGoalMinute === m && !isNoGoal
                                    ? "bg-primary/20 text-primary border border-primary/30"
                                    : "bg-muted text-muted-foreground hover:text-foreground",
                                  (isLocked || isNoGoal) && "opacity-30 cursor-not-allowed",
                                )}>
                                {m}+
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground/50 mt-2 leading-relaxed">
                            45+ = acréscimos do 1º tempo · 90+ = acréscimos do 2º tempo
                          </p>
                          <p className="text-[10px] text-amber-500/60 mt-1 leading-relaxed">
                            Campo de desempate — acertar o minuto vale pontos extras sem cancelar o gabarito perfeito
                          </p>
                          {scored && (
                            <p className="text-[11px] text-muted-foreground mt-2">
                              Resultado: {(resultFirstGoalMinute === null || resultFirstGoalMinute === 0) ? "Sem gol" : `${resultFirstGoalMinute}'`}
                            </p>
                          )}
                        </div>

                        {/* 3-col compact toggles */}
                        <div className="p-4 grid grid-cols-3 gap-2">
                          <ExpertToggle
                            icon={<ScanSearch className="w-3.5 h-3.5" />}
                            label="Gol Anulado VAR" pts="Sim 12 / Não 5"
                            value={varGoal} onChange={setVarGoal} disabled={isLocked}
                            resultValue={scored ? resultVarGoal : undefined}
                          />
                          <ExpertToggle
                            icon={<Footprints className="w-3.5 h-3.5" />}
                            label="Terá Pênalti?" pts="Sim 12 / Não 5"
                            value={penalty} onChange={setPenalty} disabled={isLocked}
                            resultValue={scored ? resultPenalty : undefined}
                          />
                          <ExpertToggle
                            icon={<Square className="w-3.5 h-3.5" />}
                            label="Expulsão" pts="Sim 12 / Não 5"
                            value={redCard} onChange={setRedCard} disabled={isLocked}
                            resultValue={scored ? resultRedCard : undefined}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Palpite de Ouro — visual premium ── */}
                  {matchStatus === "open" && (
                    <div
                      className={cn(
                        "rounded-xl p-4 border transition-all duration-200",
                        isDoublePoints
                          ? "bg-gradient-to-br from-yellow-400/15 to-amber-600/10 border-yellow-400/60 shadow-[0_0_20px_rgba(250,204,21,0.35)]"
                          : goldenUsedElsewhere
                            ? "bg-muted/20 border-border/20 opacity-50 cursor-not-allowed"
                            : "bg-gradient-to-br from-yellow-400/[0.04] to-amber-500/[0.03] border-yellow-400/20 hover:border-yellow-400/35 hover:from-yellow-400/[0.07] cursor-pointer",
                      )}
                      onClick={() => {
                        if (isLocked || goldenUsedElsewhere) return;
                        setIsDoublePoints(v => !v);
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={cn("text-lg shrink-0", isDoublePoints && "animate-pulse")}>⭐</span>
                          <div className="min-w-0">
                            <p className={cn("text-xs font-black leading-tight", isDoublePoints ? "text-yellow-300" : "text-foreground")}>
                              Palpite de Ouro
                            </p>
                            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                              {goldenUsedElsewhere
                                ? "Já usado nesta data — escolha outro jogo"
                                : isDoublePoints
                                  ? "Ativado! Seus pontos serão dobrados (2×)"
                                  : "Dobra todos os seus pontos nesta partida (2×)"}
                            </p>
                          </div>
                        </div>
                        <div className={cn(
                          "relative w-10 h-5 rounded-full transition-colors shrink-0",
                          isDoublePoints ? "bg-yellow-400" : "bg-muted/80",
                        )}>
                          <div className={cn(
                            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                            isDoublePoints ? "left-5" : "left-0.5",
                          )} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Gabarito perfeito hint ── */}
                  {isComplete && matchStatus === "open" && (
                    <div className={cn(
                      "text-center text-xs font-semibold p-2 rounded-xl",
                      isDoublePoints ? "bg-yellow-400/10 text-yellow-300" : "bg-glass-gold text-primary",
                    )}>
                      🏆 Palpite completo — Potencial: até {MAX_BASE_POINTS * multiplier * (isDoublePoints ? 2 : 1)} pts
                      {isDoublePoints && <span className="ml-1">⭐ 2×</span>}
                      {multiplier > 1 && !isDoublePoints && <span className="ml-1 opacity-70">(×{multiplier} fase)</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchCard;
