import { useState, useEffect } from "react";
import {
  User, Trophy, Target, Zap, Star, LogOut, MapPin, Heart,
  Pencil, Check, X, Share2, Copy, Gift, Users, Crown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useParticipant } from "@/hooks/useParticipant";
import DailyChecklist from "@/components/DailyChecklist";
import { TeamCombobox } from "@/components/ui/team-combobox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatCard } from "@/components/ui/stat-card";
import { BentoGrid, BentoItem } from "@/components/ui/bento-grid";
import { teams } from "@/data/teams";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const PRIZES = [
  { pos: "🥇 1º Lugar",      prize: "iPhone 15 Pro Max",    color: "border-primary/40 bg-primary/[0.06]",    featured: true  },
  { pos: "🥈 2º Lugar",      prize: "R$ 1.000",             color: "border-border/50 bg-muted/30",            featured: false },
  { pos: "🥉 3º Lugar",      prize: "R$ 500",               color: "border-amber-700/30 bg-amber-700/[0.04]", featured: false },
  { pos: "🏅 Top 10",        prize: "Camisa da Seleção",    color: "border-border/40 bg-muted/20",            featured: false },
  { pos: "⭐ Maior Indicador",prize: "JBL Charge 5",        color: "border-secondary/30 bg-secondary/[0.05]", featured: false },
  { pos: "🎯 Placar Perfeito",prize: "R$ 100 / rodada",     color: "border-border/40 bg-muted/20",            featured: false },
];

