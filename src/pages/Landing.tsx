import { useState } from "react";
import {
  Trophy, Zap, ChevronRight, Shield, Check, Users, Copy, Share2, Gift,
  Lock, Crown, Target, Eye, MapPin, Map, Globe, Swords, Star
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatCPF, formatPhone, validateCPF } from "@/lib/cpf";
import { toast } from "sonner";
import { BRAZILIAN_STATES } from "@/lib/states";
import { RetroGrid } from "@/components/ui/retro-grid";
import { Marquee } from "@/components/ui/marquee";
import { ShinyButton } from "@/components/ui/shiny-button";
import { NumberTicker } from "@/components/ui/number-ticker";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// ─── Animation helpers ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.55, ease: "easeOut" },
  }),
};

const FadeUp = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    variants={fadeUp}
    custom={delay}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
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

type Step = "info" | "payment" | "success";

// ─── Component ────────────────────────────────────────────────────────────────

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>("info");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const referralCode = searchParams.get("ref") || "";
  const [selectedPlan, setSelectedPlan] = useState<"avista" | "parcelado">("avista");
  const [processing, setProcessing] = useState(false);
  const [myReferralLink, setMyReferralLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const handleNextStep = () => {
    if (!fullName.trim() || !email.trim() || !whatsapp.trim() || !cpf.trim() || !birthDate || !password || !state || !city.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (!validateCPF(cpf)) {
      toast.error("CPF inválido.");
      return;
    }
    setStep("payment");
  };

  const handlePay = async () => {
    setProcessing(true);
    try {
      let userId: string | null = null;

      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

      if (authError && authError.message.toLowerCase().includes("already registered")) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw new Error("Email já cadastrado. Verifique a senha.");
        userId = signInData.user?.id ?? null;
      } else if (authError) {
        throw authError;
      } else {
        userId = authData.user?.id ?? null;
      }

      if (!userId) throw new Error("Não foi possível identificar o usuário.");

      let referredById: string | null = null;
      if (referralCode) {
        const { data: refParticipant } = await supabase
          .from("participants")
          .select("id")
          .eq("referral_code", referralCode)
          .maybeSingle();
        referredById = refParticipant?.id ?? null;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const regRes = await fetch(`${supabaseUrl}/functions/v1/register-participant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: supabaseKey },
        body: JSON.stringify({
          userId, fullName: fullName.trim(), email: email.trim(),
          whatsapp: whatsapp.trim(), cpf: cpf.replace(/\D/g, ""),
          birthDate, state, city: city.trim(), plan: selectedPlan, referredById,
        }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || "Erro ao registrar participante.");

      if (regData.referral_code) {
        setMyReferralLink(`${window.location.origin}/?ref=${regData.referral_code}`);
      }

      const planAmount = selectedPlan === "avista" ? 25000 : 30000;
      const planId = selectedPlan === "avista" ? "pro-avista" : "pro-parcelado";

      const prefRes = await fetch(`${supabaseUrl}/functions/v1/create-mp-preference`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: supabaseKey },
        body: JSON.stringify({
          plan: planId, amount: planAmount, userId,
          userEmail: email.trim(), userName: fullName.trim(), userCpf: cpf.replace(/\D/g, ""),
        }),
      });
      const prefData = await prefRes.json();
      if (!prefRes.ok || !prefData.init_point) throw new Error("Erro ao criar pagamento.");

      window.location.href = prefData.init_point;
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar.");
    } finally {
      setProcessing(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ════════════════════════════════════════════════════════════════════
          1. HERO — "O Convite para a Elite"
      ════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center px-4 py-24"
        style={{ background: "var(--gradient-hero)" }}
      >
        <RetroGrid className="opacity-25" />

        {/* Glow orb */}
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
              <NumberTicker
                value={5000000}
                className="text-5xl md:text-7xl font-black"
                style={{ color: "#FFD700" } as any}
              />
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

          {/* Subheadline */}
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
            {user ? (
              <ShinyButton onClick={() => navigate("/jogos")} className="py-5 text-base tracking-wide">
                ACESSAR JOGOS <ChevronRight className="w-5 h-5" />
              </ShinyButton>
            ) : (
              <ShinyButton onClick={scrollToForm} className="py-5 text-[15px] tracking-wide">
                QUERO MEU LUGAR NA ELITE <ChevronRight className="w-5 h-5" />
              </ShinyButton>
            )}
            <p className="text-xs text-muted-foreground">
              Já participante?{" "}
              <button onClick={() => navigate("/auth")} className="underline underline-offset-2 hover:text-foreground transition-colors">
                Fazer login
              </button>
            </p>
          </motion.div>

          {/* Trust row */}
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

      {/* ════════════════════════════════════════════════════════════════════
          ACTIVITY MARQUEE — Social Proof Urgência
      ════════════════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden border-y border-border/40 bg-black/40 py-1">
        <Marquee pauseOnHover className="[--duration:45s]" repeat={3}>
          {activityFeed.map((msg) => (
            <div
              key={msg}
              className="flex items-center gap-2 bg-card/50 border border-border/50 rounded-lg px-4 py-2 mx-2 whitespace-nowrap"
            >
              <span className="text-xs text-foreground">{msg}</span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          2. O CICLO DA VITÓRIA — Como Funciona
      ════════════════════════════════════════════════════════════════════ */}
      <section className="px-4 py-20 max-w-lg mx-auto">
        <FadeUp className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold mb-4"
            style={{ background: "rgba(234,179,8,0.1)", borderColor: "rgba(234,179,8,0.25)", color: "#FFD700" }}>
            <Zap className="w-3 h-3" /> Como funciona
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">O Ciclo da Vitória</h2>
          <p className="text-sm text-muted-foreground mt-2">Três passos simples. Um único destino: o topo.</p>
        </FadeUp>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-[28px] top-10 bottom-10 w-px bg-gradient-to-b from-primary/60 via-primary/20 to-transparent hidden sm:block" />

          <div className="space-y-4">
            {[
              {
                step: "01",
                icon: Target,
                title: "Dê seu Palpite",
                desc: "Escolha os placares dos 104 jogos da Copa do Mundo. Quanto mais preciso, mais pontos você acumula.",
                color: "#FFD700",
                delay: 0,
              },
              {
                step: "02",
                icon: Star,
                title: "Acumule Pontos",
                desc: "Cada acerto te lança para o topo do ranking — local, estadual e nacional. Multiplicadores de fase turbinando.",
                color: "#FFD700",
                delay: 1,
              },
              {
                step: "03",
                icon: Trophy,
                title: "Suba e Ganhe",
                desc: "Seja o premiado do jogo, da rodada ou do dia. Pix, prêmios físicos e a grande bolada da final.",
                color: "#FFD700",
                delay: 2,
              },
            ].map(({ step, icon: Icon, title, desc, color, delay }) => (
              <FadeUp key={step} delay={delay}>
                <div className="flex gap-5 items-start p-5 rounded-2xl border border-border/60 bg-card/40 hover:bg-card/60 transition-colors">
                  <div
                    className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 border"
                    style={{ background: `rgba(234,179,8,0.12)`, borderColor: `rgba(234,179,8,0.3)` }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                    <span className="text-[9px] font-black mt-0.5" style={{ color }}>{step}</span>
                  </div>
                  <div>
                    <h3 className="font-black text-base text-foreground mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          3. AS 3 FORMAS DE DOMINAR — Mecânicas
      ════════════════════════════════════════════════════════════════════ */}
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
              emoji: "🎯",
              title: "Mestres do Placar",
              tag: "Curto Prazo",
              tagColor: "text-green-400",
              tagBg: "bg-green-400/10 border-green-400/20",
              desc: "Pontue por placar exato e vencedor em cada jogo. 82 pontos por acerto perfeito, multiplicados pela fase. Cada partida é uma chance nova.",
              highlight: "82 pts por placar exato",
              border: "border-green-400/20",
              glow: "from-green-500/5",
              delay: 0,
            },
            {
              emoji: "🦅",
              title: "Visão de Águia",
              tag: "Longo Prazo",
              tagColor: "text-blue-400",
              tagBg: "bg-blue-400/10 border-blue-400/20",
              desc: "Bônus massivos para quem acertar Campeão, Artilheiro e Finalistas antes da Copa começar. Uma aposta. Um jackpot.",
              highlight: "Bônus de até 10x na final",
              border: "border-blue-400/20",
              glow: "from-blue-500/5",
              delay: 1,
            },
            {
              emoji: "👥",
              title: "Comandante de Tropa",
              tag: "Indicação",
              tagColor: "text-primary",
              tagBg: "bg-primary/10 border-primary/20",
              desc: "Ganhe pontos extras por cada amigo que entrar no bolão. Quanto maior a sua tropa, maior o seu impacto no ranking — e no prêmio.",
              highlight: "+200 pts por indicação confirmada",
              border: "border-primary/20",
              glow: "from-primary/5",
              delay: 2,
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

      {/* ════════════════════════════════════════════════════════════════════
          4. COMPETIÇÃO LOCAL E GLOBAL — Rankings
      ════════════════════════════════════════════════════════════════════ */}
      <section
        className="px-4 py-20"
        style={{ background: "linear-gradient(180deg, transparent 0%, rgba(234,179,8,0.04) 50%, transparent 100%)" }}
      >
        <div className="max-w-lg mx-auto">
          <FadeUp className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold mb-4"
              style={{ background: "rgba(234,179,8,0.1)", borderColor: "rgba(234,179,8,0.25)", color: "#FFD700" }}>
              <Globe className="w-3 h-3" /> Múltiplas frentes
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground">Competição Local e Global</h2>
            <p className="text-sm text-muted-foreground mt-2">Você compete em três frentes ao mesmo tempo — do bairro ao Brasil.</p>
          </FadeUp>

          <div className="grid grid-cols-1 gap-3">
            {[
              {
                icon: MapPin,
                emoji: "🏙️",
                title: "Ranking da sua Cidade",
                example: "Seja o #1 de Londrina",
                desc: "Mostre para todo mundo da sua cidade que você entende de futebol mais do que ninguém.",
                color: "text-emerald-400",
                border: "border-emerald-400/20",
                bg: "from-emerald-500/5",
                delay: 0,
              },
              {
                icon: Map,
                emoji: "🗺️",
                title: "Ranking do seu Estado",
                example: "Domine o Paraná",
                desc: "Seu estado inteiro vai saber quem é o maior especialista em palpites desta Copa.",
                color: "text-blue-400",
                border: "border-blue-400/20",
                bg: "from-blue-500/5",
                delay: 1,
              },
              {
                icon: Globe,
                emoji: "🇧🇷",
                title: "Ranking Geral",
                example: "Dispute R$ 5 Milhões",
                desc: "A arena máxima. Você contra o Brasil inteiro. O topo paga R$ 5 milhões em prêmios.",
                color: "text-primary",
                border: "border-primary/25",
                bg: "from-primary/8",
                delay: 2,
              },
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

      {/* ════════════════════════════════════════════════════════════════════
          5. SOCIAL & GRUPOS — "Crie sua própria Arena"
      ════════════════════════════════════════════════════════════════════ */}
      <section className="px-4 py-20 max-w-lg mx-auto">
        <FadeUp>
          <div className="rounded-3xl border border-border/60 bg-card/30 overflow-hidden">
            {/* Header bar */}
            <div
              className="px-6 py-4 border-b border-border/40 flex items-center gap-3"
              style={{ background: "rgba(234,179,8,0.06)" }}
            >
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
                  Desafie quem você{" "}
                  <span style={{ color: "#FFD700" }}>quiser.</span>
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Além do prêmio oficial da plataforma, você pode criar grupos exclusivos
                  para competir com quem quiser — amigos, família, colegas de trabalho.
                  Sua competição, suas regras, suas apostas.
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

              <div
                className="flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{ background: "rgba(234,179,8,0.06)", borderColor: "rgba(234,179,8,0.2)" }}
              >
                <Eye className="w-4 h-4 flex-shrink-0" style={{ color: "#FFD700" }} />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Personalize sua competição privada dentro da plataforma. Ranking exclusivo do grupo, histórico de partidas e muito mais.
                </p>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          6. BANNER VIRAL — JBL
      ════════════════════════════════════════════════════════════════════ */}
      <section className="px-4 pb-20 max-w-lg mx-auto">
        <FadeUp>
          <div
            className="relative overflow-hidden rounded-3xl border p-8 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(234,179,8,0.15) 0%, rgba(234,179,8,0.05) 60%, rgba(0,0,0,0.2) 100%)",
              borderColor: "rgba(234,179,8,0.4)",
            }}
          >
            {/* Background glow */}
            <div
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[80px] pointer-events-none"
              style={{ background: "rgba(234,179,8,0.2)" }}
            />

            <div className="relative z-10 space-y-4">
              <div className="text-5xl mb-2">🎧</div>

              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold"
                style={{ background: "rgba(234,179,8,0.15)", borderColor: "rgba(234,179,8,0.4)", color: "#FFD700" }}
              >
                <Gift className="w-3 h-3" /> Recompensa garantida
              </div>

              <h2
                className="text-3xl md:text-4xl font-black leading-tight"
                style={{ color: "#FFD700" }}
              >
                TROQUE 10 AMIGOS<br />POR UMA JBL
              </h2>

              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Convide 10 amigos para a elite e, assim que eles confirmarem,{" "}
                <span className="text-foreground font-bold">você ganha um fone JBL na hora.</span>
                {" "}Sem sorteio. Sem enrolação.
              </p>

              <div className="flex items-center justify-center gap-6 pt-2">
                {["✅ Automático", "⚡ Instantâneo", "🎁 Garantido"].map((item) => (
                  <span key={item} className="text-xs font-bold text-foreground">{item}</span>
                ))}
              </div>

              <ShinyButton onClick={scrollToForm} className="max-w-xs mx-auto py-4 mt-2">
                QUERO MINHA JBL <ChevronRight className="w-4 h-4" />
              </ShinyButton>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECOND ACTIVITY MARQUEE
      ════════════════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden border-y border-border/30 bg-black/30 pb-1 pt-1 mb-0">
        <Marquee reverse pauseOnHover className="[--duration:50s]" repeat={3}>
          {[...activityFeed].reverse().map((msg) => (
            <div
              key={msg}
              className="flex items-center gap-2 bg-card/40 border border-border/40 rounded-lg px-4 py-2 mx-2 whitespace-nowrap"
            >
              <span className="text-xs text-foreground">{msg}</span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          CTA PRE-FORM
      ════════════════════════════════════════════════════════════════════ */}
      <section className="px-4 py-16 max-w-lg mx-auto text-center">
        <FadeUp className="space-y-4">
          <div className="text-4xl">⚽</div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">
            As vagas estão se esgotando.{" "}
            <span style={{ color: "#FFD700" }}>A sua ainda está aqui.</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Enquanto você lê isso, outros jogadores já estão acumulando pontos de bônus.
            A Copa começa — e o Super Bolão também.
          </p>
          {!user && (
            <ShinyButton onClick={scrollToForm} className="max-w-xs mx-auto py-5 text-[15px] tracking-wide mt-2">
              GARANTIR MINHA VAGA AGORA <ChevronRight className="w-5 h-5" />
            </ShinyButton>
          )}
        </FadeUp>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          FORM / CADASTRO
      ════════════════════════════════════════════════════════════════════ */}
      <div id="cadastro" className="px-4 pb-28 max-w-lg mx-auto">

        {step === "info" && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <div
              className="rounded-3xl border p-1"
              style={{ borderColor: "rgba(234,179,8,0.3)", background: "rgba(234,179,8,0.04)" }}
            >
              <Card className="border-0 bg-transparent shadow-none">
                <CardContent className="pt-8 pb-8 space-y-5 px-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl">🏆</div>
                    <h2 className="text-2xl font-black text-foreground">Entre para a Elite</h2>
                    <p className="text-xs text-muted-foreground">Preencha seus dados abaixo e garanta sua vaga</p>
                  </div>

                  <div className="space-y-3">
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome Completo" className="h-11" />
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="h-11" />
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className="h-11" />
                    <Input value={whatsapp} onChange={(e) => setWhatsapp(formatPhone(e.target.value))} placeholder="WhatsApp" className="h-11" />
                    <Input value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} placeholder="CPF" className="h-11" />
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Data de nascimento</label>
                      <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="h-11" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Estado (UF)</option>
                        {BRAZILIAN_STATES.map((s) => <option key={s.uf} value={s.uf}>{s.uf} — {s.name}</option>)}
                      </select>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" className="h-11" />
                    </div>
                  </div>

                  <ShinyButton onClick={handleNextStep} className="w-full py-5 text-[15px] tracking-wide">
                    CONTINUAR <ChevronRight className="w-4 h-4" />
                  </ShinyButton>

                  <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
                    <Lock className="w-3 h-3" /> Seus dados estão protegidos e criptografados
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {step === "payment" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div
              className="rounded-3xl border p-1"
              style={{ borderColor: "rgba(234,179,8,0.3)", background: "rgba(234,179,8,0.04)" }}
            >
              <Card className="border-0 bg-transparent shadow-none">
                <CardContent className="pt-8 pb-8 space-y-5 px-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl">💳</div>
                    <h2 className="text-2xl font-black text-foreground">Escolha seu Plano</h2>
                    <p className="text-xs text-muted-foreground">Acesso completo aos 104 jogos + todos os prêmios</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {(["avista", "parcelado"] as const).map((plan) => (
                      <button
                        key={plan}
                        onClick={() => setSelectedPlan(plan)}
                        className={cn(
                          "rounded-2xl border p-5 text-left transition-all",
                          selectedPlan === plan
                            ? "border-primary/50 bg-primary/10"
                            : "border-border/60 bg-card/40"
                        )}
                      >
                        <div className="font-black text-sm text-foreground mb-1">
                          {plan === "avista" ? "À Vista" : "Parcelado"}
                        </div>
                        <div className="text-lg font-black" style={{ color: "#FFD700" }}>
                          {plan === "avista" ? "R$ 250" : "3× R$ 100"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {plan === "avista" ? "Pagamento único" : "3 parcelas mensais"}
                        </div>
                        {plan === "avista" && (
                          <div className="text-xs font-bold mt-2" style={{ color: "#FFD700" }}>★ Melhor valor</div>
                        )}
                      </button>
                    ))}
                  </div>

                  <ShinyButton onClick={handlePay} disabled={processing} className="w-full py-5 text-[15px] tracking-wide">
                    {processing ? "Processando..." : "CONFIRMAR E PAGAR"}
                  </ShinyButton>

                  <button onClick={() => setStep("info")} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
                    ← Voltar ao cadastro
                  </button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <div
              className="rounded-3xl border p-1"
              style={{ borderColor: "rgba(234,179,8,0.3)", background: "rgba(234,179,8,0.04)" }}
            >
              <Card className="border-0 bg-transparent shadow-none">
                <CardContent className="pt-8 pb-8 text-center space-y-5 px-6">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2"
                    style={{ background: "rgba(234,179,8,0.15)", borderColor: "rgba(234,179,8,0.5)" }}
                  >
                    <Check className="w-10 h-10" style={{ color: "#FFD700" }} />
                  </div>
                  <h2 className="text-2xl font-black text-foreground">Bem-vindo à Elite!</h2>
                  <p className="text-sm text-muted-foreground">
                    Verifique seu e-mail para confirmar a conta. Após confirmar, acesse os jogos e faça seus palpites!
                  </p>

                  {myReferralLink && (
                    <div
                      className="rounded-2xl border p-4 text-left space-y-3"
                      style={{ background: "rgba(234,179,8,0.06)", borderColor: "rgba(234,179,8,0.25)" }}
                    >
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4" style={{ color: "#FFD700" }} />
                        <span className="text-xs font-black text-foreground">Seu link de indicação</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Compartilhe e ganhe +200 pts por cada amigo que confirmar!</p>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-background rounded-lg px-3 py-2 text-xs text-muted-foreground truncate font-mono border border-border">
                          {myReferralLink}
                        </div>
                        <button
                          onClick={() => { navigator.clipboard.writeText(myReferralLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }}
                          className="p-2.5 rounded-lg bg-primary text-primary-foreground flex-shrink-0"
                        >
                          {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({ title: "Super Bolão Copa 2026", text: "Entre no Super Bolão da Copa e concorra a R$ 5 Milhões! 🏆⚽", url: myReferralLink });
                            } else {
                              navigator.clipboard.writeText(myReferralLink);
                            }
                          }}
                          className="p-2.5 rounded-lg bg-secondary text-secondary-foreground flex-shrink-0"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <ShinyButton onClick={() => navigate("/jogos")} className="w-full py-5">
                    VER JOGOS <ChevronRight className="w-4 h-4" />
                  </ShinyButton>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Landing;
