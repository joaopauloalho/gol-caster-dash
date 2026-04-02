import { Trophy, Star, Users, Zap, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImg from "@/assets/hero-stadium.jpg";

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

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <img
          src={heroImg}
          alt="Estádio Copa 2026"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 px-6 text-center">
          <div className="animate-slide-up space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-glass-gold text-primary text-xs font-bold">
              <Zap className="w-3 h-3" /> Copa do Mundo 2026
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight">
              Super Bolão{" "}
              <span className="text-gradient-gold">Nacional</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
              Faça seus palpites em 104 jogos da Copa. Acumule pontos, escale o ranking e concorra a uma <strong className="text-primary">Hilux 0km</strong>.
            </p>
            <button
              onClick={() => navigate("/jogos")}
              className="btn-gold px-8 py-4 rounded-xl text-base font-black inline-flex items-center gap-2 mt-2"
            >
              Entrar no Bolão <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 px-4 -mt-6 relative z-10 max-w-lg mx-auto">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="bg-glass rounded-xl p-3 text-center">
            <Icon className="w-4 h-4 mx-auto text-primary mb-1" />
            <div className="text-lg font-black text-foreground">{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Prizes */}
      <div className="px-4 mt-8 max-w-lg mx-auto">
        <h2 className="text-lg font-black text-foreground mb-4">
          🏆 Premiação
        </h2>
        <div className="space-y-2">
          {prizes.map(({ emoji, label, highlight }) => (
            <div
              key={label}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                highlight
                  ? "bg-glass-gold animate-pulse-gold"
                  : "bg-glass"
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className={`font-bold text-sm ${highlight ? "text-primary" : "text-foreground"}`}>
                {label}
              </span>
              {highlight && (
                <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  PRÊMIO PRINCIPAL
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="px-4 mt-8 max-w-lg mx-auto">
        <h2 className="text-lg font-black text-foreground mb-4">
          ⚡ Como Funciona
        </h2>
        <div className="space-y-3">
          {[
            { step: "1", title: "Escolha o jogo", desc: "104 partidas disponíveis" },
            { step: "2", title: "Faça 8 palpites", desc: "Placar, goleador, cartões e mais" },
            { step: "3", title: "Acumule pontos", desc: "Multiplicadores nas fases finais" },
            { step: "4", title: "Suba no ranking", desc: "Top 1 leva a Hilux!" },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-center gap-4 bg-glass rounded-xl p-4">
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
        <h2 className="text-lg font-black text-foreground mb-4">
          🔥 Multiplicadores de Fase
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { phase: "Fase de Grupos", multi: "1.0x", color: "text-muted-foreground" },
            { phase: "Oitavas/Quartas", multi: "2.5x", color: "text-secondary" },
            { phase: "Semifinais", multi: "5.0x", color: "text-gold-light" },
            { phase: "Grande Final", multi: "10x", color: "text-primary" },
          ].map(({ phase, multi, color }) => (
            <div key={phase} className="bg-glass rounded-xl p-4 text-center">
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
