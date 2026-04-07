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
        plan: selectedPlan === "avista" ? "pro-avista" :
