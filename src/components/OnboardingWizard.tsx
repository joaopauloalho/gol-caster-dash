import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronRight, ArrowLeft, Check, Copy, Share2,
  User, Mail, Lock, Phone, FileText, Calendar, CreditCard, Gift, Heart, AtSign, Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCPF, formatPhone, validateCPF } from "@/lib/cpf";
import { toast } from "sonner";
import AddressStep from "@/components/AddressStep";
import LgpdNotice from "@/components/LgpdNotice";
import { TeamCombobox } from "@/components/ui/team-combobox";
import { teams } from "@/data/teams";

// ─── Types ────────────────────────────────────────────────────────────────────

type WizardStep = "name" | "username" | "contact" | "whatsapp" | "document" | "address" | "team" | "plan" | "success";

interface AddressData {
  cep: string; logradouro: string; bairro: string;
  cidade: string; uf: string; numero: string; complemento: string;
}

interface OnboardingWizardProps {
  onClose: () => void;
  referralCode?: string;
  groupInviteCode?: string;
}

// ─── Step order (for direction calc) ─────────────────────────────────────────

const STEPS: WizardStep[] = ["name", "username", "contact", "whatsapp", "document", "address", "team", "plan", "success"];

const STEP_LABELS: Record<WizardStep, string> = {
  name: "Seu nome",
  username: "Username",
  contact: "Acesso",
  whatsapp: "WhatsApp",
  document: "Documento",
  address: "Endereço",
  team: "Seu time",
  plan: "Plano",
  success: "Pronto!",
};

// ─── Underline input ──────────────────────────────────────────────────────────

interface UInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  valid?: boolean;
  error?: boolean;
}

const UInput = ({ label, icon, valid, error, className = "", ...props }: UInputProps) => {
  const border = error
    ? "border-red-400/60"
    : valid
    ? "border-emerald-500/60"
    : "border-white/20 focus-within:border-white/50";

  return (
    <div>
      <label className="block text-[11px] font-semibold tracking-widest uppercase text-white/40 mb-2">
        {label}
      </label>
      <div className={`flex items-center gap-3 border-b-2 pb-2 transition-colors duration-200 ${border}`}>
        {icon && <span className="text-white/30 flex-shrink-0">{icon}</span>}
        <input
          {...props}
          className={`w-full bg-transparent text-white placeholder:text-white/20 text-lg outline-none ${className}`}
        />
        {valid && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
      </div>
    </div>
  );
};

// ─── Progress bar ─────────────────────────────────────────────────────────────

const ProgressBar = ({ current }: { current: WizardStep }) => {
  const nonSuccess = STEPS.filter((s) => s !== "success");
  const idx = nonSuccess.indexOf(current);
  const pct = idx < 0 ? 100 : ((idx + 1) / nonSuccess.length) * 100;

  return (
    <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-primary rounded-full"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>
  );
};

// ─── Slide variants ───────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? "60%" : "-60%",
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir >= 0 ? "-60%" : "60%",
    opacity: 0,
  }),
};

