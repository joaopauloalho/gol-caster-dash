import { useState, useEffect } from "react";
import {
  User, Trophy, Target, Zap, Star, LogOut, MapPin, Heart,
  Pencil, Check, X, Share2, Copy, Gift, Users, Crown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useParticipant } from "@/hooks/useParticipant";
import ReferralCard from "@/components/ReferralCard";
import DailyChecklist from "@/components/DailyChecklist";
import { TeamCombobox } from "@/components/ui/team-combobox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { teams } from "@/data/teams";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const PRIZES = [
  { pos: "🥇 1º Lugar", prize: "iPhone 15 Pro Max", color: "border-primary/40 bg-primary/5" },
  { pos: "🥈 2º Lugar", prize: "R$ 1.000", color: "border-[#C0C0C0]/40 bg-[#C0C0C0]/5" },
  { pos: "🥉 3º Lugar", prize: "R$ 500", color: "border-amber-700/40 bg-amber-700/5" },
  { pos: "🏅 Top 10", prize: "Camisa da Seleção", color: "border-border bg-muted/30" },
  { pos: "⭐ Maior Indicador", prize: "JBL Charge 5", color: "border-secondary/40 bg-secondary/5" },
  { pos: "🎯 Placar Perfeito", prize: "R$ 100 / rodada", color: "border-border bg-muted/30" },
];

