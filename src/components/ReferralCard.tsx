import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { useParticipant } from "@/hooks/useParticipant";

const ReferralCard = () => {
  const { participant } = useParticipant();
  const [copied, setCopied] = useState(false);

  if (!participant?.referral_code) return null;

  const link = `${window.location.origin}/?ref=${participant.referral_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "Bolão da Copa 2026",
        text: "Entre no Bolão da Copa e concorra a R$ 1 Milhão em prêmios! 🏆⚽",
        url: link,
      });
    } else {
      copyLink();
    }
  };

  return (
    <div className="bg-card border border-primary/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-black text-foreground">Indique Amigos</h3>
        <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          +50 pts por indicação
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Compartilhe seu link. Cada amigo que se inscrever e pagar, você ganha 50 pontos extras!
      </p>
      <div className="flex gap-2">
        <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground truncate font-mono">
          {link}
        </div>
        <button onClick={copyLink} className="p-2 rounded-lg bg-primary text-primary-foreground">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
        <button onClick={shareLink} className="p-2 rounded-lg bg-secondary text-secondary-foreground">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ReferralCard;
