import { useState, useEffect } from "react";
import { Crown, Medal, Award, MapPin, Users, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useParticipant } from "@/hooks/useParticipant";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";

interface RankingUser {
  user_id: string;
  full_name: string;
  username: string | null;
  city: string;
  state: string;
  bonus_points: number;
}

const displayName = (p: RankingUser) =>
  p.username ? `@${p.username}` : p.full_name.split(" ")[0];

const Avatar = ({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) => {
  const sz = size === "lg" ? "w-14 h-14 text-xl" : size === "md" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
  return (
    <div className={cn(sz, "rounded-full bg-muted flex items-center justify-center font-black text-foreground border-2 border-background")}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

// Skeleton row
const SkeletonRow = () => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-card/40 animate-pulse">
    <div className="w-5 h-4 bg-muted rounded" />
    <div className="w-8 h-8 rounded-full bg-muted" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 bg-muted rounded w-32" />
      <div className="h-2.5 bg-muted rounded w-20" />
    </div>
    <div className="w-12 h-4 bg-muted rounded" />
  </div>
);

type FilterTab = "geral" | "estado" | "cidade" | "grupo";

const Rankings = () => {
  const [tab, setTab]               = useState<FilterTab>("geral");
  const [participants, setParticipants] = useState<RankingUser[]>([]);
  const [loading, setLoading]       = useState(true);
  const { user }                    = useAuth();
  const { participant }             = useParticipant();
  const navigate                    = useNavigate();

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);

      if (tab === "grupo") {
        if (!participant) { setParticipants([]); setLoading(false); return; }
        const { data: memberships } = await supabase
          .from("group_members").select("group_id").eq("user_id", participant.id);
        if (!memberships || memberships.length === 0) { setParticipants([]); setLoading(false); return; }
        const groupIds = memberships.map(m => m.group_id);
        const { data: allMembers } = await supabase
          .from("group_members").select("user_id").in("group_id", groupIds);
        if (!allMembers || allMembers.length === 0) { setParticipants([]); setLoading(false); return; }
        const participantIds = [...new Set(allMembers.map(m => m.user_id))];
        const { data } = await supabase
          .from("participants_public_view")
          .select("user_id, full_name, username, city, state, bonus_points")
          .in("user_id", participantIds)
          .or("payment_confirmed.eq.true,is_test_user.eq.true")
          .order("bonus_points", { ascending: false }).limit(50);
        setParticipants(data || []);
        setLoading(false);
        return;
      }

      let query = supabase
        .from("participants_public_view")
        .select("user_id, full_name, username, city, state, bonus_points")
        .or("payment_confirmed.eq.true,is_test_user.eq.true")
        .order("bonus_points", { ascending: false }).limit(50);

      if (tab === "estado" && participant?.state)
        query = query.eq("state", participant.state);
      if (tab === "cidade" && participant?.city && participant?.state)
        query = query.eq("state", participant.state).eq("city", participant.city);

      const { data } = await query;
      setParticipants(data || []);
      setLoading(false);
    };
    fetchRanking();
  }, [tab, participant]);

  const myPos        = participant ? participants.findIndex(p => p.user_id === participant.id) + 1 : 0;
  const leaderPoints = participants[0]?.bonus_points || 0;
  const myPoints     = participant?.bonus_points || 0;
  const gap          = myPos > 0 ? leaderPoints - myPoints : null;

  const tabs: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
    { key: "geral",  label: "Geral",          icon: "🏆" },
    ...(participant?.state ? [{ key: "estado" as FilterTab, label: participant.state, icon: <MapPin className="w-3 h-3" /> }] : []),
    ...(participant?.city  ? [{ key: "cidade" as FilterTab, label: participant.city,  icon: <MapPin className="w-3 h-3" /> }] : []),
    { key: "grupo",  label: "Grupo",          icon: <Users className="w-3 h-3" /> },
  ];

  return (
    <div className="min-h-screen pb-28 pt-4">
      <div className="px-4 mb-5">
        <h1 className="text-2xl font-black text-foreground">Rankings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Acompanhe sua posição em tempo real</p>
      </div>

      {/* My stats bento */}
      {participant && (
        <div className="px-4 mb-5 grid grid-cols-3 gap-3">
          <StatCard
            value={myPos ? `#${myPos}` : "#—"}
            label="Posição"
            icon={<Trophy className="w-4 h-4" />}
            variant="colored"
            className="col-span-1"
          />
          <StatCard
            value={myPoints}
            label="Pontos"
            className="col-span-1"
          />
          <StatCard
            value={gap !== null ? `-${gap}` : "—"}
            label="Até líder"
            className="col-span-1"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-5 overflow-x-auto scrollbar-hide">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="px-4 space-y-2">
          {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : participants.length === 0 ? (
        tab === "grupo" && !participant ? (
          <div className="text-center py-12 px-4">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground mb-1">Faça login para ver seu grupo</p>
            <p className="text-xs text-muted-foreground mb-4">Entre na sua conta para ver o ranking dos membros do seu grupo.</p>
            <button onClick={() => navigate("/auth")}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
              Fazer login
            </button>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm px-4">
            {tab === "grupo" ? "Entre em um grupo para ver o ranking dos membros" : "Nenhum participante encontrado"}
          </div>
        )
      ) : (
        <>
          {/* ── Podium: top 3 ── */}
          {participants.length >= 3 && (
            <div className="px-4 mb-5">
              <div className="flex items-end justify-center gap-3">
                {/* Order: 2nd | 1st | 3rd */}
                {([1, 0, 2] as const).map((dataIdx, visualIdx) => {
                  const p       = participants[dataIdx];
                  const posNum  = dataIdx + 1;
                  const isFirst = posNum === 1;

                  const podiumHeights = ["h-28", "h-36", "h-24"]; // 2nd, 1st, 3rd
                  const medals = [
                    <Medal className="w-5 h-5 text-muted-foreground" />,
                    <Crown className="w-5 h-5 text-primary" />,
                    <Award className="w-5 h-5 text-amber-600" />,
                  ];
                  const podiumColors = [
                    "bg-muted/60 border-border/40",
                    "bg-primary/15 border-primary/40 shadow-glow-gold",
                    "bg-muted/40 border-border/30",
                  ];

                  return (
                    <motion.div
                      key={p.user_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: visualIdx * 0.1, duration: 0.45, ease: "easeOut" }}
                      className="flex flex-col items-center flex-1"
                    >
                      <Avatar name={p.full_name} size={isFirst ? "lg" : "md"} />
                      <span className="text-xs font-black text-foreground text-center truncate w-full mt-1">
                        {displayName(p)}
                      </span>
                      <span className={cn("text-xs font-bold tabular-nums", isFirst ? "text-primary" : "text-muted-foreground")}>
                        {p.bonus_points} pts
                      </span>
                      <div className={cn(
                        "w-full rounded-t-xl border mt-2 flex items-center justify-center",
                        podiumHeights[visualIdx],
                        podiumColors[visualIdx],
                      )}>
                        {medals[visualIdx]}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── List: 4th onwards ── */}
          <div className="px-4 space-y-1.5">
            {participants.slice(3).map((p, idx) => {
              const isMe = p.user_id === participant?.id;
              return (
                <motion.div
                  key={p.user_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all",
                    isMe
                      ? "bg-primary/[0.08] border-primary/30 ring-1 ring-primary/20"
                      : "bg-card/50 border-border/50",
                  )}
                >
                  <span className="text-xs font-black text-muted-foreground w-5 text-center tabular-nums">
                    {idx + 4}
                  </span>
                  <Avatar name={p.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-foreground truncate flex items-center gap-1.5">
                      {displayName(p)}
                      {isMe && <span className="text-[10px] text-primary font-black">você</span>}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" /> {p.city}/{p.state}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-sm text-foreground tabular-nums">{p.bonus_points}</div>
                    <div className="text-[10px] text-muted-foreground">pts</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Rankings;
