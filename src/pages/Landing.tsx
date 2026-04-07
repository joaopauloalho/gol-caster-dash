import { useState } from "react";
import { Trophy, Zap, ChevronRight, Shield, CreditCard, Users, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RetroGrid } from "@/components/ui/retro-grid";

// Componentes internos simples para evitar crash por falta de arquivo
const SafeMarquee = ({ children }: { children: React.ReactNode }) => (
  <div className="flex overflow-hidden py-4 bg-black/20 border-y border-white/5">
    <div className="flex animate-marquee whitespace-nowrap gap-8 px-4">
      {children} {children}
    </div>
  </div>
);

const Landing = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"info" | "payment">("info");
  const [fullName, setFullName] = useState("");

  return (
    <div className="min-h-screen bg-[#051109] text-white pb-20 font-sans">
      {/* Hero com RetroGrid */}
      <div className="relative overflow-hidden min-h-[450px] flex flex-col items-center justify-center border-b border-white/5">
        <RetroGrid className="opacity-30" />
        <div className="relative z-10 px-4 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold mb-6 uppercase tracking-widest">
            <Zap className="w-3 h-3" /> Copa do Mundo 2026
          </div>
          <h1 className="text-4xl md:text-7xl font-black leading-none mb-6">
            CONCORRA A <br />
            <span className="text-yellow-500">R$ 1 MILHÃO</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-sm mx-auto">
            O site voltou! Agora o seu Super Bolão está pronto para receber os palpites de Londrina e do mundo.
          </p>
        </div>
      </div>

      {/* Marquee Simples */}
      <SafeMarquee>
        <span className="text-xl font-black flex items-center gap-2">🚗 TOYOTA HILUX 0KM <span className="text-yellow-500">•</span></span>
        <span className="text-xl font-black flex items-center gap-2">📱 IPHONES 16 PRO <span className="text-yellow-500">•</span></span>
        <span className="text-xl font-black flex items-center gap-2">🏍️ MOTOS HONDA <span className="text-yellow-500">•</span></span>
      </SafeMarquee>

      {/* Form Section */}
      <div className="px-4 -mt-10 relative z-20 max-w-lg mx-auto">
        <Card className="bg-[#0a1a0f] border-white/10 shadow-2xl overflow-hidden">
          <CardContent className="pt-8 space-y-4">
            <div className="text-center mb-6">
              <Shield className="w-10 h-10 mx-auto text-yellow-500 mb-3" />
              <h2 className="text-2xl font-black text-white">Inscreva-se Agora</h2>
              <p className="text-xs text-gray-500">Garante a tua vaga no maior bolão do Brasil</p>
            </div>

            <div className="space-y-3">
              <Input 
                placeholder="Nome Completo" 
                className="bg-black/40 border-white/10 h-12 text-white"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input placeholder="E-mail" className="bg-black/40 border-white/10 h-12 text-white" />
              
              <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-black py-7 rounded-xl text-lg shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                CONTINUAR <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Simples */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 mt-12 max-w-lg mx-auto">
        {[
          { icon: Trophy, val: "104", label: "Jogos" },
          { icon: Users, val: "10K+", label: "Jogadores" }
        ].map((s, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
             <div className="text-2xl font-black text-white">{s.val}</div>
             <div className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Landing;