const slideTransition = { duration: 0.32, ease: "easeInOut" };

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingWizard({ onClose, referralCode = "", groupInviteCode = "" }: OnboardingWizardProps) {
  const navigate = useNavigate();

  // Form state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState<AddressData | null>(null);
  const [favoriteTeam, setFavoriteTeam] = useState<string>("nenhum");
  const [plan, setPlan] = useState<"avista" | "parcelado">("avista");
  const [myReferralLink, setMyReferralLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Wizard nav state
  const [step, setStep] = useState<WizardStep>("name");
  const [direction, setDirection] = useState(1);

  const goTo = (next: WizardStep) => {
    const curIdx = STEPS.indexOf(step);
    const nextIdx = STEPS.indexOf(next);
    setDirection(nextIdx >= curIdx ? 1 : -1);
    setStep(next);
  };

  const goBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) goTo(STEPS[idx - 1]);
    else onClose();
  };

  // ── Username: validação + check de disponibilidade (debounced) ───────────────

  const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

  useEffect(() => {
    const raw = username.trim().toLowerCase();
    if (!raw) { setUsernameStatus("idle"); return; }
    if (!USERNAME_RE.test(raw)) { setUsernameStatus("invalid"); return; }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("participants")
        .select("id")
        .eq("username", raw)
        .maybeSingle();
      setUsernameStatus(data ? "taken" : "available");
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  // ── Validation per step ──────────────────────────────────────────────────────

  const canContinue: Record<WizardStep, boolean> = {
    name: fullName.trim().split(" ").length >= 2 && fullName.trim().length >= 5,
    username: usernameStatus === "available",
    contact: email.includes("@") && email.includes(".") && password.length >= 6,
    whatsapp: whatsapp.replace(/\D/g, "").length >= 10,
    document: validateCPF(cpf) && birthDate.length === 10,
    team: true, // sempre pode avançar (campo opcional)
    address: address !== null,
    plan: true,
    success: true,
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

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

      // Obter JWT da sessão activa para autenticar nas edge functions
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão não encontrada. Tente novamente.");

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
      const authHeaders = {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${session.access_token}`,
      };

      const regRes = await fetch(`${supabaseUrl}/functions/v1/register-participant`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          userId,
          fullName: fullName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim(),
          whatsapp: whatsapp.trim(),
          cpf: cpf.replace(/\D/g, ""),
          birthDate,
          state: address?.uf ?? "",
          city: address?.cidade ?? "",
          plan,
          referredById,
          favoriteTeam,
          groupInviteCode: groupInviteCode || localStorage.getItem("pending_group_code") || null,
        }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || "Erro ao registrar participante.");

      // Limpa o código de grupo do storage após uso
      localStorage.removeItem("pending_group_code");

      if (regData.referral_code) {
        setMyReferralLink(`${window.location.origin}/?ref=${regData.referral_code}`);
      }

      const planAmount = plan === "avista" ? 25000 : 30000;
      const planId = plan === "avista" ? "pro-avista" : "pro-parcelado";

      const prefRes = await fetch(`${supabaseUrl}/functions/v1/create-mp-preference`, {
        method: "POST",
        headers: authHeaders,
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

  const handleEnter = (e: KeyboardEvent, next: WizardStep) => {
    if (e.key === "Enter" && canContinue[step]) goTo(next);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const stepIdx = STEPS.filter((s) => s !== "success").indexOf(step);
  const isSuccess = step === "success";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      {/* Top bar */}
      <div className="flex-shrink-0 px-6 pt-safe-top pt-6 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          {/* Back / close */}
          {!isSuccess ? (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {stepIdx === 0 ? "Fechar" : "Voltar"}
            </button>
          ) : (
            <div />
          )}

          {/* Step label */}
          {!isSuccess && (
            <span className="text-xs font-bold tracking-widest uppercase text-white/30">
              {stepIdx + 1} / {STEPS.length - 1} — {STEP_LABELS[step]}
            </span>
          )}

          {/* Close */}
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isSuccess && <ProgressBar current={step} />}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="min-h-full flex flex-col"
          >

            {/* ── STEP: name ───────────────────────────────────────────────── */}
            {step === "name" && (
              <StepWrapper
                headline="Qual é o seu nome completo?"
                sub="Vamos personalizar sua experiência."
              >
                <UInput
                  label="Nome completo"
                  icon={<User className="w-4 h-4" />}
                  placeholder="João Paulo Silva"
                  value={fullName}
                  valid={canContinue.name}
                  autoFocus
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyDown={(e) => handleEnter(e as any, "contact")}
                />
                <StepNext disabled={!canContinue.name} onClick={() => goTo("contact")} />
              </StepWrapper>
            )}

            {/* ── STEP: username ───────────────────────────────────────────── */}
            {step === "username" && (
              <StepWrapper
                headline="Escolha seu username."
                sub="Será seu identificador público no ranking. Só letras minúsculas, números e _"
              >
                <div>
                  <UInput
                    label="Username"
                    icon={<AtSign className="w-4 h-4" />}
                    placeholder="joao_silva"
                    value={username}
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    valid={usernameStatus === "available"}
                    error={usernameStatus === "taken" || usernameStatus === "invalid"}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    onKeyDown={(e) => { if (e.key === "Enter" && canContinue.username) goTo("contact"); }}
                  />
                  <AnimatePresence mode="wait">
                    {usernameStatus === "checking" && (
                      <motion.p key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 mt-2 text-xs text-white/40">
                        <Loader2 className="w-3 h-3 animate-spin" /> Verificando disponibilidade...
                      </motion.p>
                    )}
                    {usernameStatus === "available" && (
                      <motion.p key="ok" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
                        <Check className="w-3 h-3" /> @{username} está disponível!
                      </motion.p>
                    )}
                    {usernameStatus === "taken" && (
                      <motion.p key="taken" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mt-2 text-xs text-red-400">
                        Este username já está em uso.
                      </motion.p>
                    )}
                    {usernameStatus === "invalid" && username.length > 0 && (
                      <motion.p key="invalid" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mt-2 text-xs text-red-400">
                        Mínimo 3 caracteres. Apenas letras, números e _.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <StepNext disabled={!canContinue.username} onClick={() => goTo("contact")} />
              </StepWrapper>
            )}

            {/* ── STEP: contact ────────────────────────────────────────────── */}
            {step === "contact" && (
              <StepWrapper
                headline="Seu email e uma senha."
                sub="Com eles você acessa a plataforma."
              >
                <UInput
                  label="E-mail"
                  icon={<Mail className="w-4 h-4" />}
                  type="email"
                  placeholder="joao@email.com"
                  value={email}
                  valid={email.includes("@") && email.includes(".")}
                  autoFocus
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                />
                <UInput
                  label="Senha (mín. 6 caracteres)"
                  icon={<Lock className="w-4 h-4" />}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  valid={password.length >= 6}
                  autoComplete="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => handleEnter(e as any, "whatsapp")}
                />
                <StepNext disabled={!canContinue.contact} onClick={() => goTo("whatsapp")} />
              </StepWrapper>
            )}

            {/* ── STEP: whatsapp ───────────────────────────────────────────── */}
            {step === "whatsapp" && (
              <StepWrapper
                headline="Número do WhatsApp."
                sub="Para você receber avisos de prêmios e resultados."
              >
                <UInput
                  label="WhatsApp"
                  icon={<Phone className="w-4 h-4" />}
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={whatsapp}
                  valid={whatsapp.replace(/\D/g, "").length >= 10}
                  inputMode="numeric"
                  autoFocus
                  onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                  onKeyDown={(e) => handleEnter(e as any, "document")}
                />
                <StepNext disabled={!canContinue.whatsapp} onClick={() => goTo("document")} />
              </StepWrapper>
            )}

            {/* ── STEP: document ───────────────────────────────────────────── */}
            {step === "document" && (
              <StepWrapper
                headline="CPF e data de nascimento."
                sub="Necessário para emissão de prêmios."
              >
                <LgpdNotice />
                <UInput
                  label="CPF"
                  icon={<FileText className="w-4 h-4" />}
                  placeholder="000.000.000-00"
                  value={cpf}
                  valid={validateCPF(cpf)}
                  error={cpf.replace(/\D/g, "").length === 11 && !validateCPF(cpf)}
                  inputMode="numeric"
                  autoFocus
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                />
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-white/40 mb-2">
                    Data de nascimento
                  </label>
                  <div className={`flex items-center gap-3 border-b-2 pb-2 transition-colors duration-200 ${birthDate ? "border-emerald-500/60" : "border-white/20 focus-within:border-white/50"}`}>
                    <Calendar className="w-4 h-4 text-white/30 flex-shrink-0" />
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      onKeyDown={(e) => handleEnter(e as any, "address")}
                      className="w-full bg-transparent text-white text-lg outline-none [color-scheme:dark]"
                    />
                    {birthDate && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  </div>
                </div>
                <StepNext disabled={!canContinue.document} onClick={() => goTo("address")} />
              </StepWrapper>
            )}

            {/* ── STEP: team ───────────────────────────────────────────────── */}
            {step === "team" && (
              <StepWrapper
                headline="Qual é o seu time do coração?"
                sub="Isso aparece no seu perfil. Pode pular se preferir."
              >
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-white/40 mb-3">
                    Time do coração
                  </label>
                  {/* wrapper que normaliza cores para dark bg */}
                  <div className="[&_.border-border]:border-white/20 [&_input]:text-white [&_input]:placeholder:text-white/20 [&_button[type=button]]:text-white">
                    <TeamCombobox
                      value={favoriteTeam}
                      onChange={setFavoriteTeam}
                      dark
                    />
                  </div>
                  {favoriteTeam && favoriteTeam !== "nenhum" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
                    >
                      <Heart className="w-4 h-4 text-red-400 fill-red-400 flex-shrink-0" />
                      <span className="text-white/70 text-sm">
                        {teams.find((t) => t.id === favoriteTeam)?.name}
                      </span>
                    </motion.div>
                  )}
                </div>
                <StepNext disabled={false} onClick={() => goTo("plan")} />
                <button
                  onClick={() => goTo("plan")}
                  className="w-full py-1 text-xs text-white/25 hover:text-white/40 transition-colors text-center"
                >
                  Pular esta etapa
                </button>
              </StepWrapper>
            )}

            {/* ── STEP: address ────────────────────────────────────────────── */}
            {step === "address" && (
              <div className="flex-1 pt-8">
                {/* Override AddressStep colors for dark bg */}
                <style>{`
                  #wizard-address label { color: rgba(255,255,255,0.4); }
                  #wizard-address input { color: white; }
                  #wizard-address input::placeholder { color: rgba(255,255,255,0.2); }
                  #wizard-address .border-border { border-color: rgba(255,255,255,0.2); }
                  #wizard-address .focus-within\\:border-foreground\\/50:focus-within { border-color: rgba(255,255,255,0.5); }
                  #wizard-address .text-foreground { color: white; }
                  #wizard-address .text-muted-foreground { color: rgba(255,255,255,0.4); }
                  #wizard-address button[disabled] { opacity: 0.4; }
                `}</style>
                <div id="wizard-address">
                  <AddressStep
                    initial={address ?? undefined}
                    onNext={(data) => {
                      setAddress(data);
                      goTo("team");
                    }}
                    onBack={goBack}
                  />
                </div>
              </div>
            )}

            {/* ── STEP: plan ───────────────────────────────────────────────── */}
            {step === "plan" && (
              <StepWrapper
                headline="Escolha seu plano."
                sub="Acesso completo a todos os 104 jogos da Copa."
              >
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {(["avista", "parcelado"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlan(p)}
                      className={`rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                        plan === p
                          ? "border-primary bg-primary/10"
                          : "border-white/10 bg-white/3 hover:border-white/20"
                      }`}
                    >
                      <div className="font-black text-base text-white mb-1">
                        {p === "avista" ? "À Vista" : "Parcelado"}
                      </div>
                      <div
                        className={`text-2xl font-black mb-2 ${plan === p ? "text-primary" : "text-white/60"}`}
                      >
                        {p === "avista" ? "R$ 250" : "3× R$ 100"}
                      </div>
                      <div className="text-xs text-white/40">
                        {p === "avista" ? "Pagamento único" : "3 parcelas mensais"}
                      </div>
                      {p === "avista" && (
                        <div className="text-xs font-bold mt-2 text-primary">
                          ★ Melhor valor
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-6 rounded-2xl bg-white/4 border border-white/8 p-4 space-y-2">
                  {[
                    ["Nome", fullName],
                    ["E-mail", email],
                    ["Cidade", `${address?.cidade}/${address?.uf}`],
                    ["Time", teams.find((t) => t.id === favoriteTeam)?.name ?? "—"],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-white/40">{label}</span>
                      <span className="text-white/80 font-medium truncate max-w-[55%] text-right">{val}</span>
                    </div>
                  ))}
                </div>

                <motion.button
                  onClick={handlePay}
                  disabled={processing}
                  whileTap={{ scale: 0.97 }}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm tracking-widest bg-primary text-black shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  {processing ? "PROCESSANDO..." : "CONFIRMAR E PAGAR"}
                </motion.button>

                <button
                  onClick={goBack}
                  className="w-full py-2 text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  ← Voltar
                </button>
              </StepWrapper>
            )}

            {/* ── STEP: success ────────────────────────────────────────────── */}
            {step === "success" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 space-y-6">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-24 h-24 rounded-full flex items-center justify-center border-2 border-primary bg-primary/[0.15]"
                >
                  <Check className="w-12 h-12 text-primary" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <h2 className="text-3xl font-black text-white">Bem-vindo à Elite!</h2>
                  <p className="text-white/50 text-sm max-w-xs mx-auto leading-relaxed">
                    Confirme seu e-mail para ativar a conta. Após isso, é só fazer seus palpites e subir no ranking.
                  </p>
                </motion.div>

                {myReferralLink && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/4 p-5 text-left space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-primary" />
                      <span className="text-xs font-black text-white">Seu link de indicação</span>
                    </div>
                    <p className="text-xs text-white/40">+200 pts por cada amigo confirmado. Sem limite.</p>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-black/40 rounded-lg px-3 py-2 text-xs text-white/40 truncate font-mono border border-white/10">
                        {myReferralLink}
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(myReferralLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }}
                        className="p-2.5 rounded-lg bg-primary text-black flex-shrink-0"
                      >
                        {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({ title: "Super Bolão Copa 2026", text: "Entre e concorra a R$ 5 Milhões! 🏆⚽", url: myReferralLink });
                          } else {
                            navigator.clipboard.writeText(myReferralLink);
                          }
                        }}
                        className="p-2.5 rounded-lg border border-white/15 text-white/60 flex-shrink-0 hover:border-white/30 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  onClick={() => { onClose(); }}
                  className="px-8 py-4 rounded-2xl bg-primary text-black font-black text-sm tracking-wider"
                >
                  VER JOGOS →
                </motion.button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Helper sub-components ────────────────────────────────────────────────────

const StepWrapper = ({
  headline, sub, children,
}: {
  headline: string;
  sub: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col flex-1 pt-10 gap-8">
    <div className="space-y-2">
      <h2 className="text-3xl font-black text-white leading-tight">{headline}</h2>
      <p className="text-white/40 text-sm">{sub}</p>
    </div>
    <div className="space-y-7 flex-1">{children}</div>
  </div>
);

const StepNext = ({
  onClick, disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) => (
  <div className="pt-4">
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm tracking-widest transition-all duration-300 ${
        disabled
          ? "bg-white/8 text-white/20 cursor-not-allowed"
          : "bg-primary text-black shadow-lg shadow-primary/20 hover:shadow-primary/40"
      }`}
    >
      PRÓXIMO
      <motion.span
        animate={{ x: disabled ? 0 : [0, 4, 0] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
      >
        <ChevronRight className="w-4 h-4" />
      </motion.span>
    </motion.button>
  </div>
);
