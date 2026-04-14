import { useState, useEffect, useRef } from "react";
import {
  Trophy, Zap, ChevronRight, Users, Gift,
  Lock, Crown, Target, Eye, MapPin, Map, Globe, Swords, Star, Shield, Check,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RetroGrid } from "@/components/ui/retro-grid";
import { Marquee } from "@/components/ui/marquee";
import { ShinyButton } from "@/components/ui/shiny-button";
import { NumberTicker } from "@/components/ui/number-ticker";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import OnboardingWizard from "@/components/OnboardingWizard";

// ── Helpers ───────────────────────────────────────────────────────────────────

const FadeUp = ({
  children, delay = 0, className = "",
}: {
  children: React.ReactNode; delay?: number; className?: string;
}) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: delay * 0.12, duration: reduce ? 0.01 : 0.55, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const activityFeed = [
  "🔥 @joao_paulo subiu para 1º no ranking de Londrina!",
  "💰 Prêmio do jogo Brasil x Croácia liberado: R$ 500 para @caio_nunes",
  "🎁 @giulia acaba de liberar sua JBL por indicações!",
  "🎯 @marcos_r acertou o placar exato — Argentina 2x1 Alemanha!",
  "🏆 @fernanda_s assumiu o top 3 do Paraná!",
  "💸 Pix de R$ 250 enviado para @thiago_m — campeão da rodada!",
  "🔥 @luana acaba de indicar o 10º amigo — JBL a caminho!",
  "📈 @pedro_alves subiu 47 posições no ranking geral hoje!",
  "🎯 @carol_lima acertou Vencedor + Placar Exato no Portugal x França!",
  "💰 @rafa ganhou R$ 180 pela rodada — Gabarito Perfeito!",
];

const DEMO_USERS = [
  { name: "Fernanda" },
  { name: "Lucas" },
  { name: "Carla" },
  { name: "Marcos" },
  { name: "Ana" },
];

// ── Demo animated MatchCard ───────────────────────────────────────────────────

type DemoPhase = "empty" | "filling" | "confirmed" | "scored";

