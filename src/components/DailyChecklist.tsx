import { useState } from "react";
import { CheckCircle2, Circle, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "5511999999999";

const chips = [
  { id: "palpites",  label: "Palpitou hoje?" },
  { id: "grupos",   label: "Viu seu grupo?" },
  { id: "ranking",  label: "Checou o ranking?" },
];

const DailyChecklist = () => {
  const [checked, setChecked]   = useState<Set<string>>(new Set());
  const [answered, setAnswered] = useState(false);
  const navigate = useNavigate();

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const progress = chips.length > 0 ? checked.size / chips.length : 0;
  const allDone  = checked.size === chips.length;

  const openWhatsapp = () => {
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Quero receber lembretes do Bolão da Copa! ⚽")}`,
      "_blank",
    );
  };

  return (
    <motion.div
      className={cn(
        "rounded-2xl border p-4 transition-all duration-slow",
        allDone
          ? "border-primary/30 bg-primary/[0.06] animate-pulse-gold"
          : "border-border/60 bg-card",
      )}
      layout
    >
      {/* Header + progress bar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-black text-foreground uppercase tracking-wider">
          📋 Check do Dia
        </span>
        <span className={cn(
          "text-[11px] font-bold tabular-nums",
          allDone ? "text-primary" : "text-muted-foreground",
        )}>
          {checked.size}/{chips.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full mb-4 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        />
      </div>

      {/* Chips — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {chips.map(({ id, label }) => {
          const done = checked.has(id);
          return (
            <button
              key={id}
              onClick={() => {
                toggle(id);
                if (id === "palpites" && !done) navigate("/jogos");
              }}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-full border text-xs font-semibold transition-all shrink-0",
                done
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-muted border-border/50 text-muted-foreground hover:text-foreground",
              )}
            >
              {done
                ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                : <Circle className="w-3.5 h-3.5 shrink-0 opacity-50" />
              }
              {label}
            </button>
          );
        })}
      </div>

      {/* Completion message */}
      <AnimatePresence>
        {allDone && !answered && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-xs text-primary font-bold text-center"
          >
            🏆 Dia perfeito! Todos os checks completos.
          </motion.p>
        )}
      </AnimatePresence>

      {/* WhatsApp reminder */}
      <button
        onClick={openWhatsapp}
        className="mt-3 w-full flex items-center gap-2 p-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary-foreground text-xs font-semibold hover:bg-secondary/20 transition-colors"
      >
        <MessageCircle className="w-4 h-4 shrink-0 text-secondary" />
        <span>Ativar lembretes no WhatsApp</span>
      </button>
    </motion.div>
  );
};

export default DailyChecklist;
