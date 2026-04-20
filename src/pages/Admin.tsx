import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Check, Trophy, Loader2, ChevronDown, ChevronUp, Zap,
  BarChart3, Users, Settings, Ticket, Plus, ToggleLeft, ToggleRight, Save, RefreshCw,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

// CPF and WhatsApp are already masked by the Edge Function (admin-participants).
// Raw PII is never sent to the browser.
interface Participant {
  id: string;
  user_id: string;
  full_name: string;
  username: string | null;
  email: string;
  cpf: string;      // masked: ***.XXX.XXX-**
  whatsapp: string; // masked: last 4 digits replaced with ****
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

interface AdminKpis {
  total_participants: number;
  paid_participants: number;
  test_users: number;
  total_predictions: number;
  scored_matches: number;
  total_matches: number;
  active_coupons: number;
  signups_7d: number;
  revenue_estimate: number;
}

interface Coupon {
  id: string;
  code: string;
  kind: "percent" | "fixed";
  value: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  active: boolean;
  created_at: string;
}

interface SiteSetting {
  key: string;
  value: unknown;
}

type Tab = "kpis" | "participants" | "matches" | "content" | "coupons" | "testers";

// ── Component ─────────────────────────────────────────────────────────────────

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // shared
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("kpis");

  // participants / matches / testers
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [convertingTester, setConvertingTester] = useState<string | null>(null);
  const [newTesterUsername, setNewTesterUsername] = useState("");
  const [creatingTester, setCreatingTester] = useState(false);
  const [scoringMatch, setScoringMatch] = useState<number | null>(null);
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
  const [syncingESPN, setSyncingESPN] = useState(false);
  const [syncDates, setSyncDates] = useState(() => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD for input[type=date]
    return [fmt(today), fmt(tomorrow)];
  });
  const [results, setResults] = useState<Record<number, {
    home: string; away: string; winner: string;
    goalFirstHalf: boolean | null; goalSecondHalf: boolean | null;
    redCard: boolean | null; penalty: boolean | null; varGoal: boolean | null;
    firstToScore: string; possession: string;
  }>>({});

  // kpis
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [kpisLoading, setKpisLoading] = useState(false);

  // site settings
  const [siteSettings, setSiteSettings] = useState<SiteSetting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [settingDrafts, setSettingDrafts] = useState<Record<string, string>>({});

  // coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "", kind: "percent" as "percent" | "fixed",
    value: "", max_uses: "", valid_until: "",
  });
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  // ── Auth gate ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (user.app_metadata?.role !== "admin") { navigate("/"); return; }
    fetchParticipantsAndMatches();
  }, [user]);

  // ── Data fetchers ──────────────────────────────────────────────────────────

  const fetchParticipantsAndMatches = async () => {
    setLoading(true);
    // Participants are fetched via Edge Function so CPF/WhatsApp are masked server-side
    const [participantsResult, { data: m }] = await Promise.all([
      supabase.functions.invoke<{ participants: Participant[] }>("admin-participants"),
      supabase.from("matches").select("id, match_number, team_a, team_b, stage, date, scored, result_home, result_away").order("match_number"),
    ]);
    if (participantsResult.error) {
      toast.error("Erro ao carregar participantes");
    } else {
      setParticipants(participantsResult.data?.participants || []);
    }
    setMatches(m || []);
    setLoading(false);
  };

  const fetchKpis = async () => {
    setKpisLoading(true);
    const { data, error } = await supabase.rpc("admin_kpis");
    if (error) { toast.error("Erro ao carregar KPIs"); }
    else { setKpis(data as AdminKpis); }
    setKpisLoading(false);
  };

  const fetchSiteSettings = async () => {
    setSettingsLoading(true);
    const { data, error } = await supabase.from("site_settings").select("key, value").order("key");
    if (error) { toast.error("Erro ao carregar configurações"); }
    else {
      setSiteSettings(data || []);
      const drafts: Record<string, string> = {};
      for (const s of data || []) {
        drafts[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value, null, 2);
      }
      setSettingDrafts(drafts);
    }
    setSettingsLoading(false);
  };

  const fetchCoupons = async () => {
    setCouponsLoading(true);
    const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) { toast.error("Erro ao carregar cupons"); }
    else { setCoupons(data || []); }
    setCouponsLoading(false);
  };

  // Lazy-load tabs on first visit
  useEffect(() => {
    if (activeTab === "kpis" && !kpis && !kpisLoading) fetchKpis();
    if (activeTab === "content" && siteSettings.length === 0 && !settingsLoading) fetchSiteSettings();
    if (activeTab === "coupons" && coupons.length === 0 && !couponsLoading) fetchCoupons();
  }, [activeTab]);

  // ── Participants actions ───────────────────────────────────────────────────

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  const callEdge = async (fn: string, body: unknown) => {
    const session = await getSession();
    if (!session) throw new Error("Sessão inválida");
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro desconhecido");
    return data;
  };

  const confirmPayment = async (participant: Participant) => {
    setConfirming(participant.id);
    try {
      await callEdge("admin-confirm-payment", {
        participant_id: participant.id, user_id: participant.user_id, plan: participant.plan,
      });
      toast.success(`Pagamento de ${participant.full_name} confirmado!`);
      setParticipants(prev => prev.map(p => p.id === participant.id ? { ...p, payment_confirmed: true } : p));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
    setConfirming(null);
  };

  const scoreMatch = async (matchId: number) => {
    const r = results[matchId];
    if (!r || r.home === "" || r.away === "") { toast.error("Preencha placar e vencedor"); return; }
    setScoringMatch(matchId);
    try {
      const session = await getSession();
      if (!session) throw new Error("Sessão inválida");
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/score-match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ match_id: matchId, result: { ...r, home: Number(r.home), away: Number(r.away) } }),
      });
      if (res.status === 409) {
        toast.warning("Esta partida já foi pontuada anteriormente.");
        setMatches(prev => prev.map(m => m.id === matchId ? { ...m, scored: true } : m));
        setExpandedMatch(null);
        setScoringMatch(null);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro desconhecido");
      toast.success(`${data.scored} palpites pontuados!`);
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, scored: true, result_home: Number(r.home), result_away: Number(r.away) } : m));
      setExpandedMatch(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
    setScoringMatch(null);
  };

  const convertToTester = async (participant: Participant) => {
    setConvertingTester(participant.id);
    try {
      const data = await callEdge("setup-test-user", { participant_id: participant.id });
      if (data.results?.[0]?.ok === false) throw new Error(data.results[0].error);
      toast.success(`✅ ${participant.full_name} → @${data.results[0].username} / 123456`);
      setParticipants(prev => prev.map(p => p.id === participant.id ? { ...p, is_test_user: true } : p));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao converter");
    }
    setConvertingTester(null);
  };

  const createTester = async () => {
    const slug = newTesterUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!slug || slug.length < 2) { toast.error("Username inválido (mín. 2 caracteres)"); return; }
    setCreatingTester(true);
    try {
      const data = await callEdge("setup-test-user", { create_username: slug });
      if (!data.ok) throw new Error(data.error);
      toast.success(`✅ @${slug} criado! Login: ${slug} / 123456`);
      setNewTesterUsername("");
      fetchParticipantsAndMatches();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar tester");
    }
    setCreatingTester(false);
  };

  const syncESPN = async () => {
    setSyncingESPN(true);
    try {
      // converte YYYY-MM-DD → YYYYMMDD para a edge function
      const dates = syncDates.filter(Boolean).map(d => d.replace(/-/g, ""));
      const data = await callEdge("sync-matches", { dates });
      toast.success(`✅ ${data.synced} jogos sincronizados da ESPN`);
      if (data.errors?.length) toast.error(`Erros: ${data.errors.join(", ")}`);
      fetchParticipantsAndMatches();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao sincronizar");
    }
    setSyncingESPN(false);
  };

  const setResult = (matchId: number, field: string, value: unknown) => {
    setResults(prev => ({
      ...prev,
      [matchId]: { home: "", away: "", winner: "", goalFirstHalf: null, goalSecondHalf: null, redCard: null, penalty: null, varGoal: null, firstToScore: "", possession: "", ...prev[matchId], [field]: value },
    }));
  };

  // ── Site settings actions ──────────────────────────────────────────────────

  const saveSetting = async (key: string) => {
    setSavingKey(key);
    const raw = settingDrafts[key] ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw; // treat as plain string JSON value
    }
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value: parsed, updated_at: new Date().toISOString(), updated_by: user?.id ?? null });
    if (error) toast.error(`Erro ao salvar ${key}: ${error.message}`);
    else toast.success(`✅ ${key} salvo`);
    setSavingKey(null);
  };

  // ── Coupons actions ────────────────────────────────────────────────────────

  const createCoupon = async () => {
    const code = newCoupon.code.trim().toUpperCase();
    if (!code || !newCoupon.value) { toast.error("Código e valor obrigatórios"); return; }
    setCreatingCoupon(true);
    const { error } = await supabase.from("coupons").insert({
      code,
      kind: newCoupon.kind,
      value: Number(newCoupon.value),
      max_uses: newCoupon.max_uses ? Number(newCoupon.max_uses) : null,
      valid_until: newCoupon.valid_until || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(`✅ Cupom ${code} criado`);
      setNewCoupon({ code: "", kind: "percent", value: "", max_uses: "", valid_until: "" });
      fetchCoupons();
    }
    setCreatingCoupon(false);
  };

  const toggleCoupon = async (coupon: Coupon) => {
    const { error } = await supabase.from("coupons").update({ active: !coupon.active }).eq("id", coupon.id);
    if (error) toast.error(error.message);
    else setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, active: !c.active } : c));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const paid = participants.filter(p => p.payment_confirmed).length;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "kpis",         label: "Visão Geral",  icon: <BarChart3 className="w-3 h-3" /> },
    { id: "participants", label: "Inscritos",     icon: <Users className="w-3 h-3" /> },
    { id: "matches",      label: "Resultados",    icon: <Trophy className="w-3 h-3" /> },
    { id: "content",      label: "Conteúdo",      icon: <Settings className="w-3 h-3" /> },
    { id: "coupons",      label: "Cupons",        icon: <Ticket className="w-3 h-3" /> },
    { id: "testers",      label: "Testers",       icon: <Zap className="w-3 h-3" /> },
  ];

  return (
    <div className="min-h-screen pb-24 pt-4 px-4">
      <h1 className="text-2xl font-black mb-1">Painel Admin</h1>
      <p className="text-xs text-muted-foreground mb-4">{paid} pagos / {participants.length} inscritos</p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all ${activeTab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      {activeTab === "kpis" && (
        <div>
          {kpisLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : kpis ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "Inscritos", value: kpis.total_participants },
                { label: "Pagos", value: kpis.paid_participants },
                { label: "Testers", value: kpis.test_users },
                { label: "Palpites", value: kpis.total_predictions },
                { label: "Jogos pontuados", value: `${kpis.scored_matches} / ${kpis.total_matches}` },
                { label: "Cupons ativos", value: kpis.active_coupons },
                { label: "Inscritos 7d", value: kpis.signups_7d },
                { label: "Receita estimada", value: `R$ ${kpis.revenue_estimate.toLocaleString("pt-BR")}` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-glass rounded-xl p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-2xl font-black text-foreground">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <button onClick={fetchKpis} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              Carregar KPIs
            </button>
          )}
        </div>
      )}

      {/* ── Participants ──────────────────────────────────────────────────── */}
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

      {/* ── Matches ───────────────────────────────────────────────────────── */}
      {activeTab === "matches" && (
        <div className="space-y-3">
          {/* ESPN Sync panel */}
          <div className="bg-glass rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" /> Sincronizar ESPN
            </p>
            <div className="flex gap-2">
              <input
                type="date"
                value={syncDates[0]}
                onChange={e => setSyncDates(prev => [e.target.value, prev[1]])}
                className="flex-1 px-3 py-2 rounded-lg bg-muted text-foreground border border-border text-xs outline-none focus:border-primary"
              />
              <input
                type="date"
                value={syncDates[1]}
                onChange={e => setSyncDates(prev => [prev[0], e.target.value])}
                className="flex-1 px-3 py-2 rounded-lg bg-muted text-foreground border border-border text-xs outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={syncESPN}
              disabled={syncingESPN}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
            >
              {syncingESPN ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              {syncingESPN ? "Sincronizando..." : "Buscar jogos da ESPN"}
            </button>
          </div>

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
                    { field: "varGoal", label: "VAR Anulou Gol" },
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

      {/* ── Site Content ─────────────────────────────────────────────────── */}
      {activeTab === "content" && (
        <div className="space-y-4">
          {settingsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <>
              {siteSettings.map(s => (
                <div key={s.key} className="bg-glass rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.key}</p>
                  <textarea
                    rows={s.key === "prizes_json" ? 10 : 3}
                    value={settingDrafts[s.key] ?? ""}
                    onChange={e => setSettingDrafts(prev => ({ ...prev, [s.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-muted text-foreground border border-border text-xs font-mono outline-none focus:border-primary resize-y"
                  />
                  <button
                    onClick={() => saveSetting(s.key)}
                    disabled={savingKey === s.key}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
                  >
                    {savingKey === s.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    {savingKey === s.key ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              ))}
              {siteSettings.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma configuração encontrada. Aplique a migration site_settings primeiro.</p>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Coupons ───────────────────────────────────────────────────────── */}
      {activeTab === "coupons" && (
        <div className="space-y-4">
          {/* Create coupon form */}
          <div className="bg-glass rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Novo Cupom</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Código (ex: COPA10)"
                  value={newCoupon.code}
                  onChange={e => setNewCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") }))}
                  className="w-full px-3 py-2 rounded-lg bg-muted text-foreground border border-border text-xs outline-none focus:border-primary font-mono"
                />
              </div>
              <select
                value={newCoupon.kind}
                onChange={e => setNewCoupon(prev => ({ ...prev, kind: e.target.value as "percent" | "fixed" }))}
                className="px-3 py-2 rounded-lg bg-muted text-foreground border border-border text-xs outline-none focus:border-primary"
              >
                <option value="percent">% Percentual</option>
                <option value="fixed">R$ Fixo</option>
              </select>
              <input
                type="number"
                min={0}
                placeholder={newCoupon.kind === "percent" ? "Ex: 10 (= 10%)" : "Ex: 50 (= R$50)"}
                value={newCoupon.value}
                onChange={e => setNewCoupon(prev => ({ ...prev, value: e.target.value }))}
                className="px-3 py-2 rounded-lg bg-muted text-foreground border border-border text-xs outline-none focus:border-primary"
              />
              <input
                type="number"
                min={1}
                placeholder="Usos máx. (vazio = ∞)"
                value={newCoupon.max_uses}
                onChange={e => setNewCoupon(prev => ({ ...prev, max_uses: e.target.value }))}
                className="px-3 py-2 rounded-lg bg-muted text-foreground border border-border text-xs outline-none focus:border-primary"
              />
              <input
                type="date"
                placeholder="Validade (opcional)"
                value={newCoupon.valid_until}
                onChange={e => setNewCoupon(prev => ({ ...prev, valid_until: e.target.value }))}
                className="px-3 py-2 rounded-lg bg-muted text-foreground border border-border text-xs outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={createCoupon}
              disabled={creatingCoupon}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
            >
              {creatingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              {creatingCoupon ? "Criando..." : "Criar Cupom"}
            </button>
          </div>

          {/* Coupons list */}
          {couponsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-2">
              {coupons.map(c => (
                <div key={c.id} className="bg-glass rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm font-mono">{c.code}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {c.kind === "percent" ? `${c.value}% off` : `R$ ${c.value} off`}
                      {" · "}
                      {c.uses_count}{c.max_uses != null ? `/${c.max_uses}` : ""} usos
                      {c.valid_until ? ` · até ${new Date(c.valid_until).toLocaleDateString("pt-BR")}` : ""}
                    </p>
                  </div>
                  <button onClick={() => toggleCoupon(c)} className="shrink-0 text-primary">
                    {c.active
                      ? <ToggleRight className="w-6 h-6 text-green-500" />
                      : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
                  </button>
                </div>
              ))}
              {coupons.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum cupom criado.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Testers ───────────────────────────────────────────────────────── */}
      {activeTab === "testers" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Crie testers do zero ou ative participantes existentes. Login: <strong className="text-foreground">username</strong> / <strong className="text-foreground">123456</strong>
            </p>
          </div>

          <div className="bg-glass rounded-xl p-3 space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Criar Novo Tester</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTesterUsername}
                onChange={(e) => setNewTesterUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="username (ex: joaopaulo)"
                className="flex-1 px-3 py-2 rounded-lg bg-muted text-foreground border border-border text-xs outline-none focus:border-primary"
              />
              <button
                onClick={createTester}
                disabled={creatingTester || newTesterUsername.trim().length < 2}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
              >
                {creatingTester ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                {creatingTester ? "..." : "Criar"}
              </button>
            </div>
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
    </div>
  );
};

export default Admin;