const Profile = () => {
  const { user, signOut } = useAuth();
  const { participant, hasPaid } = useParticipant();
  const navigate = useNavigate();

  const [editingTeam, setEditingTeam] = useState(false);
  const [teamDraft, setTeamDraft] = useState<string>("");
  const [savingTeam, setSavingTeam] = useState(false);

  // Stats reais
  const [myRank, setMyRank] = useState<number | null>(null);
  const [exactScores, setExactScores] = useState(0);
  const [perfectPredictions, setPerfectPredictions] = useState(0);

  // Prêmios & Amigos tab state
  const [referralCount, setReferralCount] = useState(0);
  const [groupInviteCode, setGroupInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currentTeamId = participant?.favorite_team ?? "nenhum";
  const currentTeamName = teams.find((t) => t.id === currentTeamId)?.name ?? "Nenhum / Não torço";

  // Fetch stats reais
  useEffect(() => {
    if (!participant) return;
    const fetchStats = async () => {
      // Posição no ranking
      const { data: rankData } = await supabase
        .from("participants_public_view")
        .select("user_id, bonus_points")
        .or("payment_confirmed.eq.true,is_test_user.eq.true")
        .order("bonus_points", { ascending: false })
        .limit(500);
      if (rankData) {
        const pos = rankData.findIndex(p => p.user_id === participant.id) + 1;
        setMyRank(pos > 0 ? pos : null);
      }
      // Placares exatos e gabaritos
      const { data: predsData } = await supabase
        .from("predictions")
        .select("points_earned")
        .eq("user_id", participant.id)
        .gt("points_earned", 0);
      if (predsData) {
        setExactScores(predsData.filter(p => (p.points_earned ?? 0) >= 25).length);
        setPerfectPredictions(predsData.filter(p => (p.points_earned ?? 0) >= 100).length);
      }
    };
    fetchStats();
  }, [participant]);

  // Fetch referral count + first group invite code
  useEffect(() => {
    if (!participant) return;

    const fetchExtras = async () => {
      // Count confirmed referrals — referred_by é FK participants(id), não referral_code
      const { count } = await supabase
        .from("participants")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", participant.id)
        .eq("payment_confirmed", true);
      setReferralCount(count ?? 0);

      // Get first group invite code
      const { data: membership } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", participant.id)
        .limit(1)
        .maybeSingle();

      if (membership?.group_id) {
        const { data: group } = await supabase
          .from("groups")
          .select("invite_code")
          .eq("id", membership.group_id)
          .maybeSingle();
        setGroupInviteCode(group?.invite_code ?? null);
      }
    };

    fetchExtras();
  }, [participant]);

  const inviteLink = groupInviteCode
    ? `${window.location.origin}/?group=${groupInviteCode}&ref=${participant?.referral_code}`
    : `${window.location.origin}/?ref=${participant?.referral_code}`;

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareInvite = () => {
    if (navigator.share) {
      navigator.share({
        title: "Super Bolão da Copa 2026",
        text: `Entre comigo no Bolão da Copa e concorra a prêmios! ⚽🏆`,
        url: inviteLink,
      });
    } else {
      copyInvite();
    }
  };

  const startEditTeam = () => { setTeamDraft(currentTeamId); setEditingTeam(true); };
  const cancelEditTeam = () => { setEditingTeam(false); setTeamDraft(""); };

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
            {participant?.username && (
              <p className="text-xs font-bold text-primary">@{participant.username}</p>
            )}
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            {participant && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5" /> {participant.city}/{participant.state}
              </p>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="w-full mb-5">
            <TabsTrigger value="perfil" className="flex-1">Perfil</TabsTrigger>
            <TabsTrigger value="premios" className="flex-1">🎁 Prêmios</TabsTrigger>
          </TabsList>

          {/* ── TAB: PERFIL ── */}
          <TabsContent value="perfil" className="space-y-5 mt-0">
            {/* Time do coração */}
            {participant && (
              <div className="bg-glass rounded-xl p-4">
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
                    <span className="text-sm font-bold text-foreground">{currentTeamName}</span>
                    {currentTeamId === "nenhum" && (
                      <span className="text-xs text-muted-foreground italic">— toque em editar para escolher</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Trophy, label: "Posição", value: myRank ? `#${myRank}` : "#—", color: "text-primary" },
                { icon: Star, label: "Pontos", value: String(participant?.bonus_points || 0), color: "text-foreground" },
                { icon: Target, label: "Placares Exatos", value: String(exactScores), color: "text-secondary" },
                { icon: Zap, label: "Gabaritos", value: String(perfectPredictions), color: "text-primary" },
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
              <DailyChecklist />
            )}

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => navigate("/jogos")}
                className="w-full bg-glass rounded-xl p-4 text-left flex items-center gap-3 text-foreground text-sm font-medium"
              >
                <Trophy className="w-4 h-4 text-primary" /> Meus Palpites
              </button>
              <button
                onClick={() => navigate("/rankings")}
                className="w-full bg-glass rounded-xl p-4 text-left flex items-center gap-3 text-foreground text-sm font-medium"
              >
                <Star className="w-4 h-4 text-primary" /> Minha Posição no Ranking
              </button>
              {user && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="w-full bg-glass rounded-xl p-4 text-left flex items-center gap-3 text-destructive text-sm font-medium">
                      <LogOut className="w-4 h-4" /> Sair
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Você precisará fazer login novamente para acessar seus palpites.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={signOut}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sair
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </TabsContent>

          {/* ── TAB: PRÊMIOS & AMIGOS ── */}
          <TabsContent value="premios" className="space-y-5 mt-0">

            {/* Status cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-glass-gold rounded-xl p-4 text-center">
                <Users className="w-5 h-5 mx-auto mb-2 text-primary" />
                <div className="text-3xl font-black text-primary">{referralCount}</div>
                <div className="text-xs text-muted-foreground">Amigos Indicados</div>
              </div>
              <div className="bg-glass rounded-xl p-4 text-center">
                <Crown className="w-5 h-5 mx-auto mb-2 text-foreground" />
                <div className="text-3xl font-black text-foreground">{referralCount * 50}</div>
                <div className="text-xs text-muted-foreground">Bônus Acumulado (pts)</div>
              </div>
            </div>

            {/* Invite button */}
            {hasPaid && (
              <div className="bg-glass rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-black text-foreground">Convidar Amigos</span>
                  <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    +50 pts
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cada amigo confirmado vale 50 pontos extras para você!
                  {groupInviteCode && " O link já inclui seu grupo."}
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground truncate font-mono">
                    {inviteLink}
                  </div>
                  <button
                    onClick={copyInvite}
                    className="p-2 rounded-lg bg-primary text-primary-foreground"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={shareInvite}
                    className="p-2 rounded-lg bg-secondary text-secondary-foreground"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Prize grid */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-black text-foreground uppercase tracking-wide">Tabela de Prêmios</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PRIZES.map(({ pos, prize, color }) => (
                  <div
                    key={pos}
                    className={`rounded-xl border p-3 space-y-1 ${color}`}
                  >
                    <div className="text-xs font-bold text-muted-foreground">{pos}</div>
                    <div className="text-sm font-black text-foreground leading-tight">{prize}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral card (legacy) if not paid */}
            {!hasPaid && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center text-xs text-muted-foreground">
                Confirme seu pagamento para participar dos prêmios e começar a indicar amigos.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
