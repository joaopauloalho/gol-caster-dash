import { useState } from "react";
import { Trophy, Zap, ChevronRight, Shield, Check, Users, Star, Copy, Share2, Gift } from "lucide-react";
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
import { cn } from "@/lib/utils";

const prizes = [
  { emoji: "🚗", label: "Toyota Hilux 0km", highlight: true },
  { emoji: "📱", label: "iPhones 16 Pro" },
  { emoji: "🏍️", label: "Motos Honda" },
  { emoji: "🎧", label: "Alexas (Gabarito Supremo)" },
  { emoji: "🎮", label: "Gift Cards & Vouchers" },
];

const stats = [
  { icon: Trophy, value: "104", label: "Jogos" },
  { icon: Star, value: "82", label: "Pts/Jogo" },
  { icon: Users, value: "10K+", label: "Jogadores" },
  { icon: Zap, value: "10x", label: "Multi Final" },
];

type Step = "info" | "payment" | "success";

const Landing = () => {
  const navigate = useNavigate();
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
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Usuário não criado.");

      // Resolve referred_by participant id from referral code
      let referredById: string | null = null;
      if (referralCode) {
        const { data: refParticipant } = await supabase
          .from("participants")
          .select("id")
          .eq("referral_code", referralCode)
          .maybeSingle();
        referredById = refParticipant?.id ?? null;
      }

      const { error: participantError } = await supabase.from("participants").insert({
        user_id: userId,
        full_name: fullName.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim(),
        cpf: cpf.replace(/\D/g, ""),
        birth_date: birthDate,
        state,
        city: city.trim(),
        plan: selectedPlan,
        referred_by: referredById,
        payment_confirmed: false,
      });
      if (participantError) throw participantError;

      // Busca o referral_code gerado pelo trigger
      const { data: newParticipant } = await supabase
        .from("participants")
        .select("referral_code")
        .eq("user_id", userId)
        .maybeSingle();
      if (newParticipant?.referral_code) {
        setMyReferralLink(`${window.location.origin}/?ref=${newParticipant.referral_code}`);
      }

      setStep("success");
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden min-h-[450px] flex flex-col items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <RetroGrid className="opacity-40" />
        <div className="relative z-10 px-4 pt-12 pb-8 text-center max-w-lg mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-4">
            <Zap className="w-3 h-3" /> Copa do Mundo 2026
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight text-foreground">
            CONCORRA A <span className="text-gradient-gold">R$ 1 MILHÃO</span> EM PRÊMIOS
          </h1>
          <p className="text-muted-foreground text-sm mt-3 max-w-sm mx-auto">
            Faça seus palpites em 104 jogos da Copa. Acumule pontos e leve prêmios incríveis.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 px-4 -mt-10 relative z-20 max-w-lg mx-auto">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center shadow-xl">
            <Icon className="w-4 h-4 mx-auto text-primary mb-1" />
            <div className="text-lg font-black text-foreground">{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Marquee de Prêmios */}
      <div className="mt-12 overflow-hidden">
        <Marquee pauseOnHover className="[--duration:30s] py-4 bg-black/20 border-y border-border/50">
          {prizes.map(({ emoji, label, highlight }) => (
            <div key={label} className={cn("flex items-center gap-4 px-6 py-4 rounded-2xl mx-2 min-w-[260px] border", highlight ? "bg-primary/10 border-primary/30" : "bg-card/50 border-border")}>
              <span className="text-4xl">{emoji}</span>
              <span className={cn("font-black text-base", highlight ? "text-primary" : "text-foreground")}>{label}</span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* MGM — Indique e Ganhe */}
      <div className="px-4 mt-12 max-w-lg mx-auto">
        <div className="bg-card border border-primary/20 rounded-2xl p-6 space-y-5">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-3">
              <Gift className="w-3 h-3" /> Programa de Indicação
            </div>
            <h2 className="text-xl font-black text-foreground">Indique e Ganhe Pontos</h2>
            <p className="text-xs text-muted-foreground mt-1">Sem limite — cada amigo vale pontos extras na classificação</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: "📤", title: "Compartilhe", desc: "Seu link único" },
              { icon: "✅", title: "Amigo paga", desc: "+200 pts para você" },
              { icon: "🎯", title: "10 palpites", desc: "+100 pts bônus" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="text-center bg-muted/50 rounded-xl p-3">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs font-black text-foreground">{title}</div>
                <div className="text-[10px] text-primary font-bold mt-0.5">{desc}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
            <div>
              <div className="text-sm font-black text-foreground">Sem limite de indicações</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Quanto mais você indica, mais sobe no ranking</div>
            </div>
            <div className="text-3xl font-black text-primary">∞</div>
          </div>
        </div>
      </div>

      {/* Form / Cadastro */}
      <div className="px-4 mt-8 max-w-lg mx-auto">
        {step === "info" && (
          <Card className="border-primary/20 shadow-2xl">
            <CardContent className="pt-8 space-y-4">
              <div className="text-center mb-6">
                <Shield className="w-10 h-10 mx-auto text-primary mb-2" />
                <h2 className="text-2xl font-black">Inscreva-se Agora</h2>
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
              <ShinyButton onClick={handleNextStep} className="w-full bg-primary py-6">
                CONTINUAR <ChevronRight className="w-4 h-4 ml-2" />
              </ShinyButton>
            </CardContent>
          </Card>
        )}
        {step === "payment" && (
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
                      selectedPlan === plan
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card"
                    )}
                  >
                    <div className="font-black text-sm text-foreground">
                      {plan === "avista" ? "À Vista" : "Parcelado"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {plan === "avista" ? "R$ 250 único" : "3× R$ 100"}
                    </div>
                  </button>
                ))}
              </div>
              <ShinyButton onClick={handlePay} disabled={processing} className="w-full bg-primary py-6">
                {processing ? "Processando..." : "CONFIRMAR INSCRIÇÃO"}
              </ShinyButton>
              <button
                onClick={() => setStep("info")}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                ← Voltar
              </button>
            </CardContent>
          </Card>
        )}

        {step === "success" && (
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
                  <p className="text-[10px] text-muted-foreground">Compartilhe e ganhe +200 pts por cada amigo que pagar!</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-background rounded-lg px-3 py-2 text-[10px] text-muted-foreground truncate font-mono border border-border">
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
                          navigator.share({ title: "Bolão Copa 2026", text: "Entre no Bolão da Copa e concorra a R$ 1 Milhão! 🏆⚽", url: myReferralLink });
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

              <ShinyButton onClick={() => navigate("/jogos")} className="w-full bg-primary py-5">
                VER JOGOS
              </ShinyButton>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Landing;
