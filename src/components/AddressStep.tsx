import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, CheckCircle2, AlertCircle, ChevronRight, ArrowLeft, Home, Hash } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddressData {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  numero: string;
  complemento: string;
}

interface AddressStepProps {
  onNext: (data: AddressData) => void;
  onBack?: () => void;
  initial?: Partial<AddressData>;
}

type CepStatus = "idle" | "loading" | "found" | "not_found" | "manual";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const FieldSlide = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.38, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

interface UnderlineInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  status?: "default" | "success" | "error";
  suffix?: React.ReactNode;
}

const UnderlineInput = ({
  label,
  status = "default",
  suffix,
  className = "",
  ...props
}: UnderlineInputProps) => {
  const borderColor =
    status === "success"
      ? "border-emerald-500/70"
      : status === "error"
      ? "border-red-400/70"
      : "border-border focus-within:border-foreground/50";

  return (
    <div className="relative group">
      <label className="block text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">
        {label}
      </label>
      <div className={`flex items-center border-b-2 transition-colors duration-200 pb-1.5 ${borderColor}`}>
        <input
          {...props}
          className={`w-full bg-transparent text-foreground placeholder:text-muted-foreground/40 text-base outline-none ${className}`}
        />
        {suffix && <div className="ml-2 flex-shrink-0">{suffix}</div>}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AddressStep({ onNext, onBack, initial }: AddressStepProps) {
  const [cep, setCep] = useState(initial?.cep ?? "");
  const [logradouro, setLogradouro] = useState(initial?.logradouro ?? "");
  const [bairro, setBairro] = useState(initial?.bairro ?? "");
  const [cidade, setCidade] = useState(initial?.cidade ?? "");
  const [uf, setUf] = useState(initial?.uf ?? "");
  const [numero, setNumero] = useState(initial?.numero ?? "");
  const [complemento, setComplemento] = useState(initial?.complemento ?? "");

  const [cepStatus, setCepStatus] = useState<CepStatus>(
    initial?.logradouro ? "found" : "idle"
  );
  const [cepError, setCepError] = useState("");
  const numeroRef = useRef<HTMLInputElement>(null);

  // ── ViaCEP fetch ────────────────────────────────────────────────────────────

  useEffect(() => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    let cancelled = false;
    setCepStatus("loading");
    setCepError("");

    fetch(`https://viacep.com.br/ws/${digits}/json/`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.erro) {
          setCepStatus("not_found");
          setCepError("CEP não encontrado. Preencha o endereço manualmente.");
          setLogradouro("");
          setBairro("");
          setCidade("");
          setUf("");
        } else {
          setCepStatus("found");
          setLogradouro(data.logradouro ?? "");
          setBairro(data.bairro ?? "");
          setCidade(data.localidade ?? "");
          setUf(data.uf ?? "");
          setTimeout(() => numeroRef.current?.focus(), 450);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setCepStatus("not_found");
        setCepError("Erro ao consultar o CEP. Preencha manualmente.");
      });

    return () => { cancelled = true; };
  }, [cep]);

  // ── Derived state ───────────────────────────────────────────────────────────

  const showFields = cepStatus === "found" || cepStatus === "not_found" || cepStatus === "manual";
  const cepValid = cepStatus === "found" || cepStatus === "not_found" || cepStatus === "manual";
  const canAdvance = cepValid && numero.trim().length > 0;

  const cepSuffix =
    cepStatus === "loading" ? (
      <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
    ) : cepStatus === "found" ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    ) : cepStatus === "not_found" ? (
      <AlertCircle className="w-4 h-4 text-red-400" />
    ) : (
      <MapPin className="w-4 h-4 text-muted-foreground/40" />
    );

  const handleSubmit = () => {
    if (!canAdvance) return;
    onNext({ cep, logradouro, bairro, cidade, uf, numero, complemento });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[60vh] flex flex-col justify-between px-1 py-2">

      {/* Header */}
      <div className="space-y-1 mb-10">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-2 text-primary mb-4"
        >
          <Home className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Endereço</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-2xl font-black text-foreground"
        >
          Onde você mora?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="text-sm text-muted-foreground"
        >
          Digite seu CEP e preenchemos o resto pra você.
        </motion.p>
      </div>

      {/* Fields */}
      <div className="flex-1 space-y-8">

        {/* CEP */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
        >
          <UnderlineInput
            label="CEP"
            placeholder="00000-000"
            value={cep}
            inputMode="numeric"
            status={
              cepStatus === "found"
                ? "success"
                : cepStatus === "not_found"
                ? "error"
                : "default"
            }
            suffix={cepSuffix}
            onChange={(e) => {
              const formatted = formatCep(e.target.value);
              setCep(formatted);
              if (formatted.replace(/\D/g, "").length < 8) {
                setCepStatus("idle");
                setCepError("");
              }
            }}
          />
          <AnimatePresence>
            {cepError && (
              <motion.p
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="text-xs text-red-400/90 mt-2 flex items-center gap-1.5"
              >
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {cepError}
              </motion.p>
            )}
          </AnimatePresence>
          {cepStatus === "not_found" && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setCepStatus("manual")}
              className="text-xs text-primary underline underline-offset-2 mt-2 hover:text-primary/80 transition-colors"
            >
              Preencher endereço manualmente
            </motion.button>
          )}
        </motion.div>

        {/* Auto-filled / manual fields */}
        <AnimatePresence>
          {showFields && (
            <motion.div
              key="address-fields"
              className="space-y-8"
            >
              {/* Logradouro */}
              <FieldSlide delay={0.05}>
                <UnderlineInput
                  label="Rua / Logradouro"
                  placeholder="Rua das Flores"
                  value={logradouro}
                  status={logradouro ? "success" : "default"}
                  onChange={(e) => setLogradouro(e.target.value)}
                />
              </FieldSlide>

              {/* Bairro */}
              <FieldSlide delay={0.12}>
                <UnderlineInput
                  label="Bairro"
                  placeholder="Centro"
                  value={bairro}
                  status={bairro ? "success" : "default"}
                  onChange={(e) => setBairro(e.target.value)}
                />
              </FieldSlide>

              {/* Cidade + UF em linha */}
              <FieldSlide delay={0.19}>
                <div className="grid grid-cols-[1fr_80px] gap-6">
                  <UnderlineInput
                    label="Cidade"
                    placeholder="São Paulo"
                    value={cidade}
                    status={cidade ? "success" : "default"}
                    onChange={(e) => setCidade(e.target.value)}
                  />
                  <div>
                    <label className="block text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                      UF
                    </label>
                    <div className={`border-b-2 pb-1.5 transition-colors duration-200 ${uf ? "border-emerald-500/70" : "border-border"}`}>
                      <input
                        value={uf}
                        onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
                        placeholder="SP"
                        maxLength={2}
                        className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/40 text-base outline-none uppercase tracking-widest"
                      />
                    </div>
                  </div>
                </div>
              </FieldSlide>

              {/* Número + Complemento */}
              <FieldSlide delay={0.26}>
                <div className="grid grid-cols-[100px_1fr] gap-6">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                      Número <span className="text-red-400">*</span>
                    </label>
                    <div className={`border-b-2 pb-1.5 transition-colors duration-200 ${numero ? "border-emerald-500/70" : "border-border focus-within:border-foreground/50"}`}>
                      <input
                        ref={numeroRef}
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        placeholder="123"
                        inputMode="numeric"
                        className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/40 text-base outline-none"
                      />
                    </div>
                  </div>
                  <UnderlineInput
                    label="Complemento"
                    placeholder="Apto 42 (opcional)"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                  />
                </div>
              </FieldSlide>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer actions */}
      <div className="pt-12 space-y-3">
        {/* Progress hint */}
        <AnimatePresence>
          {!canAdvance && cepStatus !== "idle" && cepStatus !== "loading" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Hash className="w-3 h-3" />
              {!numero
                ? "Informe o número para continuar"
                : "Preencha o endereço completo"}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleSubmit}
          disabled={!canAdvance}
          whileTap={{ scale: canAdvance ? 0.97 : 1 }}
          className={`
            w-full flex items-center justify-center gap-2
            py-4 rounded-2xl font-black text-sm tracking-wide transition-all duration-300
            ${canAdvance
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.01]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
            }
          `}
        >
          PRÓXIMO
          <motion.span
            animate={{ x: canAdvance ? [0, 4, 0] : 0 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.span>
        </motion.button>

        {onBack && (
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Voltar
          </button>
        )}
      </div>
    </div>
  );
}
