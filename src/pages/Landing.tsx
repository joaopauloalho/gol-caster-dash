import { useState, useEffect } from "react";
import { Trophy, Zap, ChevronRight, Shield, CreditCard, QrCode, Users, Star, MapPin, Share2, MessageCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatCPF, formatPhone, validateCPF, calculateAge } from "@/lib/cpf";
import { toast } from "sonner";
import { BRAZILIAN_STATES, type BrazilianState } from "@/lib/states";

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

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  // Referral
  const referralCode = searchParams.get("ref") || "";

  // Payment
  const [selectedPlan, setSelectedPlan] = useState<"avista" | "parcelado">("avista");
  const [processing, setProcessing] = useState(false);

  const handleNextStep = () => {
    if (!fullName.trim() || !email.trim() || !whatsapp.trim() || !cpf.trim() || !birthDate || !password || !state || !city.trim()) {
      toast.error("Preencha todos os campos, incluindo Estado e Cidade.");
      return;
    }
    if (!validateCPF(cpf)) {
      toast.error("CPF inválido. Verifique os dígitos.");
      return;
    }
    const age = calculateAge(birthDate);
    if (age < 18) {
      toast.error("Você precisa ter pelo menos 18 anos para participar.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setStep("payment");
  };

  const handlePay = async () => {
    setProcessing(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Erro ao criar conta.");

      // Find referrer if code provided
      let referredById: string | null = null;
      if (referralCode) {
        const { data: referrer } = await supabase
          .from("participants")
          .select("id")
          .eq("referral_code", referralCode)
          .maybeSingle();
        if (referrer) {
          referredById = referrer.id;
        }
      }

      const { error: partError } = await supabase.from("participants").insert({
        user_id: userId,
        full_name: fullName.trim(),
        email: email.trim(),
        whatsapp: whatsapp.replace(/\D/g, ""),
        cpf: cpf.replace(/\D/g, ""),
        birth_date: birthDate,
        payment_confirmed: true,
        plan: selectedPlan === "avista" ? "pro-avista" : "pro-parcelado",
        amount: selectedPlan === "avista" ? 25000 : 30000,
        state,
        city: city.trim(),
        ...(referredById ? { referred_by: referredById } : {}),
      });
      if (partError) throw partError;

      // Give referrer bonus points
      if (referredById) {
        await supabase
          .from("participants")
          .update({ bonus_points: 50 } as any)
          .eq("id", referredById)
          .then(() => {});
      }

      await supabase.from("subscriptions").insert({
        user_id: userId,
        plan: selectedPlan === "avista" ? "pro-avista" : "pro-parcelado",
        payment_status: "active",
        amount: selectedPlan === "avista" ? 25000 : 30000,
      });

      setStep("success");
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-secondary blur-3xl" />
        </div>
        <div className="relative z-10 px-4 pt-12 pb-8 text-center max-w-lg mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-4">
            <Zap className="w-3 h-3" /> Copa do Mundo 2026
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight text-foreground">
            CONCORRA A{" "}
            <span className="text-gradient-gold">R$ 1 MILHÃO</span>
            <br />
            EM PRÊMIOS
          </h1>
          <p className="text-muted-foreground text-sm mt-3 max-w-sm mx-auto">
            Faça seus palpites em 104 jogos da Copa. Acumule pontos, escale o ranking e leve prêmios incríveis.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 px-4 -mt-4 relative z-10 max-w-lg mx-auto">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
            <Icon className="w-4 h-4 mx-auto text-primary mb-1" />
            <div className="text-lg font-black text-foreground">{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Prizes */}
      <div className="px-4 mt-6 max-w-lg mx-auto">
        <h2 className="text-lg font-black text-foreground mb-3">🏆 Premiação</h2>
        <div className="space-y-2">
          {prizes.map(({ emoji, label, highlight }) => (
            <div key={label} className={`flex items-center gap-3 p-3 rounded-xl ${highlight ? "bg-primary/10 border border-primary/20" : "bg-card border border-border"}`}>
              <span className="text-2xl">{emoji}</span>
              <span className={`font-bold text-sm ${highlight ? "text-primary" : "text-foreground"}`}>{label}</span>
              {highlight && (
                <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  PRÊMIO PRINCIPAL
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form / Payment / Success */}
      <div className="px-4 mt-8 max-w-lg mx-auto">
        {step === "info" && (
          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center mb-2">
                <Shield className="w-8 h-8 mx-auto text-primary mb-2" />
                <h2 className="text-xl font-black text-foreground">Inscreva-se Agora</h2>
                <p className="text-xs text-muted-foreground">Preencha seus dados para participar</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Nome Completo</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="João da Silva" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">E-mail</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Senha</label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">WhatsApp</label>
                  <Input value={whatsapp} onChange={(e) => setWhatsapp(formatPhone(e.target.value))} placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">CPF</label>
                  <Input value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Data de Nascimento</label>
                  <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="text-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Estado</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Selecione</option>
                      {BRAZILIAN_STATES.map((s) => (
                        <option key={s.uf} value={s.uf}>{s.uf} - {s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Cidade</label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo" />
                  </div>
                </div>
              </div>

              <Button onClick={handleNextStep} className="w-full btn-gold py-3 rounded-xl font-black text-sm h-auto">
                Continuar para Pagamento <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "payment" && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <CreditCard className="w-8 h-8 mx-auto text-primary mb-2" />
              <h2 className="text-xl font-black text-foreground">Escolha seu Plano</h2>
              <p className="text-xs text-muted-foreground">Selecione a forma de pagamento</p>
            </div>

            <Card
              className={`cursor-pointer transition-all ${selectedPlan === "avista" ? "ring-2 ring-primary border-primary" : "border-border hover:border-primary/50"}`}
              onClick={() => setSelectedPlan("avista")}
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <QrCode className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">MELHOR PREÇO</span>
                    </div>
                    <div className="text-2xl font-black text-foreground">R$ 250<span className="text-sm font-bold text-muted-foreground">,00</span></div>
                    <div className="text-xs text-muted-foreground">PIX ou Cartão — pagamento único</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === "avista" ? "border-primary bg-primary" : "border-border"}`}>
                    {selectedPlan === "avista" && <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all ${selectedPlan === "parcelado" ? "ring-2 ring-primary border-primary" : "border-border hover:border-primary/50"}`}
              onClick={() => setSelectedPlan("parcelado")}
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-secondary" />
                      <span className="text-xs font-bold text-secondary">PARCELADO</span>
                    </div>
                    <div className="text-2xl font-black text-foreground">3x R$ 100<span className="text-sm font-bold text-muted-foreground">,00</span></div>
                    <div className="text-xs text-muted-foreground">Cartão de crédito — total R$ 300</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === "parcelado" ? "border-primary bg-primary" : "border-border"}`}>
                    {selectedPlan === "parcelado" && <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handlePay}
              disabled={processing}
              className="w-full btn-gold py-4 rounded-xl font-black text-base h-auto"
            >
              {processing ? "Processando..." : "💳 Pagar e Entrar no Jogo"}
            </Button>

            <button onClick={() => setStep("info")} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Voltar e editar dados
            </button>

            <p className="text-center text-[10px] text-muted-foreground">
              🔒 Pagamento simulado para testes. Integração Stripe em breve.
            </p>
          </div>
        )}

        {step === "success" && (
          <Card className="border-secondary/30">
            <CardContent className="pt-6 pb-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="text-xl font-black text-foreground">Pagamento Confirmado! 🎉</h2>
              <p className="text-sm text-muted-foreground">
                Verifique seu e-mail <strong className="text-foreground">{email}</strong> para ativar sua conta e liberar seus palpites.
              </p>
              <Button onClick={() => navigate("/auth")} className="btn-gold rounded-xl font-bold">
                Ir para Login
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* How it works */}
      <div className="px-4 mt-8 max-w-lg mx-auto">
        <h2 className="text-lg font-black text-foreground mb-4">⚡ Como Funciona</h2>
        <div className="space-y-3">
          {[
            { step: "1", title: "Preencha seus dados", desc: "Nome, CPF, WhatsApp, Estado e Cidade" },
            { step: "2", title: "Escolha o pagamento", desc: "PIX à vista ou parcelado no cartão" },
            { step: "3", title: "Faça 8 palpites por jogo", desc: "Placar, goleador, cartões e mais" },
            { step: "4", title: "Suba no ranking", desc: "Top 1 leva a Hilux!" },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-center gap-4 bg-card border border-border rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-black text-sm flex items-center justify-center flex-shrink-0">
                {step}
              </div>
              <div>
                <div className="font-bold text-sm text-foreground">{title}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multipliers */}
      <div className="px-4 mt-8 max-w-lg mx-auto">
        <h2 className="text-lg font-black text-foreground mb-4">🔥 Multiplicadores</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { phase: "Fase de Grupos", multi: "1.0x", color: "text-muted-foreground" },
            { phase: "Oitavas/Quartas", multi: "2.5x", color: "text-secondary" },
            { phase: "Semifinais", multi: "5.0x", color: "text-primary" },
            { phase: "Grande Final", multi: "10x", color: "text-primary" },
          ].map(({ phase, multi, color }) => (
            <div key={phase} className="bg-card border border-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-black ${color}`}>{multi}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{phase}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Landing;
