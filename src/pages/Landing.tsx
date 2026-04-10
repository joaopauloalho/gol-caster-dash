import { useState } from "react";
import { Trophy, Zap, ChevronRight, Shield, Check, Users, Star, Copy, Share2, Gift, Lock, TrendingUp, Crown } from "lucide-react";
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
import { WordRotate } from "@/components/ui/word-rotate";
import { NumberTicker } from "@/components/ui/number-ticker";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// --- Data ---

const winnerMessages = [
  { name: "Lucas S.", city: "São Paulo/SP", msg: "Acertei o placar exato! 🎉", pts: "+82 pts" },
  { name: "Mariana C.", city: "Belo Horizonte/MG", msg: "Gabarito supremo no Brasil x México!", pts: "+350 pts" },
  { name: "Rafael T.", city: "Curitiba/PR", msg: "Subi 12 posições hoje! 🚀", pts: "+210 pts" },
  { name: "Ana L.", city: "Recife/PE", msg: "Indiquei 3 amigos e ganhei bônus!", pts: "+600 pts" },
  { name: "Carlos M.", city: "Porto Alegre/RS", msg: "Meu palpite foi certeiro no Egito x Senegal", pts: "+164 pts" },
  { name: "Juliana R.", city: "Fortaleza/CE", msg: "Estou no top 10 do meu estado! 🏆", pts: "+420 pts" },
  { name: "Pedro A.", city: "Manaus/AM", msg: "Primeiro gabarito exato! Que jogo foi esse!", pts: "+328 pts" },
];

const bentoCards = [
  {
    icon: Zap,
    color: "text-yellow-400",
    bg: "from-yellow-500/10 to-transparent",
    border: "border-yellow-500/20",
    title: "Prêmios Diários",
    subtitle: "Todo dia tem vencedor",
    desc: "Melhores palpites de cada rodada ganham pontos extras e prêmios surpresa. Você não precisa esperar a Copa terminar.",
    badge: "⚡ Ao vivo",
  },
  {
    icon: Trophy,
    color: "text-primary",
    bg: "from-primary/10 to-transparent",
    border: "border-primary/20",
    title: "Premiação por Jogo",
    subtitle: "104 jogos = 104 chances",
    desc: "Cada partida é uma nova oportunidade. Acerte o placar exato e multiplique seus pontos com o bônus de fase.",
    badge: "🎯 Por jogo",
  },
  {
    icon: Crown,
    color: "text-orange-400",
    bg: "from-orange-500/10 to-transparent",
    border: "border-orange-500/20",
    title: "Grande Jackpot",
    subtitle: "Final da Copa — até R$ 5M",
    desc: "O grande campeão geral leva o prêmio máximo. Quanto mais longe você chegar, maior o prêmio garantido.",
    badge: "👑 Grand Prize",
  },
];

type Step = "info" | "payment" | "success";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

