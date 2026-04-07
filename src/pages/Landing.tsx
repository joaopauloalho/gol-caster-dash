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
import { RetroGrid } from "@/components/ui/retro-grid";
import { Marquee } from "@/components/ui/marquee";
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

      if (referredById) {
        await supabase
          .from("participants")
          .update({ bonus_points: 50 } as any)
          .eq("id", referredById);
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
    <div className="min-h-screen pb-20 bg-background">
      {/* Hero Section com RetroGrid */}
      <div className="relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <RetroGrid className="opacity-40" />
        
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
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center shadow-lg">
            <Icon className="w-4 h-4 mx-auto text-primary mb-1" />
            <div className="text-lg font-black text-foreground">{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Seção de Prêmios com Marquee Infinito */}
      <div className="mt-10 overflow-hidden">
        <h2 className="text-lg font-black text-foreground mb-4 px-4 max-w-lg mx-auto flex items-center gap-2">
          🏆 Prêmios em Jogo
        </h2>
        <Marquee pauseOnHover className="[--duration:30s] py-4 bg-black/20 border-y border-border/50">
          {prizes.map(({ emoji, label, highlight }) => (
            <div 
              key={label} 
              className={cn(
                "flex items-center gap-4 px-6 py-4 rounded-2xl mx-2 min-w-[260px] transition-all",
                highlight 
                  ? "bg-primary/10 border border-primary/30 shadow-[0_0_20px_rgba(255,215,0,0.1)]" 
                  : "bg-card/50 border border-border"
              )}
            >
              <span className="text-4xl">{emoji}</span>
              <div className="flex flex-col">
                <span className={cn("font-black text-base leading-tight", highlight ? "text-primary" : "text-foreground")}>
                  {label}
                </span>
                {highlight && (
                  <span className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mt-1">
                    Prêmio Principal
                  </span>
                )}
              </div>
            </div>
          ))}
        </Marquee>
      </div>

      {/* Form / Payment / Success Sections */}
      <div className="px-4 mt-8 max-w-lg mx-auto">
        {step === "info" && (
          <Card className="border-primary/20 shadow-xl">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center mb-2">
                <Shield className="w-8 h-8 mx-auto text-primary mb-2" />
                <h2 className="text-xl font-black text-foreground">Inscreva-se Agora</h2>
                <p className="text-xs text-muted-foreground">Preencha seus dados para participar</p>
              </div>

              <div className="space-y-3">
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome Completo" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha (min. 6 caracteres)" />
                <Input value={whatsapp} onChange={(e) => setWhatsapp(formatPhone(e.target.value))} placeholder="WhatsApp" />
                <Input value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} placeholder="CPF" />
                <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Estado</option>
                    {BRAZILIAN_STATES.map((s) => (
                      <option key={s.uf} value={s.uf}>{s.uf}</option>
                    ))}
                  </select>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" />
                </div>
              </div>

              <Button onClick={handleNextStep} className="w-full btn-gold py-6 rounded-xl font-black text-sm h-auto">
                Continuar <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "payment" && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <CreditCard className="w-8 h-8 mx-auto text-primary mb-2" />
              <h2 className="text-xl font-black text-foreground">Escolha seu Plano</h2>
            </div>

            <Card className={`cursor-pointer transition-all ${selectedPlan === "avista" ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedPlan("avista")}>
              <CardContent className="pt-5 pb-4 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-black">R$ 250,00</div>
                  <div className="text-xs text-muted-foreground">PIX ou Cartão à vista</div>
                </div>
                {selectedPlan === "avista" && <Zap className="text-primary" />}
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-all ${selectedPlan === "parcelado" ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedPlan("parcelado")}>
              <CardContent className="pt-5 pb-4 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-black">3x R$ 100,00</div>
                  <div className="text-xs text-muted-foreground">Cartão de Crédito</div>
                </div>
                {selectedPlan === "parcelado" && <Zap className="text-primary" />}
              </CardContent>
            </Card>

            <Button onClick={handlePay} disabled={processing} className="w-full btn-gold py-6 rounded-xl font-black text-base h-auto">
              {processing ? "Processando..." : "💳 Pagar e Entrar"}
            </Button>
          </div>
        )}

        {step === "success" && (
          <Card className="text-center p-8 space-y-4">
            <Trophy className="w-12 h-12 text-secondary mx-auto" />
            <h2 className="text-2xl font-black">Quase lá! 🎉</h2>
            <p className="text-sm text-muted-foreground">Enviamos um e-mail para ativar sua conta.</p>
            <Button onClick={() => navigate("/auth")} className="btn-gold w-full">Fazer Login</Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Landing;