const Profile = () => {
  const { user, signOut }    = useAuth();
  const { participant, hasPaid } = useParticipant();
  const navigate             = useNavigate();

  const [editingTeam, setEditingTeam] = useState(false);
  const [teamDraft,   setTeamDraft]   = useState<string>("");
  const [savingTeam,  setSavingTeam]  = useState(false);

  const [myRank,             setMyRank]             = useState<number | null>(null);
  const [exactScores,        setExactScores]        = useState(0);
  const [perfectPredictions, setPerfectPredictions] = useState(0);
  const [referralCount,      setReferralCount]      = useState(0);
  const [groupInviteCode,    setGroupInviteCode]    = useState<string | null>(null);
  const [copied,             setCopied]             = useState(false);

  const currentTeamId   = participant?.favorite_team ?? "nenhum";
  const currentTeamName = teams.find(t => t.id === currentTeamId)?.name ?? "Nenhum / Não torço";

  useEffect(() => {
    if (!participant) return;
    const fetchStats = async () => {
      const { data: rankData } = await supabase
        .from("participants_public_view")
        .select("user_id, bonus_points")
        .or("payment_confirmed.eq.true,is_test_user.eq.true")
        .order("bonus_points", { ascending: false }).limit(500);
      if (rankData) {
        const pos = rankData.findIndex(p => p.user_id === participant.id) + 1;
        setMyRank(pos > 0 ? pos : null);
      }
      const { data: predsData } = await supabase
        .from("predictions").select("points_earned")
        .eq("user_id", participant.id).gt("points_earned", 0);
      if (predsData) {
        setExactScores(predsData.filter(p => (p.points_earned ?? 0) >= 25).length);
        setPerfectPredictions(predsData.filter(p => (p.points_earned ?? 0) >= 100).length);
      }
    };
    fetchStats();
  }, [participant]);

  useEffect(() => {
    if (!participant) return;
    const fetchExtras = async () => {
      const { count } = await supabase
        .from("participants").select("id", { count: "exact", head: true })
        .eq("referred_by", participant.id).eq("payment_confirmed", true);
      setReferralCount(count ?? 0);

      const { data: membership } = await supabase
        .from("group_members").select("group_id")
        .eq("user_id", participant.id).limit(1).maybeSingle();
      if (membership?.group_id) {
        const { data: group } = await supabase
          .from("groups").select("invite_code")
          .eq("id", membership.group_id).maybeSingle();
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
      navigator.share({ title: "Super Bolão da Copa 2026", text: "Entre comigo no Bolão da Copa e concorra a prêmios! ⚽🏆", url: inviteLink });
    } else { copyInvite(); }
  };

  const startEditTeam  = () => { setTeamDraft(currentTeamId); setEditingTeam(true); };
  const cancelEditTeam = () => { setEditingTeam(false); setTeamDraft(""); };
  const saveTeam = async () => {
    if (!user) return;
    setSavingTeam(true);
    const { error } = await supabase
      .from("participants")
      .update({ favorite_team: teamDraft === "nenhum" ? null : teamDraft })
      .eq("user_id", user.id);
    if (error) { toast.error("Erro ao salvar o time."); }
    else { toast.success("Time do coração atualizado!"); window.location.reload(); }
    setSavingTeam(false);
    setEditingTeam(false);
  };

  const displayName = participant?.full_name || user?.email?.split("@")[0] || "Jogador";

  return (
    <div className="min-h-screen pb-28 pt-4">
      <div className="px-4">

        {/* ── Hero row: Avatar + identity ── */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="text-2xl font-black text-primary">{displayName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-foreground leading-tight truncate">{displayName}</h1>
            {participant?.username && (
              <p className="text-xs font-bold text-primary">@{participant.username}</p>
            )}
            {participant && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5" /> {participant.city}/{participant.state}
              </p>
            )}
          </div>
        </div>

        {/* ── Stats bento ── */}
        {participant && (
          <BentoGrid cols={2} className="mb-5">
            <StatCard
              value={myRank ? `#${myRank}` : "#—"}
              label="Posição geral"
              icon={<Trophy className="w-4 h-4" />}
              variant="colored"
            />
            <StatCard
              value={participant.bonus_points}
              label="Pontos totais"
              icon={<Star className="w-4 h-4" />}
            />
            <StatCard
              value={exactScores}
              label="Placares exatos"
              icon={<Target className="w-4 h-4" />}
            />
            <StatCard
              value={perfectPredictions}
              label="Gabaritos perfeitos"
              icon={<Zap className="w-4 h-4" />}
            />
          </BentoGrid>
        )}

        {/* ── Tabs ── */}
        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="w-full mb-5">
            <TabsTrigger value="perfil"  className="flex-1">Perfil</TabsTrigger>
            <TabsTrigger value="premios" className="flex-1">🎁 Prêmios</TabsTrigger>
          </TabsList>

          {/* ── TAB: PERFIL ── */}
          <TabsContent value="perfil" className="space-y-4 mt-0">

            {/* Time do coração */}
            {participant && (
              <div className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Time do Coração</span>
                  </div>
                  {!editingTeam && (
                    <button onClick={startEditTeam}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                      <Pencil className="w-3 h-3" /> Editar
                    </button>
                  )}
                </div>
                {editingTeam ? (
                  <div className="space-y-3">
                    <TeamCombobox value={teamDraft} onChange={setTeamDraft} />
                    <div className="flex gap-2">
                      <button onClick={saveTeam} disabled={savingTeam}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50">
                        <Check className="w-3.5 h-3.5" />
                        {savingTeam ? "Salvando..." : "Salvar"}
                      </button>
                      <button onClick={cancelEditTeam}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold">
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

            {/* Daily checklist */}
            {hasPaid && <DailyChecklist />}

            {/* Actions */}
            <div className="space-y-2">
              <button onClick={() => navigate("/jogos")}
                className="w-full rounded-2xl border border-border/50 bg-card p-4 text-left flex items-center gap-3 text-foreground text-sm font-medium hover:bg-card/80 transition-colors">
                <Trophy className="w-4 h-4 text-primary" /> Meus Palpites
              </button>
              <button onClick={() => navigate("/rankings")}
                className="w-full rounded-2xl border border-border/50 bg-card p-4 text-left flex items-center gap-3 text-foreground text-sm font-medium hover:bg-card/80 transition-colors">
                <Star className="w-4 h-4 text-primary" /> Minha Posição no Ranking
              </button>
              {user && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="w-full rounded-2xl border border-destructive/20 bg-destructive/[0.04] p-4 text-left flex items-center gap-3 text-destructive text-sm font-medium hover:bg-destructive/[0.08] transition-colors">
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
                      <AlertDialogAction onClick={signOut}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sair
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </TabsContent>

          {/* ── TAB: PRÊMIOS ── */}
          <TabsContent value="premios" className="space-y-4 mt-0">

            {/* Referral stats */}
            <BentoGrid cols={2}>
              <StatCard
                value={referralCount}
                label="Amigos Indicados"
                icon={<Users className="w-4 h-4" />}
                variant="colored"
              />
              <StatCard
                value={referralCount * 50}
                label="Bônus acumulado (pts)"
                icon={<Crown className="w-4 h-4" />}
              />
            </BentoGrid>

            {/* Position progress */}
            {myRank && (
              <div className="rounded-2xl border border-border/50 bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Você está em</p>
                <p className="text-xl font-black text-foreground">
                  <span className="text-primary">#{myRank}</span> lugar no ranking geral
                </p>
                {myRank > 3 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Faltam {myRank - 3} posições para o pódio
                  </p>
                )}
              </div>
            )}

            {/* Invite section */}
            {hasPaid && (
              <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-black text-foreground">Convidar Amigos</span>
                  <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                    +50 pts por amigo
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cada amigo confirmado vale 50 pontos extras para você!
                  {groupInviteCode && " O link já inclui seu grupo."}
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-muted rounded-xl px-3 py-2 text-xs text-muted-foreground truncate font-mono">
                    {inviteLink}
                  </div>
                  <button onClick={copyInvite} className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={shareInvite} className="w-9 h-9 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
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
                {PRIZES.map(({ pos, prize, color, featured }) => (
                  <div key={pos} className={cn(
                    "rounded-2xl border p-4 space-y-1.5 transition-all",
                    color,
                    featured && "col-span-2 border-primary/40",
                  )}>
                    <div className="text-xs font-bold text-muted-foreground">{pos}</div>
                    <div className={cn("font-black leading-tight", featured ? "text-xl text-primary" : "text-sm text-foreground")}>
                      {prize}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!hasPaid && (
              <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 text-center text-xs text-muted-foreground">
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