// --- Component ---

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
          userId,
          fullName: fullName.trim(),
          email: email.trim(),
          whatsapp: whatsapp.trim(),
          cpf: cpf.replace(/\D/g, ""),
          birthDate,
          state,
          city: city.trim(),
          plan: selectedPlan,
          referredById,
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
          plan: planId,
          amount: planAmount,
          userId,
          userEmail: email.trim(),
          userName: fullName.trim(),
          userCpf: cpf.replace(/\D/g, ""),
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

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[90vh] flex flex-col items-center justify-center px-4 py-20" style={{ background: "var(--gradient-hero)" }}>
        <RetroGrid className="opacity-30" />

        <div className="relative z-10 max-w-lg mx-auto text-center space-y-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold"
          >
            <Zap className="w-3 h-3" /> Copa do Mundo 2026 — Vagas Limitadas
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-4xl md:text-6xl font-black leading-[1.05] text-foreground">
              <span className="text-gradient-gold">R$</span>{" "}
              <NumberTicker value={5000000} className="text-gradient-gold text-4xl md:text-6xl font-black" />{" "}
              <span className="text-gradient-gold">em Prêmios.</span>
              <br />
              <span className="text-foreground">Sua chance é agora.</span>
            </h1>
          </motion.div>

          {/* Word Rotate */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg font-bold text-primary h-8 flex items-center justify-center"
          >
            <WordRotate
              words={["Todo jogo tem prêmio.", "Todo dia tem vencedor.", "Centenas de chances de ganhar."]}
              className="text-primary"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground text-sm max-w-xs mx-auto"
          >
            Faça palpites em todos os 104 jogos da Copa do Mundo. Acumule pontos, suba no ranking e concorra a prêmios toda rodada.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-3 max-w-xs mx-auto"
          >
            {user ? (
              <ShinyButton onClick={() => navigate("/jogos")} className="py-5 text-base">
                VER JOGOS AGORA <ChevronRight className="w-5 h-5" />
              </ShinyButton>
            ) : (
              <ShinyButton onClick={scrollToForm} className="py-5 text-base">
                QUERO FAZER PARTE E GANHAR <ChevronRight className="w-5 h-5" />
              </ShinyButton>
            )}
            <button
              onClick={scrollToForm}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Já tenho conta — fazer login
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-6 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Pagamento seguro</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Dados protegidos</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 10K+ jogadores</span>
          </motion.div>
        </div>
      </section>

      {/* ── MARQUEE — Vencedores ─────────────────────────────── */}
      <div className="overflow-hidden bg-black/30 border-y border-border/40 py-1">
        <Marquee pauseOnHover className="[--duration:40s]">
          {winnerMessages.map(({ name, city, msg, pts }) => (
            <div
              key={name}
              className="flex items-center gap-3 bg-card/60 border border-border/60 rounded-xl px-5 py-3 mx-2 min-w-[260px]"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-black text-primary flex-shrink-0">
                {name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-foreground truncate">{name} · {city}</div>
                <div className="text-xs text-muted-foreground truncate">{msg}</div>
              </div>
              <div className="text-xs font-black text-primary flex-shrink-0">{pts}</div>
            </div>
          ))}
        </Marquee>
      </div>

      {/* ── BENTO — Como Funciona ────────────────────────────── */}
      <section className="px-4 py-16 max-w-lg mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-3">
            <TrendingUp className="w-3 h-3" /> Como ganhar
          </div>
          <h2 className="text-2xl font-black text-foreground">Prêmios em cada etapa</h2>
          <p className="text-sm text-muted-foreground mt-1">Você não precisa ganhar tudo — cada acerto vale.</p>
        </motion.div>

        <div className="space-y-3">
          {bentoCards.map(({ icon: Icon, color, bg, border, title, subtitle, desc, badge }, i) => (
            <motion.div
              key={title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className={cn(
                "rounded-2xl border p-5 bg-gradient-to-br",
                bg,
                border
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn("p-2.5 rounded-xl bg-card/60 flex-shrink-0")}>
                  <Icon className={cn("w-5 h-5", color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-black text-foreground text-sm">{title}</span>
                    <span className="text-xs bg-card/80 border border-border/60 rounded-full px-2 py-0.5 text-muted-foreground">{badge}</span>
                  </div>
                  <div className={cn("text-xs font-bold mb-1.5", color)}>{subtitle}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PRÊMIOS FÍSICOS ──────────────────────────────────── */}
      <section className="overflow-hidden pb-10">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center px-4 mb-6"
        >
          <h2 className="text-2xl font-black text-foreground">Prêmios que você pode levar</h2>
          <p className="text-sm text-muted-foreground mt-1">Além dos prêmios em dinheiro, concorra a prêmios físicos incríveis</p>
        </motion.div>

        <Marquee pauseOnHover className="[--duration:25s] py-2" repeat={3}>
          {[
            { emoji: "🚗", label: "Toyota Hilux 0km", highlight: true },
            { emoji: "📱", label: "iPhone 16 Pro" },
            { emoji: "🏍️", label: "Honda CG 160" },
            { emoji: "🎧", label: "Alexa Echo" },
            { emoji: "🎮", label: "Gift Cards" },
            { emoji: "✈️", label: "Pacote de viagem" },
            { emoji: "💻", label: "MacBook Air" },
          ].map(({ emoji, label, highlight }) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-3 px-5 py-3.5 rounded-2xl mx-1.5 border min-w-[200px]",
                highlight ? "bg-primary/10 border-primary/30" : "bg-card/50 border-border/50"
              )}
            >
              <span className="text-3xl">{emoji}</span>
              <span className={cn("font-black text-sm", highlight ? "text-primary" : "text-foreground")}>{label}</span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* ── MGM — Indique e Ganhe ────────────────────────────── */}
      <section className="px-4 pb-16 max-w-lg mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-card border border-primary/20 rounded-2xl p-6 space-y-5"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-3">
              <Gift className="w-3 h-3" /> Programa de Indicação
            </div>
            <h2 className="text-xl font-black text-foreground">Indique e Ganhe Pontos</h2>
            <p className="text-xs text-muted-foreground mt-1">Sem limite — cada amigo vale pontos extras na classificação</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: "📤", title: "Compartilhe", desc: "+seu link único" },
              { icon: "✅", title: "Amigo paga", desc: "+200 pts para você" },
              { icon: "🎯", title: "10 palpites", desc: "+100 pts bônus" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="text-center bg-muted/50 rounded-xl p-3">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs font-black text-foreground">{title}</div>
                <div className="text-xs text-primary font-bold mt-0.5">{desc}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
            <div>
              <div className="text-sm font-black text-foreground">Sem limite de indicações</div>
              <div className="text-xs text-muted-foreground mt-0.5">Quanto mais indica, mais sobe no ranking</div>
            </div>
            <div className="text-3xl font-black text-primary">∞</div>
          </div>
        </motion.div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────── */}
      <section className="px-4 pb-16 max-w-lg mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-4 gap-2"
        >
          {[
            { icon: Trophy, value: "104", label: "Jogos" },
            { icon: Star, value: "82", label: "Pts/Jogo" },
            { icon: Users, value: "10K+", label: "Jogadores" },
            { icon: Zap, value: "10x", label: "Multi Final" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
              <Icon className="w-4 h-4 mx-auto text-primary mb-1" />
              <div className="text-lg font-black text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── CTA ANTES DO FORM ────────────────────────────────── */}
      <section className="px-4 pb-8 max-w-lg mx-auto text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-black text-foreground">
            Vagas se esgotando.{" "}
            <span className="text-gradient-gold">Garanta a sua agora.</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            A inscrição dá acesso a todos os 104 jogos, ranking por cidade e estado, prêmios em cada rodada e o grande jackpot da final.
          </p>
          {!user && (
            <ShinyButton onClick={scrollToForm} className="max-w-xs mx-auto py-5">
              GARANTIR MINHA VAGA <ChevronRight className="w-5 h-5" />
            </ShinyButton>
          )}
        </motion.div>
      </section>

      {/* ── FORM / CADASTRO ──────────────────────────────────── */}
      <div id="cadastro" className="px-4 pb-24 max-w-lg mx-auto">
        {step === "info" && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-primary/20 shadow-2xl">
              <CardContent className="pt-8 space-y-4">
                <div className="text-center mb-6">
                  <Shield className="w-10 h-10 mx-auto text-primary mb-2" />
                  <h2 className="text-2xl font-black">Inscreva-se Agora</h2>
                  <p className="text-xs text-muted-foreground mt-1">Preencha seus dados e escolha o plano</p>
                </div>
                <div className="space-y-3">
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome Completo" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" />
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" />
                  <Input value={whatsapp} onChange={(e) => setWhatsapp(formatPhone(e.target.value))} placeholder="WhatsApp" />
                  <Input value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} placeholder="CPF" />
                  <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={state} onChange={(e) => setState(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">UF</option>
                      {BRAZILIAN_STATES.map((s) => <option key={s.uf} value={s.uf}>{s.uf}</option>)}
                    </select>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" />
                  </div>
                </div>
                <ShinyButton onClick={handleNextStep} className="w-full py-5">
                  CONTINUAR <ChevronRight className="w-4 h-4 ml-2" />
                </ShinyButton>
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> Seus dados estão seguros e protegidos
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "payment" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/20 shadow-2xl">
              <CardContent className="pt-8 space-y-4">
                <div className="text-center mb-6">
                  <Trophy className="w-10 h-10 mx-auto text-primary mb-2" />
                  <h2 className="text-2xl font-black">Escolha seu Plano</h2>
                  <p className="text-xs text-muted-foreground mt-1">Selecione a forma de pagamento</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(["avista", "parcelado"] as const).map((plan) => (
                    <button
                      key={plan}
                      onClick={() => setSelectedPlan(plan)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all",
                        selectedPlan === plan ? "border-primary bg-primary/10" : "border-border bg-card"
                      )}
                    >
                      <div className="font-black text-sm text-foreground">
                        {plan === "avista" ? "À Vista" : "Parcelado"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {plan === "avista" ? "R$ 250 único" : "3× R$ 100"}
                      </div>
                      {plan === "avista" && (
                        <div className="text-xs text-primary font-bold mt-1">✦ Melhor valor</div>
                      )}
                    </button>
                  ))}
                </div>
                <ShinyButton onClick={handlePay} disabled={processing} className="w-full py-5">
                  {processing ? "Processando..." : "CONFIRMAR INSCRIÇÃO"}
                </ShinyButton>
                <button onClick={() => setStep("info")} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
                  ← Voltar
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-primary/20 shadow-2xl">
              <CardContent className="pt-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-black">Inscrição Realizada!</h2>
                <p className="text-sm text-muted-foreground">
                  Verifique seu e-mail para confirmar a conta. Após confirmar, acesse os jogos e faça seus palpites!
                </p>

                {myReferralLink && (
                  <div className="bg-muted/50 border border-primary/20 rounded-xl p-4 text-left space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Gift className="w-4 h-4 text-primary" />
                      <span className="text-xs font-black text-foreground">Seu link de indicação</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Compartilhe e ganhe +200 pts por cada amigo que pagar!</p>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-background rounded-lg px-3 py-2 text-xs text-muted-foreground truncate font-mono border border-border">
                        {myReferralLink}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(myReferralLink);
                          setLinkCopied(true);
                          setTimeout(() => setLinkCopied(false), 2000);
                        }}
                        className="p-2 rounded-lg bg-primary text-primary-foreground"
                      >
                        {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({ title: "Bolão Copa 2026", text: "Entre no Bolão da Copa e concorra a R$ 5 Milhões! 🏆⚽", url: myReferralLink });
                          } else {
                            navigator.clipboard.writeText(myReferralLink);
                          }
                        }}
                        className="p-2 rounded-lg bg-secondary text-secondary-foreground"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <ShinyButton onClick={() => navigate("/jogos")} className="w-full py-5">
                  VER JOGOS
                </ShinyButton>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Landing;
