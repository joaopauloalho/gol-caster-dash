import { useState, useEffect } from "react";
import { Trophy, Crown, Medal, Award, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useParticipant } from "@/hooks/useParticipant";
import { useNavigate } from "react-router-dom";

interface RankingUser {
  user_id: string;
  full_name: string;
  username: string | null;
  city: string;
  state: string;
  bonus_points: number;
}

const PosIcon = ({ pos }: { pos: number }) => {
  if (pos === 1) return <Crown className="w-5 h-5 text-primary" />;
  if (pos === 2) return <Medal className="w-5 h-5 text-gold-light" />;
  if (pos === 3) return <Award className="w-5 h-5 text-secondary" />;
  return <span className="text-sm font-black text-muted-foreground w-5 text-center">{pos}</span>;
};

const displayName = (p: RankingUser) =>
  p.username ? `@${p.username}` : p.full_name.split(" ")[0];

type FilterTab = "geral" | "estado" | "cidade" | "grupo";

const Rankings = () => {
  const [tab, setTab] = useState<FilterTab>("geral");
  const [participants, setParticipants] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { participant } = useParticipant();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);

      // For group tab we need a different query path
      if (tab === "grupo") {
        if (!participant) { setParticipants([]); setLoading(false); return; }

        // 1. Get all groups the current participant belongs to
        const { data: memberships } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", participant.id);

        if (!memberships || memberships.length === 0) {
          setParticipants([]);
          setLoading(false);
          return;
        }

        const groupIds = memberships.map((m) => m.group_id);

        // 2. Get all user_ids from those groups
        const { data: allMembers } = await supabase
          .from("group_members")
          .select("user_id")
          .in("group_id", groupIds);

        if (!allMembers || allMembers.length === 0) {
          setParticipants([]);
          setLoading(false);
          return;
        }

        const participantIds = [...new Set(allMembers.map((m) => m.user_id))];

        // 3. Fetch those participants ranked by points (apenas quem tem acesso)
        const { data } = await supabase
          .from("participants_public_view")
          .select("user_id, full_name, username, city, state, bonus_points")
          .in("user_id", participantIds)
          .or("payment_confirmed.eq.true,is_test_user.eq.true")
          .order("bonus_points", { ascending: false })
          .limit(50);

        setParticipants(data || []);
        setLoading(false);
        return;
      }

      // Other tabs
      // Decisão de produto: ranking mostra apenas quem tem acesso ao jogo
      // (payment_confirmed=true OU is_test_user=true)
      let query = supabase
        .from("participants_public_view")
        .select("user_id, full_name, username, city, state, bonus_points")
        .or("payment_confirmed.eq.true,is_test_user.eq.true")
        .order("bonus_points", { ascending: false })
        .limit(50);

      if (tab === "estado" && participant?.state) {
        query = query.eq("state", participant.state);
      }
      if (tab === "cidade" && participant?.city && participant?.state) {
        query = query.eq("state", participant.state).eq("city", participant.city);
      }

      const { data } = await query;
      setParticipants(data || []);
      setLoading(false);
    };
    fetchRanking();
  }, [tab, participant]);

  const myPos = participant
    ? participants.findIndex((p) => p.user_id === participant.id) + 1
    : 0;
  const leaderPoints = participants[0]?.bonus_points || 0;

  const tabs: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
    { key: "geral", label: "Geral", icon: "🏆" },
    ...(participant?.state ? [
      { key: "estado" as FilterTab, label: participant.state, icon: <MapPin className="w-3 h-3" /> },
    ] : []),
    ...(participant?.city ? [
      { key: "cidade" as FilterTab, label: participant.city, icon: <MapPin className="w-3 h-3" /> },
    ] : []),
    { key: "grupo" as FilterTab, label: "Grupo", icon: <Users className="w-3 h-3" /> },
  ];

  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="px-4 mb-4">
        <h1 className="text-2xl font-black text-foreground">📊 Rankings</h1>
        <p className="text-xs text-muted-foreground mt-1">Acompanhe sua posição em tempo real</p>
      </div>

      {/* Your Position */}
      {participant && (
        <div className="px-4 mb-4">
          <div className="bg-glass-gold rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Sua Posição</div>
              <div className="text-3xl font-black text-primary">#{myPos || "—"}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Seus Pontos</div>
              <div className="text-3xl font-black text-foreground">{participant.bonus_points}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Até o Líder</div>
              <div className="text-xl font-black text-destructive">
                {myPos > 0 ? `-${leaderPoints - participant.bonus_points}` : "—"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Carregando ranking...</div>
      ) : participants.length === 0 ? (
        tab === "grupo" && !participant ? (
          <div className="text-center py-12 px-4">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground mb-1">Faça login para ver seu grupo</p>
            <p className="text-xs text-muted-foreground mb-4">Entre na sua conta para ver o ranking dos membros do seu grupo.</p>
            <button
              onClick={() => navigate("/auth")}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
            >
              Fazer login
            </button>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {tab === "grupo"
              ? "Entre em um grupo para ver o ranking dos membros"
              : "Nenhum participante encontrado"}
          </div>
        )
      ) : (
        <>
          {/* Top 3 Podium */}
          {participants.length >= 3 && (
            <div className="px-4 mb-4">
              <div className="flex items-end justify-center gap-2">
                {[participants[1], participants[0], participants[2]].map((p, i) => {
                  const heights = ["h-20", "h-28", "h-16"];
                  const posNum = i === 0 ? 2 : i === 1 ? 1 : 3;
                  return (
                    <div key={p.user_id} className="flex flex-col items-center flex-1">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground mb-1">
                        {p.full_name.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-foreground text-center truncate w-full">
                        {displayName(p)}
                      </span>
                      <span className="text-xs text-muted-foreground">{p.city}/{p.state}</span>
                      <span className="text-xs font-bold text-primary">{p.bonus_points} pts</span>
                      <div className={`w-full ${heights[i]} rounded-t-lg mt-1 flex items-center justify-center ${
                        posNum === 1 ? "bg-primary/20 border border-primary/30" : "bg-muted"
                      }`}>
                        <PosIcon pos={posNum} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* List */}
          <div className="px-4 space-y-2">
            {participants.slice(3).map((p, idx) => (
              <div
                key={p.user_id}
                className={`bg-glass rounded-xl p-3 flex items-center gap-3 ${
                  p.user_id === participant?.id ? "ring-1 ring-primary" : ""
                }`}
              >
                <PosIcon pos={idx + 4} />
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                  {p.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-foreground truncate">
                    {displayName(p)}
                    {p.user_id === participant?.id && (
                      <span className="ml-1.5 text-[10px] text-primary font-black">você</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> {p.city}/{p.state}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-sm text-foreground">{p.bonus_points}</div>
                  <div className="text-xs text-muted-foreground">pts</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Rankings;
