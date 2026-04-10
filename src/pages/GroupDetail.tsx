import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Copy, Check, Trophy, Users, Crown } from "lucide-react";
import { toast } from "sonner";

interface Member {
  user_id: string;
  full_name: string;
  username: string | null;
  state: string;
  city: string;
  bonus_points: number;
  plan: string;
  favorite_team: string | null;
}

interface GroupInfo {
  id: string;
  name: string;
  invite_code: string;
  admin_id: string;
  created_at: string;
}

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    setLoading(true);

    const { data: g } = await supabase
      .from("groups")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!g) {
      toast.error("Grupo não encontrado.");
      navigate("/grupos");
      return;
    }
    setGroup(g as GroupInfo);

    // Busca membros via group_members → participants
    const { data: gm } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", id);

    const userIds = (gm || []).map((m) => m.user_id).filter(Boolean);

    // Inclui o admin mesmo que não esteja em group_members
    const allUserIds = [...new Set([...userIds, g.admin_id])];

    if (allUserIds.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }

    // Usa participants_public_view (sem PII: sem CPF, whatsapp, email)
    const { data: parts } = await supabase
      .from("participants_public_view" as any)
      .select("user_id, full_name, username, state, city, bonus_points, plan, favorite_team")
      .in("user_id", allUserIds);

    const sorted = (parts || []).sort((a, b) => (b.bonus_points ?? 0) - (a.bonus_points ?? 0));
    setMembers(sorted as Member[]);
    setLoading(false);
  };

  const copyCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    if (!group) return;
    const link = `${window.location.origin}/auth?invite=${group.invite_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Link de convite copiado!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  if (!group) return null;

  const isAdmin = user?.id === group.admin_id;
  const myRank = members.findIndex((m) => m.user_id === user?.id) + 1;

  return (
    <div className="min-h-screen pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/grupos")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-foreground truncate">{group.name}</h1>
          <p className="text-[10px] text-muted-foreground">{members.length} participante{members.length !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && (
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full flex items-center gap-1">
            <Crown className="w-3 h-3" /> Admin
          </span>
        )}
      </div>

      {/* Invite card */}
      <div className="bg-glass rounded-2xl p-4 mb-5 space-y-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Convidar amigos</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Código</p>
            <p className="font-mono font-black text-lg text-foreground tracking-widest">{group.invite_code}</p>
          </div>
          <button
            onClick={copyCode}
            className="p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>
        <button
          onClick={copyLink}
          className="w-full py-2.5 rounded-xl border border-primary/30 text-primary text-xs font-bold hover:bg-primary/5 transition-colors"
        >
          Copiar link de convite direto
        </button>
      </div>

      {/* My position */}
      {myRank > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-xs font-bold text-foreground">Sua posição no grupo</p>
            <p className="text-[10px] text-muted-foreground">
              #{myRank} de {members.length} · {members.find((m) => m.user_id === user?.id)?.bonus_points ?? 0} pts
            </p>
          </div>
        </div>
      )}

      {/* Ranking */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-black text-foreground uppercase tracking-wider">Ranking do Grupo</h2>
        </div>

        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum membro ainda.</p>
        ) : (
          members.map((m, i) => {
            const isMe = m.user_id === user?.id;
            const isGroupAdmin = m.user_id === group.admin_id;
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;

            return (
              <div
                key={m.user_id}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                  isMe ? "bg-primary/10 border border-primary/20" : "bg-glass"
                }`}
              >
                {/* Rank */}
                <div className="w-7 text-center shrink-0">
                  {medal ? (
                    <span className="text-base">{medal}</span>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                  )}
                </div>

                {/* Avatar placeholder */}
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-muted-foreground">
                    {(m.username || m.full_name).charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-sm font-bold truncate ${isMe ? "text-primary" : "text-foreground"}`}>
                      {m.username ? `@${m.username}` : m.full_name}
                    </p>
                    {isGroupAdmin && <Crown className="w-3 h-3 text-primary shrink-0" />}
                    {isMe && <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">você</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{m.city}/{m.state}</p>
                </div>

                {/* Points */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-foreground">{m.bonus_points ?? 0}</p>
                  <p className="text-[9px] text-muted-foreground">pts</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GroupDetail;
