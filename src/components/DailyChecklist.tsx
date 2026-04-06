import { useState } from "react";
import { CheckCircle2, XCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const WHATSAPP_NUMBER = "5511999999999"; // Replace with real number

const DailyChecklist = () => {
  const [answered, setAnswered] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const openWhatsapp = () => {
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Quero receber lembretes do Bolão da Copa! ⚽")}`,
      "_blank"
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-black text-foreground">📋 Check do Dia</h3>

      {answered === null ? (
        <>
          <p className="text-xs text-muted-foreground">Você já palpitou nos jogos de hoje?</p>
          <div className="flex gap-2">
            <Button
              onClick={() => setAnswered(true)}
              variant="secondary"
              className="flex-1 rounded-xl font-bold text-xs"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" /> Sim
            </Button>
            <Button
              onClick={() => {
                setAnswered(false);
                navigate("/jogos");
              }}
              variant="outline"
              className="flex-1 rounded-xl font-bold text-xs"
            >
              <XCircle className="w-4 h-4 mr-1" /> Ainda não
            </Button>
          </div>
        </>
      ) : answered ? (
        <p className="text-xs text-secondary font-bold">✅ Ótimo! Seus palpites estão registrados.</p>
      ) : null}

      {/* WhatsApp Reminders */}
      <button
        onClick={openWhatsapp}
        className="w-full flex items-center gap-2 p-3 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold hover:bg-secondary/20 transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        Ativar lembretes no WhatsApp
      </button>
    </div>
  );
};

export default DailyChecklist;