const DemoMatchCard = () => {
  const [phase, setPhase] = useState<DemoPhase>("empty");
  const [scoreA, setScoreA] = useState<number | "">(""); // Brasil
  const [scoreB, setScoreB] = useState<number | "">(""); // Argentina
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cyclePhase = (current: DemoPhase): DemoPhase => {
    if (current === "empty") return "filling";
    if (current === "filling") return "confirmed";
    if (current === "confirmed") return "scored";
    return "empty";
  };

  const PHASE_DURATIONS: Record<DemoPhase, number> = {
    empty: 2400,
    filling: 2800,
    confirmed: 2200,
    scored: 2800,
  };

  useEffect(() => {
    if (phase === "empty") {
      setScoreA("");
      setScoreB("");
    }
    if (phase === "filling") {
      // Animate filling the scores step by step
      const t1 = setTimeout(() => setScoreA(2), 400);
      const t2 = setTimeout(() => setScoreB(1), 1100);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [phase]);

  useEffect(() => {
    timerRef.current = setTimeout(() => setPhase(cyclePhase), PHASE_DURATIONS[phase]);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const isConfirmed = phase === "confirmed" || phase === "scored";
  const isScored = phase === "scored";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all duration-500 w-full max-w-sm mx-auto select-none",
        isScored
          ? "border-green-500/40 bg-green-500/[0.06] shadow-[0_0_30px_hsl(142_71%_45%/0.12)]"
          : isConfirmed
            ? "border-green-500/30 bg-green-500/[0.04]"
            : "border-border/60 bg-card/60",
      )}
    >
      {/* Match header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
            Fase de Grupos
          </span>
        </div>
        <AnimatePresence mode="wait">
          {isScored ? (
            <motion.span
              key="scored"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full"
            >
              +35 pts
            </motion.span>
          ) : isConfirmed ? (
            <motion.span
              key="saved"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] font-black text-green-400"
            >
              Salvo ✓
            </motion.span>
          ) : (
            <motion.span
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] text-muted-foreground"
            >
              Palpite aberto
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Teams + Score */}
      <div className="flex items-center gap-3 mb-4">
        {/* Team A */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <img
            src="https://flagcdn.com/w80/br.png"
            alt="Brasil"
            className="w-8 h-5 object-cover rounded-sm"
          />
          <span className="text-xs font-black text-foreground">Brasil</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-11 h-11 rounded-xl border flex items-center justify-center font-black text-xl tabular-nums transition-all duration-300",
            isScored ? "border-green-500/40 bg-green-500/10 text-green-300"
              : isConfirmed ? "border-green-500/30 bg-green-500/[0.06] text-green-400"
                : scoreA !== "" ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/50 bg-muted/30 text-muted-foreground/30",
          )}>
            <AnimatePresence mode="wait">
              <motion.span
                key={String(scoreA)}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                {scoreA !== "" ? scoreA : "—"}
              </motion.span>
            </AnimatePresence>
          </div>

          <span className="text-xs font-black text-muted-foreground/40">×</span>

          <div className={cn(
            "w-11 h-11 rounded-xl border flex items-center justify-center font-black text-xl tabular-nums transition-all duration-300",
            isScored ? "border-green-500/40 bg-green-500/10 text-green-300"
              : isConfirmed ? "border-green-500/30 bg-green-500/[0.06] text-green-400"
                : scoreB !== "" ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/50 bg-muted/30 text-muted-foreground/30",
          )}>
            <AnimatePresence mode="wait">
              <motion.span
                key={String(scoreB)}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                {scoreB !== "" ? scoreB : "—"}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Team B */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <img
            src="https://flagcdn.com/w80/ar.png"
            alt="Argentina"
            className="w-8 h-5 object-cover rounded-sm"
          />
          <span className="text-xs font-black text-foreground">Argentina</span>
        </div>
      </div>

      {/* Confirm button */}
      <AnimatePresence mode="wait">
        {isScored ? (
          <motion.div
            key="scored-state"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black"
          >
            <Check className="w-3.5 h-3.5" />
            Placar exato — 25 pts!
          </motion.div>
        ) : isConfirmed ? (
          <motion.div
            key="confirmed-state"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black"
          >
            <Check className="w-3.5 h-3.5" />
            Palpite salvo com sucesso
          </motion.div>
        ) : scoreA !== "" && scoreB !== "" ? (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full py-2.5 rounded-xl btn-gold text-center text-sm font-black animate-pulse-gold"
          >
            Confirmar Palpite ⚽
          </motion.div>
        ) : (
          <motion.div
            key="empty-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-2.5 rounded-xl bg-muted/40 border border-border/30 text-muted-foreground/40 text-xs font-bold text-center"
          >
            Digite o placar para continuar
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {(["empty", "filling", "confirmed", "scored"] as DemoPhase[]).map((p) => (
          <div
            key={p}
            className={cn(
              "rounded-full transition-all duration-300",
              phase === p ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
};

// ── Mini Podium for ranking teaser ────────────────────────────────────────────

const MiniPodium = () => {
  const entries = [
    { pos: 2, name: "@fernanda_s", pts: 2847, city: "Curitiba", height: "h-20" },
    { pos: 1, name: "@joao_paulo", pts: 3124, city: "São Paulo", height: "h-28" },
    { pos: 3, name: "@marcos_r",   pts: 2619, city: "Recife",   height: "h-16" },
  ];
  const icons = [
    <Crown key="1" className="w-4 h-4 text-primary" />,
    <Trophy key="2" className="w-3.5 h-3.5 text-muted-foreground" />,
    <Star key="3" className="w-3.5 h-3.5 text-amber-600" />,
  ]; // index=0→2nd, 1→1st, 2→3rd

  return (
    <div className="flex items-end justify-center gap-3 px-4 pt-4 pb-2">
      {entries.map(({ pos, name, pts, city, height }, visualIdx) => (
        <FadeUp key={name} delay={visualIdx * 0.6} className="flex flex-col items-center flex-1">
          <div className={cn(
            "w-8 h-8 rounded-full bg-muted/60 border-2 border-background flex items-center justify-center font-black text-xs text-foreground mb-1",
            pos === 1 && "w-10 h-10 border-primary/40 bg-primary/20 text-primary",
          )}>
            {name.charAt(1).toUpperCase()}
          </div>
          <span className={cn(
            "text-[10px] font-black text-foreground truncate w-full text-center",
            pos === 1 && "text-primary",
          )}>
            {name}
          </span>
          <span className={cn(
            "text-[9px] font-bold tabular-nums",
            pos === 1 ? "text-primary" : "text-muted-foreground",
          )}>
            {pts.toLocaleString("pt-BR")} pts
          </span>
          <div className={cn(
            "w-full rounded-t-xl border mt-1.5 flex items-center justify-center",
            height,
            pos === 1
              ? "bg-primary/15 border-primary/30"
              : "bg-muted/40 border-border/30",
          )}>
            {icons[visualIdx]}
          </div>
        </FadeUp>
      ))}
    </div>
  );
};

// ── Landing ───────────────────────────────────────────────────────────────────

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref") || "";
  const reduce = useReducedMotion();

  const groupCode = searchParams.get("group") || "";
  if (groupCode) localStorage.setItem("pending_group_code", groupCode);

  const [showWizard, setShowWizard] = useState(false);

  const openWizard = () => {
    if (user) { navigate("/jogos"); return; }
    setShowWizard(true);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pb-[env(safe-area-inset-bottom)]">

      <AnimatePresence>
        {showWizard && (
          <OnboardingWizard
            referralCode={referralCode}
            groupInviteCode={groupCode || localStorage.getItem("pending_group_code") || ""}
            onClose={() => setShowWizard(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Hero ── */}
      <section
        id="hero"
        className="relative overflow-hidden min-h-[100dvh] flex flex-col items-center justify-center px-4 py-24"
        style={{ background: "var(--gradient-hero)" }}
      >
        <RetroGrid className="opacity-25" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-lg mx-auto text-center space-y-7">
          <motion.div
            initial={{ opacity: 0, scale: reduce ? 1 : 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduce ? 0.01 : 0.45 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/[0.35] bg-primary/[0.12] text-primary text-xs font-bold"
          >
            <Crown className="w-3.5 h-3.5" /> Copa do Mundo 2026 — Vagas Limitadas
          </motion.div>

          {/* Prize */}
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.1, duration: reduce ? 0.01 : 0.6 }}
            className="space-y-1"
          >
            <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Prêmio Total
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-black text-primary">R$</span>
              <NumberTicker
                value={5000000}
                className="text-5xl md:text-7xl font-black text-primary"
              />
            </div>
          </motion.div>

          {/* New headline */}
          <motion.h1
            initial={{ opacity: 0, y: reduce ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.2, duration: reduce ? 0.01 : 0.6 }}
            className="text-3xl md:text-5xl font-black leading-[1.08] text-foreground"
          >
            Prove que você{" "}
            <span className="italic text-primary">entende de</span>
            {" "}futebol.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduce ? 0 : 0.35 }}
            className="text-muted-foreground text-sm md:text-base max-w-sm mx-auto leading-relaxed"
          >
            Palpite nos 104 jogos da Copa e dispute{" "}
            <span className="text-foreground font-semibold">R$ 5 milhões em prêmios.</span>{" "}
            Todo jogo vale Pix.
          </motion.p>

          {/* AvatarGroup social proof */}
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.42 }}
            className="flex items-center justify-center gap-3"
          >
            <AvatarGroup users={DEMO_USERS} max={4} size="sm" />
            <span className="text-xs text-muted-foreground font-medium">
              <span className="text-foreground font-bold">+10.847</span> jogadores ativos
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.5 }}
            className="flex flex-col gap-3 max-w-xs mx-auto"
          >
            <ShinyButton onClick={openWizard} className="py-5 text-[15px] tracking-wide">
              FAZER MEUS PALPITES <ChevronRight className="w-5 h-5" />
            </ShinyButton>
            <p className="text-xs text-muted-foreground">
              Já participante?{" "}
              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Fazer login
              </button>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduce ? 0 : 0.7 }}
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground pt-2"
          >
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Pagamento seguro</span>
            <span className="w-px h-3 bg-border hidden sm:block" />
            <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> CPF protegido</span>
            <span className="w-px h-3 bg-border hidden sm:block" />
            <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> +10K jogadores</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: reduce ? 0.5 : 1 }}
          transition={{ delay: reduce ? 0 : 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground"
          aria-hidden="true"
        >
          <div className="w-px h-8 bg-gradient-to-b from-border to-transparent" />
          <span className="text-[10px] tracking-widest uppercase">Role para baixo</span>
        </motion.div>
      </section>

      {/* ── Activity marquee ── */}
      <div className="overflow-hidden border-y border-border/40 bg-black/40 py-1" aria-hidden="true">
        <Marquee pauseOnHover className="[--duration:45s]" repeat={2}>
          {activityFeed.map((msg) => (
            <div key={msg} className="flex items-center gap-2 bg-card/50 border border-border/50 rounded-lg px-4 py-2 mx-2 whitespace-nowrap">
              <span className="text-xs text-foreground">{msg}</span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* ── Como funciona ── */}
      <section id="como-funciona" className="px-4 py-20 max-w-lg mx-auto scroll-mt-20">
        <FadeUp className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border badge-gold text-xs font-bold mb-4">
            <Zap className="w-3 h-3" /> Como funciona
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">Simples de jogar.<br />Difícil de parar.</h2>
          <p className="text-sm text-muted-foreground mt-2">Três passos. Um único destino: o topo.</p>
        </FadeUp>

        <div className="space-y-4">
          {[
            { step: "01", icon: Target, title: "Dê seu Palpite", desc: "Escolha os placares dos 104 jogos da Copa do Mundo. Quanto mais preciso, mais pontos você acumula.", delay: 0 },
            { step: "02", icon: Star,   title: "Acumule Pontos",  desc: "Cada acerto te lança para o topo do ranking — local, estadual e nacional.", delay: 1 },
            { step: "03", icon: Trophy, title: "Suba e Ganhe",    desc: "Seja o premiado do jogo, da rodada ou do dia. Pix, prêmios físicos e a grande bolada da final.", delay: 2 },
          ].map(({ step, icon: Icon, title, desc, delay }) => (
            <FadeUp key={step} delay={delay}>
              <div className="flex gap-5 items-start p-5 rounded-2xl border border-border/60 bg-card/40 hover:bg-card/60 transition-colors">
                <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 border border-primary/[0.3] bg-primary/[0.12]">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-[9px] font-black mt-0.5 text-primary">{step}</span>
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── Live Demo ── */}
      <section id="demo" className="px-4 pb-20 max-w-lg mx-auto scroll-mt-20">
        <FadeUp className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border badge-gold text-xs font-bold mb-4">
            <Zap className="w-3 h-3" /> Veja ao vivo
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">
            É assim que funciona
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Escolha o placar, confirme e acumule pontos a cada jogo.
          </p>
        </FadeUp>

        <FadeUp delay={1}>
          <div className="relative">
            {/* Subtle glow behind the card */}
            <div
              className="absolute inset-0 rounded-2xl blur-[40px] pointer-events-none"
              style={{ background: "hsl(var(--color-primary) / 0.08)" }}
              aria-hidden="true"
            />
            <DemoMatchCard />
          </div>
        </FadeUp>
      </section>

      {/* ── Pontuação ── */}
      <section id="pontuacao" className="px-4 pb-20 max-w-lg mx-auto scroll-mt-20">
        <FadeUp className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border badge-gold text-xs font-bold mb-4">
            <Swords className="w-3 h-3" /> Mecânicas de pontuação
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">As 3 formas de dominar</h2>
          <p className="text-sm text-muted-foreground mt-2">Escolha sua estratégia — ou use as três ao mesmo tempo.</p>
        </FadeUp>

        <div className="space-y-4">
          {[
            {
              emoji: "🎯", title: "Mestres do Placar", tag: "Curto Prazo",
              tagColor: "text-green-400", tagBg: "bg-green-400/10 border-green-400/20",
              desc: "Pontue por placar exato (25 pts), vencedor correto (10 pts) e campos extras do jogo. Gabarito perfeito (acerta tudo): 100 pts base, multiplicados pela fase.",
              highlight: "100 pts base por gabarito perfeito", border: "border-green-400/20", glow: "from-green-500/5", delay: 0,
            },
            {
              emoji: "🦅", title: "Visão de Águia", tag: "Longo Prazo",
              tagColor: "text-blue-400", tagBg: "bg-blue-400/10 border-blue-400/20",
              desc: "Bônus massivos para quem acertar Campeão, Artilheiro e Finalistas antes da Copa começar.",
              highlight: "Bônus de até 10x na final", border: "border-blue-400/20", glow: "from-blue-500/5", delay: 1,
            },
            {
              emoji: "👥", title: "Comandante de Tropa", tag: "Indicação",
              tagColor: "text-primary", tagBg: "bg-primary/10 border-primary/20",
              desc: "Ganhe pontos extras por cada amigo que entrar no bolão. Quanto maior a sua tropa, maior o seu impacto.",
              highlight: "+200 pts por indicação confirmada", border: "border-primary/20", glow: "from-primary/5", delay: 2,
            },
          ].map(({ emoji, title, tag, tagColor, tagBg, desc, highlight, border, glow, delay }) => (
            <FadeUp key={title} delay={delay}>
              <div className={cn("rounded-2xl border p-6 bg-gradient-to-br to-transparent", border, glow)}>
                <div className="flex items-start gap-4">
                  <span className="text-3xl flex-shrink-0">{emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-black text-base text-foreground">{title}</h3>
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", tagColor, tagBg)}>{tag}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{desc}</p>
                    <div className="inline-flex items-center gap-1.5 bg-card/60 rounded-lg px-3 py-1.5 border border-border/50">
                      <Zap className="w-3 h-3 text-primary" />
                      <span className="text-xs font-black text-foreground">{highlight}</span>
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── Rankings teaser ── */}
      <section
        id="rankings"
        className="px-4 py-20 scroll-mt-20"
        style={{ background: "linear-gradient(180deg, transparent 0%, hsl(var(--color-primary) / 0.04) 50%, transparent 100%)" }}
      >
        <div className="max-w-lg mx-auto">
          <FadeUp className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border badge-gold text-xs font-bold mb-4">
              <Globe className="w-3 h-3" /> Múltiplas frentes
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground">Competição local e global</h2>
            <p className="text-sm text-muted-foreground mt-2">Você compete em três frentes ao mesmo tempo.</p>
          </FadeUp>

          {/* Mini podium preview */}
          <FadeUp className="mb-8">
            <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/20">
                <span className="text-xs font-black text-foreground uppercase tracking-wider">🏆 Ranking Geral</span>
                <span className="text-[10px] text-muted-foreground font-medium">Top 3 ao vivo</span>
              </div>
              <MiniPodium />
              <div className="px-4 pb-3 text-center">
                <p className="text-[10px] text-muted-foreground">Sua posição aparece aqui depois de se inscrever</p>
              </div>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: MapPin, emoji: "🏙️", title: "Ranking da sua cidade", example: "Seja o #1 de Londrina", desc: "Mostre para todo mundo da sua cidade que você entende de futebol mais do que ninguém.", color: "text-emerald-400", border: "border-emerald-400/20", bg: "from-emerald-500/5", delay: 0 },
              { icon: Map,    emoji: "🗺️", title: "Ranking do seu estado", example: "Domine o Paraná",     desc: "Seu estado inteiro vai saber quem é o maior especialista em palpites desta Copa.", color: "text-blue-400", border: "border-blue-400/20", bg: "from-blue-500/5", delay: 1 },
              { icon: Globe,  emoji: "🇧🇷", title: "Ranking geral",         example: "Dispute R$ 5 milhões", desc: "A arena máxima. Você contra o Brasil inteiro. O topo paga R$ 5 milhões em prêmios.", color: "text-primary", border: "border-primary/25", bg: "from-primary/8", delay: 2 },
            ].map(({ icon: Icon, emoji, title, example, desc, color, border, bg, delay }) => (
              <FadeUp key={title} delay={delay}>
                <div className={cn("flex items-center gap-5 p-5 rounded-2xl border bg-gradient-to-r to-transparent", border, bg)}>
                  <div className="text-4xl flex-shrink-0">{emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-base text-foreground">{title}</div>
                    <div className={cn("text-sm font-bold mb-1", color)}>{example}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                  <Icon className={cn("w-5 h-5 flex-shrink-0 opacity-40", color)} />
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Grupos ── */}
      <section id="grupos" className="px-4 py-20 max-w-lg mx-auto scroll-mt-20">
        <FadeUp>
          <div className="rounded-3xl border border-border/60 bg-card/30 overflow-hidden">
            <div className="px-6 py-4 border-b border-border/40 flex items-center gap-3 bg-primary/[0.06]">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/[0.2]">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-black text-sm text-foreground">Social &amp; Grupos</div>
                <div className="text-xs text-muted-foreground">Crie sua própria arena</div>
              </div>
              <div className="ml-auto flex gap-1.5" aria-hidden="true">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-black text-foreground mb-2">
                  Desafie quem você <span className="text-primary">quiser.</span>
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Crie grupos exclusivos para competir com amigos, família ou colegas de trabalho. Sua competição, suas regras.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "🏠", title: "Família",    desc: "Quem sabe mais de futebol em casa?" },
                  { icon: "💼", title: "Trabalho",   desc: "Mostre que você é o craque do escritório" },
                  { icon: "🎓", title: "Faculdade",  desc: "Turma toda no mesmo bolão" },
                  { icon: "🔒", title: "Privado",    desc: "Grupo fechado, só quem você convidar" },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="bg-muted/30 border border-border/50 rounded-xl p-4">
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="font-black text-sm text-foreground">{title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-primary/[0.2] bg-primary/[0.06] px-4 py-3">
                <Eye className="w-4 h-4 flex-shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ranking exclusivo do grupo, histórico de partidas e muito mais dentro da plataforma.
                </p>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── Recompensas ── */}
      <section id="recompensas" className="px-4 pb-20 max-w-lg mx-auto scroll-mt-20">
        <FadeUp>
          <div
            className="relative overflow-hidden rounded-3xl border border-primary/[0.4] p-8 text-center"
            style={{ background: "linear-gradient(135deg, hsl(var(--color-primary) / 0.15) 0%, hsl(var(--color-primary) / 0.05) 60%, hsl(0 0% 0% / 0.2) 100%)" }}
          >
            <div
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[80px] pointer-events-none bg-primary/[0.2]"
              aria-hidden="true"
            />
            <div className="relative z-10 space-y-4">
              <div className="text-5xl mb-2">🎧</div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/[0.4] bg-primary/[0.15] text-primary text-xs font-bold">
                <Gift className="w-3 h-3" /> Recompensa garantida
              </div>
              <h2 className="text-3xl md:text-4xl font-black leading-tight text-primary">
                TROQUE 10 AMIGOS<br />POR UMA JBL
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Convide 10 amigos para a elite e, assim que eles confirmarem,{" "}
                <span className="text-foreground font-bold">você ganha um fone JBL na hora.</span>{" "}
                Sem sorteio. Sem enrolação.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                {["✅ Automático", "⚡ Instantâneo", "🎁 Garantido"].map((item) => (
                  <span key={item} className="text-xs font-bold text-foreground">{item}</span>
                ))}
              </div>
              <ShinyButton onClick={openWizard} className="max-w-xs mx-auto py-4 mt-2">
                QUERO MINHA JBL <ChevronRight className="w-4 h-4" />
              </ShinyButton>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── Second marquee ── */}
      <div className="overflow-hidden border-y border-border/30 bg-black/30 py-1 mb-0" aria-hidden="true">
        <Marquee reverse pauseOnHover className="[--duration:50s]" repeat={2}>
          {[...activityFeed].reverse().map((msg) => (
            <div key={msg} className="flex items-center gap-2 bg-card/40 border border-border/40 rounded-lg px-4 py-2 mx-2 whitespace-nowrap">
              <span className="text-xs text-foreground">{msg}</span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* ── Final CTA ── */}
      <section id="cta-final" className="px-4 py-20 max-w-lg mx-auto text-center scroll-mt-20">
        <FadeUp className="space-y-5">
          <div className="text-4xl">⚽</div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">
            As vagas estão se esgotando.{" "}
            <span className="text-primary">A sua ainda está aqui.</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Enquanto você lê isso, outros jogadores já estão acumulando pontos de bônus.
            A Copa começa — e o Super Bolão também.
          </p>
          <ShinyButton onClick={openWizard} className="max-w-xs mx-auto py-5 text-[15px] tracking-wide">
            FAZER MEUS PALPITES <ChevronRight className="w-5 h-5" />
          </ShinyButton>
          <p className="text-xs text-muted-foreground">
            Já participante?{" "}
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Fazer login
            </button>
          </p>
        </FadeUp>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 bg-black/30 px-4 py-8 text-center">
        <div className="max-w-lg mx-auto space-y-2">
          <p className="text-sm font-black text-muted-foreground">⚽ Super Bolão da Copa 2026</p>
          <p className="text-xs text-muted-foreground">
            Pagamentos processados com{" "}
            <span className="font-semibold text-foreground">Mercado Pago</span>
          </p>
          <a
            href="/privacidade"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors inline-block"
          >
            Política de Privacidade
          </a>
          <p className="text-[10px] text-muted-foreground/60">
            © {new Date().getFullYear()} Super Bolão — Todos os direitos reservados
          </p>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
