import { useState } from "react";
import {
  Trophy, Zap, ChevronRight, Users, Gift,
  Lock, Crown, Target, Eye, MapPin, Map, Globe, Swords, Star, Shield,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RetroGrid } from "@/components/ui/retro-grid";
import { Marquee } from "@/components/ui/marquee";
import { ShinyButton } from "@/components/ui/shiny-button";
import { NumberTicker } from "@/components/ui/number-ticker";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import OnboardingWizard from "@/components/OnboardingWizard";

// ─── Animation helper ─────────────────────────────────────────────────────────

const FadeUp = ({
  children, delay = 0, className = "",
}: {
  children: React.ReactNode; delay?: number; className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ delay: delay * 0.12, duration: 0.55, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

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
  "💰 @rafa ganhou R$ 180 pela rodada — Gabarito Supremo!",
];

// ─── Component ────────────────────────────────────────────────────────────────

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref") || "";

  // Captura ?group= e persiste no localStorage para sobreviver ao redirect do MP
  const groupCode = searchParams.get("group") || "";
  if (groupCode) localStorage.setItem("pending_group_code", groupCode);

  const [showWizard, setShowWizard] = useState(false);

  const openWizard = () => {
    if (user) { navigate("/jogos"); return; }
    setShowWizard(true);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Onboarding Wizard Overlay ────────────────────────── */}
      <AnimatePresence>
        {showWizard && (
          <OnboardingWizard
            referralCode={referralCode}
            groupInviteCode={groupCode || localStorage.getItem("pending_group_code") || ""}
            onClose={() => setShowWizard(false)}
          />
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════
          HERO — "O Convite para a Elite"
      ════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center px-4 py-24"
        style={{ background: "var(--gradient-hero)" }}
      >
        <RetroGrid className="opacity-25" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-lg mx-auto text-center space-y-7">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold"
            style={{ background: "rgba(234,179,8,0.12)", borderColor: "rgba(234,179,8,0.35)", color: "#FFD700" }}
          >
            <Crown className="w-3.5 h-3.5" /> Copa do Mundo 2026 — Vagas Limitadas
          </motion.div>

          {/* Prize ticker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="space-y-1"
          >
            <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Prêmio Total
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-black" style={{ color: "#FFD700" }}>R$</span>
              <NumberTicker value={5000000} className="text-5xl md:text-7xl font-black" style={{ color: "#FFD700" } as any} />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-3xl md:text-5xl font-black leading-[1.08] text-foreground"
          >
            O Super Bolão vai distribuir{" "}
            <span style={{ color: "#FFD700" }}>R$ 5 Milhões.</span>
            <br />Você está pronto para o{" "}
            <span className="italic" style={{ color: "#FFD700" }}>topo?</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-muted-foreground text-sm md:text-base max-w-sm mx-auto leading-relaxed"
          >
            Centenas de chances de ganhar. Todo jogo vale prêmio, toda rodada vale Pix,{" "}
            <span className="text-foreground font-semibold">todo dia tem um novo campeão.</span>
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-3 max-w-xs mx-auto"
          >
            <ShinyButton onClick={openWizard} className="py-5 text-[15px] tracking-wide">
              QUERO MEU LUGAR NA ELITE <ChevronRight className="w-5 h-5" />
            </ShinyButton>
            <p className="text-xs text-muted-foreground">
              Já participante?{" "}
              <button onClick={() => navigate("/auth")} className="underline underline-offset-2 hover:text-foreground transition-colors">
                Fazer login
              </button>
            </p>
          </motion.div>

          {/* Trust */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-5 text-xs text-muted-foreground pt-2"
          >
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Pagamento seguro</span>
            <span className="w-px h-3 bg-border" />
            <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> CPF protegido</span>
            <span className="w-px h-3 bg-border" />
            <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> +10K jogadores</span>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground"
        >
          <div className="w-px h-8 bg-gradient-to-b from-border to-transparent" />
          <span className="text-[10px] tracking-widest uppercase">Role para baixo</span>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════
          ACTIVITY MARQUEE #1
      ════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden border-y border-border/40 bg-black/40 py-1">
        <Marquee pauseOnHover className="[--duration:45s]" repeat={3}>
          {activityFeed.map((msg) => (
            <div key={msg} className="flex items-center gap-2 bg-card/50 border border-border/50 rounded-lg px-4 py-2 mx-2 whitespace-nowrap">
              <span className="text-xs text-foreground">{msg}</span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* ════════════════════════════════════════════════════════
          O CICLO DA VITÓRIA — 3 passos
      ════════════════════════════════════════════════════════ */}
      <section className="px-4 py-20 max-w-lg mx-auto">
        <FadeUp className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold mb-4"
            style={{ background: "rgba(234,179,8,0.1)", borderColor: "rgba(234,179,8,0.25)", color: "#FFD700" }}>
            <Zap className="w-3 h-3" /> Como funciona
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">O Ciclo da Vitória</h2>
          <p className="text-sm text-muted-foreground mt-2">Três passos simples. Um único destino: o topo.</p>
        </FadeUp>

        <div className="space-y-4">
          {[
            { step: "01", icon: Target, title: "Dê seu Palpite", desc: "Escolha os placares dos 104 jogos da Copa do Mundo. Quanto mais preciso, mais pontos você acumula.", delay: 0 },
            { step: "02", icon: Star, title: "Acumule Pontos", desc: "Cada acerto te lança para o topo do ranking — local, estadual e nacional. Multiplicadores de fase turbinando.", delay: 1 },
            { step: "03", icon: Trophy, title: "Suba e Ganhe", desc: "Seja o premiado do jogo, da rodada ou do dia. Pix, prêmios físicos e a grande bolada da final.", delay: 2 },
          ].map(({ step, icon: Icon, title, desc, delay }) => (
            <FadeUp key={step} delay={delay}>
              <div className="flex gap-5 items-start p-5 rounded-2xl border border-border/60 bg-card/40 hover:bg-card/60 transition-colors">
                <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 border"
                  style={{ background: "rgba(234,179,8,0.12)", borderColor: "rgba(234,179,8,0.3)" }}>
                  <Icon className="w-5 h-5" style={{ color: "#FFD700" }} />
                  <span className="text-[9px] font-black mt-0.5" style={{ color: "#FFD700" }}>{step}</span>
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

      {/* ════════════════════════════════════════════════════════
          AS 3 FORMAS DE DOMINAR
      ════════════════════════════════════════════════════════ */}
      <section className="px-4 pb-20 max-w-lg mx-auto">
        <FadeUp className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold mb-4"
            style={{ background: "rgba(234,179,8,0.1)", borderColor: "rgba(234,179,8,0.25)", color: "#FFD700" }}>
            <Swords className="w-3 h-3" /> Mecânicas de pontuação
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">As 3 Formas de Dominar</h2>
          <p className="text-sm text-muted-foreground mt-2">Escolha sua estratégia — ou use as três ao mesmo tempo.</p>
        </FadeUp>

        <div className="space-y-4">
          {[
            {
              emoji: "🎯", title: "Mestres do Placar", tag: "Curto Prazo",
              tagColor: "text-green-400", tagBg: "bg-green-400/10 border-green-400/20",
              desc: "Pontue por placar exato e vencedor em cada jogo. 82 pontos por acerto perfeito, multiplicados pela fase.",
              highlight: "82 pts por placar exato", border: "border-green-400/20", glow: "from-green-500/5", delay: 0,
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

      {/* ════════════════════════════════════════════════════════
          RANKINGS — Competição Local e Global
      ════════════════════════════════════════════════════════ */}
      <section className="px-4 py-20" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(234,179,8,0.04) 50%, transparent 100%)" }}>
        <div className="max-w-lg mx-auto">
          <FadeUp className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold mb-4"
              style={{ background: "rgba(234,179,8,0.1)", borderColor: "rgba(234,179,8,0.25)", color: "#FFD700" }}>
              <Globe className="w-3 h-3" /> Múltiplas frentes
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground">Competição Local e Global</h2>
            <p className="text-sm text-muted-foreground mt-2">Você compete em três frentes ao mesmo tempo.</p>
          </FadeUp>

          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: MapPin, emoji: "🏙️", title: "Ranking da sua Cidade", example: "Seja o #1 de Londrina", desc: "Mostre para todo mundo da sua cidade que você entende de futebol mais do que ninguém.", color: "text-emerald-400", border: "border-emerald-400/20", bg: "from-emerald-500/5", delay: 0 },
              { icon: Map, emoji: "🗺️", title: "Ranking do seu Estado", example: "Domine o Paraná", desc: "Seu estado inteiro vai saber quem é o maior especialista em palpites desta Copa.", color: "text-blue-400", border: "border-blue-400/20", bg: "from-blue-500/5", delay: 1 },
              { icon: Globe, emoji: "🇧🇷", title: "Ranking Geral", example: "Dispute R$ 5 Milhões", desc: "A arena máxima. Você contra o Brasil inteiro. O topo paga R$ 5 milhões em prêmios.", color: "text-primary", border: "border-primary/25", bg: "from-primary/8", delay: 2 },
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

      {/* ════════════════════════════════════════════════════════
          SOCIAL & GRUPOS
      ════════════════════════════════════════════════════════ */}
      <section className="px-4 py-20 max-w-lg mx-auto">
        <FadeUp>
          <div className="rounded-3xl border border-border/60 bg-card/30 overflow-hidden">
            <div className="px-6 py-4 border-b border-border/40 flex items-center gap-3" style={{ background: "rgba(234,179,8,0.06)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(234,179,8,0.2)" }}>
                <Users className="w-4 h-4" style={{ color: "#FFD700" }} />
              </div>
              <div>
                <div className="font-black text-sm text-foreground">Social & Grupos</div>
                <div className="text-xs text-muted-foreground">Crie sua própria Arena</div>
              </div>
              <div className="ml-auto flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-black text-foreground mb-2">
                  Desafie quem você <span style={{ color: "#FFD700" }}>quiser.</span>
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Crie grupos exclusivos para competir com amigos, família ou colegas de trabalho. Sua competição, suas regras.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "🏠", title: "Família", desc: "Quem sabe mais de futebol em casa?" },
                  { icon: "💼", title: "Trabalho", desc: "Mostre que você é o craque do escritório" },
                  { icon: "🎓", title: "Faculdade", desc: "Turma toda no mesmo bolão" },
                  { icon: "🔒", title: "Privado", desc: "Grupo fechado, só quem você convidar" },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="bg-muted/30 border border-border/50 rounded-xl p-4">
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="font-black text-sm text-foreground">{title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{ background: "rgba(234,179,8,0.06)", borderColor: "rgba(234,179,8,0.2)" }}>
                <Eye className="w-4 h-4 flex-shrink-0" style={{ color: "#FFD700" }} />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ranking exclusivo do grupo, histórico de partidas e muito mais dentro da plataforma.
                </p>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ════════════════════════════════════════════════════════
          BANNER VIRAL — JBL
      ════════════════════════════════════════════════════════ */}
      <section className="px-4 pb-20 max-w-lg mx-auto">
        <FadeUp>
          <div className="relative overflow-hidden rounded-3xl border p-8 text-center"
            style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.15) 0%, rgba(234,179,8,0.05) 60%, rgba(0,0,0,0.2) 100%)", borderColor: "rgba(234,179,8,0.4)" }}>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[80px] pointer-events-none"
              style={{ background: "rgba(234,179,8,0.2)" }} />
            <div className="relative z-10 space-y-4">
              <div className="text-5xl mb-2">🎧</div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold"
                style={{ background: "rgba(234,179,8,0.15)", borderColor: "rgba(234,179,8,0.4)", color: "#FFD700" }}>
                <Gift className="w-3 h-3" /> Recompensa garantida
              </div>
              <h2 className="text-3xl md:text-4xl font-black leading-tight" style={{ color: "#FFD700" }}>
                TROQUE 10 AMIGOS<br />POR UMA JBL
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Convide 10 amigos para a elite e, assim que eles confirmarem,{" "}
                <span className="text-foreground font-bold">você ganha um fone JBL na hora.</span>{" "}
                Sem sorteio. Sem enrolação.
              </p>
              <div className="flex items-center justify-center gap-6 pt-2">
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

      {/* ════════════════════════════════════════════════════════
          ACTIVITY MARQUEE #2 — reverso
      ════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden border-y border-border/30 bg-black/30 py-1 mb-0">
        <Marquee reverse pauseOnHover className="[--duration:50s]" repeat={3}>
          {[...activityFeed].reverse().map((msg) => (
            <div key={msg} className="flex items-center gap-2 bg-card/40 border border-border/40 rounded-lg px-4 py-2 mx-2 whitespace-nowrap">
              <span className="text-xs text-foreground">{msg}</span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* ════════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════════ */}
      <section className="px-4 py-20 max-w-lg mx-auto text-center">
        <FadeUp className="space-y-5">
          <div className="text-4xl">⚽</div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">
            As vagas estão se esgotando.{" "}
            <span style={{ color: "#FFD700" }}>A sua ainda está aqui.</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Enquanto você lê isso, outros jogadores já estão acumulando pontos de bônus.
            A Copa começa — e o Super Bolão também.
          </p>
          <ShinyButton onClick={openWizard} className="max-w-xs mx-auto py-5 text-[15px] tracking-wide">
            GARANTIR MINHA VAGA AGORA <ChevronRight className="w-5 h-5" />
          </ShinyButton>
          <p className="text-xs text-muted-foreground">
            Já participante?{" "}
            <button onClick={() => navigate("/auth")} className="underline underline-offset-2 hover:text-foreground transition-colors">
              Fazer login
            </button>
          </p>
        </FadeUp>
      </section>

    </div>
  );
};

export default Landing;
