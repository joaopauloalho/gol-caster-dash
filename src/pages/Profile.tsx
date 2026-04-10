import { User, Trophy, Target, Zap, Star, LogOut, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useParticipant } from "@/hooks/useParticipant";
import ReferralCard from "@/components/ReferralCard";
import DailyChecklist from "@/components/DailyChecklist";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { participant, hasPaid } = useParticipant();

  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="px-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">
              {participant?.full_name || user?.email?.split("@")[0] || "Jogador"}
            </h1>
            <p className="text-xs text-muted-foreground">{user?.email || "jogador@email.com"}</p>
            {participant && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5" /> {participant.city}/{participant.state}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Trophy, label: "Posição", value: "#—", color: "text-primary" },
            { icon: Star, label: "Pontos", value: String(participant?.bonus_points || 0), color: "text-foreground" },
            { icon: Target, label: "Placares Exatos", value: "0", color: "text-secondary" },
            { icon: Zap, label: "Gabaritos", value: "0", color: "text-primary" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-glass rounded-xl p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
              <div className={`text-2xl font-black ${color}`}>{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {/* Daily Checklist */}
        {hasPaid && (
          <div className="mb-4">
            <DailyChecklist />
          </div>
        )}

        {/* Referral */}
        {hasPaid && (
          <div className="mb-4">
            <ReferralCard />
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button className="w-full bg-glass rounded-xl p-4 text-left flex items-center gap-3 text-foreground text-sm font-medium">
            <Trophy className="w-4 h-4 text-primary" /> Meus Palpites
          </button>
          <button className="w-full bg-glass rounded-xl p-4 text-left flex items-center gap-3 text-foreground text-sm font-medium">
            <Star className="w-4 h-4 text-primary" /> Histórico de Pontos
          </button>
          {user && (
            <button
              onClick={signOut}
              className="w-full bg-glass rounded-xl p-4 text-left flex items-center gap-3 text-destructive text-sm font-medium"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
