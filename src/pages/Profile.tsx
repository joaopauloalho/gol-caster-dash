import { useState } from "react";
import { User, Trophy, Target, Zap, Star, LogOut, MapPin, Heart, Pencil, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useParticipant } from "@/hooks/useParticipant";
import ReferralCard from "@/components/ReferralCard";
import DailyChecklist from "@/components/DailyChecklist";
import { TeamCombobox } from "@/components/ui/team-combobox";
import { teams } from "@/data/teams";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { participant, hasPaid } = useParticipant();

  const [editingTeam, setEditingTeam] = useState(false);
  const [teamDraft, setTeamDraft] = useState<string>("");
  const [savingTeam, setSavingTeam] = useState(false);

  const currentTeamId = participant?.favorite_team ?? "nenhum";
  const currentTeamName = teams.find((t) => t.id === currentTeamId)?.name ?? "Nenhum / Não torço";

  const startEditTeam = () => {
    setTeamDraft(currentTeamId);
    setEditingTeam(true);
  };

  const cancelEditTeam = () => {
    setEditingTeam(false);
    setTeamDraft("");
  };

  const saveTeam = async () => {
    if (!user) return;
    setSavingTeam(true);
    const { error } = await supabase
      .from("participants")
      .update({ favorite_team: teamDraft === "nenhum" ? null : teamDraft })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao salvar o time.");
    } else {
      toast.success("Time do coração atualizado!");
      // força reload do participant
      window.location.reload();
    }
    setSavingTeam(false);
    setEditingTeam(false);
  };

  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="px-4">

        {/* ── Avatar + info ── */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">
              {participant?.full_name || user?.email?.split("@")[0] || "Jogador"}
            </h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            {participant && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5" /> {participant.city}/{participant.state}
              </p>
            )}
          </div>
        </div>

        {/* ── Time do coração ── */}
        {participant && (
          <div className="bg-glass rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Time do Coração</span>
              </div>
              {!editingTeam && (
                <button
                  onClick={startEditTeam}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Editar
                </button>
              )}
            </div>

            {editingTeam ? (
              <div className="space-y-3">
                <TeamCombobox value={teamDraft} onChange={setTeamDraft} />
                <div className="flex gap-2">
                  <button
                    onClick={saveTeam}
                    disabled={savingTeam}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {savingTeam ? "Salvando..." : "Salvar"}
                  </button>
                  <button
                    onClick={cancelEditTeam}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-bold"
                  >
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  {currentTeamName}
                </span>
                {currentTeamId === "nenhum" && (
                  <span className="text-xs text-muted-foreground italic">— toque em editar para escolher</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Stats ── */}
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

        {/* ── Daily Checklist ── */}
        {hasPaid && (
          <div className="mb-4">
            <DailyChecklist />
          </div>
        )}

        {/* ── Referral ── */}
        {hasPaid && (
          <div className="mb-4">
            <ReferralCard />
          </div>
        )}

        {/* ── Actions ── */}
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
