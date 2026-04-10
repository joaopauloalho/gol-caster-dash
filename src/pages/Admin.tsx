import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Check, Trophy, Loader2, ChevronDown, ChevronUp, Zap } from "lucide-react";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "";

interface Participant {
  id: string;
  user_id: string;
  full_name: string;
  username: string | null;
  email: string;
  cpf: string;
  whatsapp: string;
  plan: string;
  state: string;
  city: string;
  payment_confirmed: boolean;
  is_test_user: boolean;
  created_at: string;
  bonus_points: number;
}

interface MatchResult {
  id: number;
  match_number: number;
  team_a: string;
  team_b: string;
  stage: string;
  date: string;
  scored: boolean;
  result_home: number | null;
  result_away: number | null;
}

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"participants" | "matches" | "testers">("participants");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [convertingTester, setConvertingTester] = useState<string | null>(null);
  const [scoringMatch, setScoringMatch] = useState<number | null>(null);
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, {
    home: string; away: string; winner: string;
    goalFirstHalf: boolean | null; goalSecondHalf: boolean | null;
    redCard: boolean | null; penalty: boolean | null;
    firstToScore: string; possession: string;
  }>>({});

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (user.email !== ADMIN_EMAIL) { navigate("/"); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase.from("participants").select("*").order("created_at", { ascending: false }),
      supabase.from("matches").select("id, match_number, team_a, team_b, stage, date, scored, result_home, result_away").order("match_number"),
    ]);
    setParticipants(p || []);
    setMatches(m || []);
    setLoading(false);
  };

  const confirmPayment = async (participant: Participant) => {
    setConfirming(participant.id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Sessão inválida"); setConfirming(null); return; }

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-confirm-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ participant_id: participant.id, user_id: participant.user_id, plan: participant.plan }),
      }
    );
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); setConfirming(null); return; }
    toast.success(`Pagamento de ${participant.full_name} confirmado!`);
    setParticipants(prev => prev.map(p => p.id === participant.id ? { ...p, payment_confirmed: true } : p));
    setConfirming(null);
  };

  const scoreMatch = async (matchId: number) => {
    const r = results[matchId];
    if (!r || r.home === "" || r.away === "") { toast.error("Preencha placar e vencedor"); return; }

    setScoringMatch(matchId);
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/score-match`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ match_id: matchId, result: { ...r, home: Number(r.home), away: Number(r.away) } }),
      }
    );
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); setScoringMatch(null); return; }
    toast.success(`${data.scored} palpites pontuados!`);
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, scored: true, result_home: Number(r.home), result_away: Number(r.away) } : m));
    setScoringMatch(null);
    setExpandedMatch(null);
  };

  const convertToTester = async (participant: Participant) => {
    setConvertingTester(participant.id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Sessão inválida"); setConvertingTester(null); return; }

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/setup-test-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ participant_id: participant.id }),
      }
    );
    const data = await res.json();
    if (!res.ok || data.results?.[0]?.ok === false) {
      toast.error(data.error || data.results?.[0]?.error || "Erro ao converter");
    } else {
      const slug = data.results[0].username;
      toast.success(`✅ ${participant.full_name} → @${slug} / 123456`);
      setParticipants(prev => prev.map(p => p.id === participant.id ? { ...p, is_test_user: true } : p));
    }
    setConvertingTester(null);
  };

  const setResult = (matchId: number, field: string, value: unknown) => {
    setResults(prev => ({
      ...prev,
      [matchId]: { home: "", away: "", winner: "", goalFirstHalf: null, goalSecondHalf: null, redCard: null, penalty: null, firstToScore: "", possession: "", ...prev[matchId], [field]: value },
    }));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const paid = participants.filter(p => p.payment_confirmed).length;

  return (
    <div className="min-h-screen pb-24 pt-4 px-4">
      <h1 className="text-2xl font-black mb-1">Painel Admin</h1>
      <p className="text-xs text-muted-foreground mb-4">{paid} pagos / {participants.length} inscritos</p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(["participants", "matches", "testers"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {t === "participants" ? "Inscritos" : t === "matches" ? "Resultados" : "⚡ Testers"}
          </button>
        ))}
      </div>

      {activeTab === "participants" && (
        <div className="space-y-2">
          {participants.map(p => (
            <div key={p.id} className="bg-glass rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{p.full_name}</p>
                <p className="text-[10px] text-muted-foreground">{p.email} · {p.plan}</p>
                <p className="text-[10px] text-muted-foreground">{p.city}/{p.state} · {p.whatsapp}</p>
              </div>
              {p.payment_confirmed ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 shrink-0">
                  <Check className="w-3.5 h-3.5" /> Pago
                </span>
              ) : (
                <button
                  onClick={() => confirmPayment(p)}
                  disabled={confirming === p.id}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold disabled:opacity-50"
                >
                  {confirming === p.id ? "..." : "Confirmar"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "testers" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Converte o login do participante para <strong className="text-foreground">username@bolao.test</strong> com senha <strong className="text-foreground">123456</strong>. Participantes já convertidos aparecem com badge ⚡.
            </p>
          </div>
          <div className="space-y-2">
            {participants.map(p => (
              <div key={p.id} className="bg-glass rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">
                    {p.full_name}
                    {p.is_test_user && <span className="ml-1.5 text-[10px] text-primary font-black">⚡ tester</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {p.username ? `@${p.username}` : p.email}
                  </p>
                </div>
                {p.is_test_user ? (
                  <span className="text-[10px] font-bold text-green-500 shrink-0 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Ativo
                  </span>
                ) : (
                  <button
                    onClick={() => convertToTester(p)}
                    disabled={convertingTester === p.id}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold disabled:opacity-50 flex items-center gap-1"
                  >
                    {convertingTester === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    {convertingTester === p.id ? "..." : "Ativar"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "matches" && (
        <div className="space-y-2">
          {matches.map(m => (
            <div key={m.id} className="bg-glass rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedMatch(expandedMatch === m.id ? null : m.id)}
                className="w-full p-3 flex items-center justify-between"
              >
                <div className="text-left">
                  <p className="font-bold text-sm">{m.team_a} × {m.team_b}</p>
                  <p className="text-[10px] text-muted-foreground">Jogo {m.match_number} · {m.stage} · {m.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  {m.scored && (
                    <span className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> {m.result_home}-{m.result_away}
                    </span>
                  )}
                  {expandedMatch === m.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {expandedMatch === m.id && !m.scored && (
                <div className="px-3 pb-3 space-y-3 border-t border-border">
                  <div className="flex gap-2 mt-3">
                    <input type="number" min={0} placeholder={m.team_a} value={results[m.id]?.home ?? ""} onChange={e => setResult(m.id, "home", e.target.value)} className="w-16 h-10 rounded-lg bg-muted text-center font-black text-foreground border border-border outline-none" />
                    <span className="self-center font-bold">×</span>
                    <input type="number" min={0} placeholder={m.team_b} value={results[m.id]?.away ?? ""} onChange={e => setResult(m.id, "away", e.target.value)} className="w-16 h-10 rounded-lg bg-muted text-center font-black text-foreground border border-border outline-none" />
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[{ key: "A", label: m.team_a }, { key: "X", label: "Empate" }, { key: "B", label: m.team_b }].map(({ key, label }) => (
                      <button key={key} onClick={() => setResult(m.id, "winner", key)}
                        className={`py-1.5 rounded-lg text-[10px] font-bold ${results[m.id]?.winner === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {[
                    { field: "goalFirstHalf", label: "Gol 1º Tempo" },
                    { field: "goalSecondHalf", label: "Gol 2º Tempo" },
                    { field: "redCard", label: "Expulsão" },
                    { field: "penalty", label: "Pênalti" },
                  ].map(({ field, label }) => (
                    <div key={field} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <div className="flex gap-1">
                        {[true, false].map(v => (
                          <button key={String(v)} onClick={() => setResult(m.id, field, v)}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold ${results[m.id]?.[field as keyof typeof results[number]] === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            {v ? "Sim" : "Não"}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">1º a marcar</p>
                    <div className="grid grid-cols-3 gap-1">
                      {[{ key: "A", label: m.team_a }, { key: "N", label: "Ninguém" }, { key: "B", label: m.team_b }].map(({ key, label }) => (
                        <button key={key} onClick={() => setResult(m.id, "firstToScore", key)}
                          className={`py-1.5 rounded-lg text-[10px] font-bold ${results[m.id]?.firstToScore === key ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Mais posse</p>
                    <div className="grid grid-cols-2 gap-1">
                      {[{ key: "A", label: m.team_a }, { key: "B", label: m.team_b }].map(({ key, label }) => (
                        <button key={key} onClick={() => setResult(m.id, "possession", key)}
                          className={`py-1.5 rounded-lg text-[10px] font-bold ${results[m.id]?.possession === key ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => scoreMatch(m.id)} disabled={scoringMatch === m.id}
                    className="w-full py-2.5 rounded-xl btn-gold font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {scoringMatch === m.id ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculando...</> : <><Trophy className="w-4 h-4" /> Salvar Resultado e Pontuar</>}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;
