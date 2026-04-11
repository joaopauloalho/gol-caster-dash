import { useState, useEffect } from "react";
import { Trophy, Star, Target, Lock, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useParticipant } from "@/hooks/useParticipant";
import { useSubscription } from "@/hooks/useSubscription";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { translateTeams } from "@/lib/teamNames";
import { CountryCombobox } from "@/components/ui/country-combobox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CopaTeam {
  displayName: string;
  logoUrl: string;
}

const TEAMS_FALLBACK: CopaTeam[] = [
  { displayName: "Brasil", logoUrl: "" },
  { displayName: "Argentina", logoUrl: "" },
  { displayName: "França", logoUrl: "" },
  { displayName: "Inglaterra", logoUrl: "" },
  { displayName: "Alemanha", logoUrl: "" },
  { displayName: "Espanha", logoUrl: "" },
  { displayName: "Portugal", logoUrl: "" },
  { displayName: "Holanda", logoUrl: "" },
];

const players = [
  "Vinícius Jr.", "Mbappé", "Haaland", "Bellingham", "Messi",
  "Salah", "Rodri", "Yamal", "Endrick", "Saka",
  "Kane", "Neymar", "Raphinha", "Lewandowski", "Álvarez",
];

const youngPlayers = [
  "Yamal", "Endrick", "Mainoo", "Savinho", "Güler",
  "Moukoko", "Garnacho", "Estêvão", "Cubarsí", "Mathys Tel",
];

const brazilPhases = [
  "Fase de Grupos", "Oitavas de Final", "Quartas de Final",
  "Semifinal", "Final", "Campeão",
];

interface SelectCardProps {
  title: string;
  points: number;
  icon: React.ReactNode;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

const SelectCard = ({ title, points, icon, options, value, onChange, disabled }: SelectCardProps) => (
  <div className={`rounded-xl p-4 transition-colors ${value ? "bg-glass border border-green-500/30" : "bg-glass"}`}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-bold text-sm text-foreground">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <Check className="w-3.5 h-3.5 text-green-400" />}
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{points} pts</span>
      </div>
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full bg-muted text-foreground rounded-lg px-3 py-2.5 text-sm font-medium border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="">Selecione...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

interface ComboCardProps {
  title: string;
  points: number;
  icon: React.ReactNode;
  options: CopaTeam[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
}

const ComboCard = ({ title, points, icon, options, value, onChange, placeholder, disabled, loading }: ComboCardProps) => (
  <div className={`rounded-xl p-4 transition-colors ${value ? "bg-glass border border-green-500/30" : "bg-glass"}`}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-bold text-sm text-foreground">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <Check className="w-3.5 h-3.5 text-green-400" />}
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{points} pts</span>
      </div>
    </div>
    {loading ? (
      <div className="h-11 bg-muted rounded-lg animate-pulse" />
    ) : (
      <CountryCombobox
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    )}
  </div>
);

const LongTerm = () => {
  const { user } = useAuth();
  const { hasPaid } = useParticipant();
  const { isActive } = useSubscription();
  const { settings } = useSiteSettings();
  const paywallActive = settings.feature_flags?.paywall_active ?? true;
  const navigate = useNavigate();
  const [champion, setChampion] = useState("");
  const [finalist1, setFinalist1] = useState("");
  const [finalist2, setFinalist2] = useState("");
  const [semi1, setSemi1] = useState("");
  const [semi2, setSemi2] = useState("");
  const [semi3, setSemi3] = useState("");
  const [semi4, setSemi4] = useState("");
  const [topScorer, setTopScorer] = useState("");
  const [brScorer, setBrScorer] = useState("");
  const [youngPlayer, setYoungPlayer] = useState("");
  const [brPhase, setBrPhase] = useState("");
  const [locked, setLocked] = useState(false);
  const [copaTeams, setCopaTeams] = useState<CopaTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  // ── Fetch seleções da Copa via ESPN + tradução pt-BR ───────────────────���─────
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch(
          "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams"
        );
        const json = await res.json();
        const raw = json?.sports?.[0]?.leagues?.[0]?.teams ?? [];
        const mapped: CopaTeam[] = raw.map((entry: any) => ({
          displayName: entry.team.displayName as string,
          logoUrl: entry.team.logos?.[0]?.href ?? "",
        }));
        const translated = translateTeams(mapped);
        const sorted = translated.sort((a, b) =>
          a.displayName.localeCompare(b.displayName, "pt-BR")
        );
        setCopaTeams(sorted.length > 0 ? sorted : TEAMS_FALLBACK);
      } catch (err) {
        console.error("Erro ao buscar seleções da ESPN:", err);
        setCopaTeams(TEAMS_FALLBACK);
      } finally {
        setTeamsLoading(false);
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("tournament_predictions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.champion) setChampion(data.champion);
        if (data.finalist_1) setFinalist1(data.finalist_1);
        if (data.finalist_2) setFinalist2(data.finalist_2);
        if (data.semi_1) setSemi1(data.semi_1);
        if (data.semi_2) setSemi2(data.semi_2);
        if (data.semi_3) setSemi3(data.semi_3);
        if (data.semi_4) setSemi4(data.semi_4);
        if (data.top_scorer) setTopScorer(data.top_scorer);
        if (data.brazil_scorer) setBrScorer(data.brazil_scorer);
        if (data.young_player) setYoungPlayer(data.young_player);
        if (data.brazil_phase) setBrPhase(data.brazil_phase);
        setLocked(data.locked);
      });
  }, [user]);

  const allFields = [champion, finalist1, finalist2, semi1, semi2, semi3, semi4, topScorer, brScorer, youngPlayer, brPhase];
  const filledCount = allFields.filter(Boolean).length;

  const handleLock = async () => {
    if (!user) {
      toast.error("Faça login para salvar previsões.");
      navigate("/auth");
      return;
    }
    if (paywallActive && !isActive && !hasPaid) {
      toast.error("Assine o plano para salvar previsões!", {
        action: { label: "Ver Planos", onClick: () => navigate("/planos") },
      });
      return;
    }
    const { error } = await supabase.from("tournament_predictions").upsert(
      {
        user_id: user.id,
        champion,
        finalist_1: finalist1,
        finalist_2: finalist2,
        semi_1: semi1,
        semi_2: semi2,
        semi_3: semi3,
        semi_4: semi4,
        top_scorer: topScorer,
        brazil_scorer: brScorer,
        young_player: youngPlayer,
        brazil_phase: brPhase,
        locked: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) {
      toast.error("Erro ao salvar previsões.");
      return;
    }
    setLocked(true);
    toast.success("Previsões travadas com sucesso!");
  };

  const lockButtonClass = locked
    ? "bg-secondary text-secondary-foreground"
    : filledCount === 11
      ? "btn-gold"
      : "bg-muted text-muted-foreground cursor-not-allowed";

  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="px-4 mb-4">
        <h1 className="text-2xl font-black text-foreground">🎯 Long Term</h1>
        <p className="text-xs text-muted-foreground mt-1">Previsões estratégicas — preenchimento único antes da 1ª rodada</p>
      </div>

      {/* Progress */}
      <div className="px-4 mb-6">
        <div className="bg-glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground">Progresso</span>
            <span className="text-xs font-bold text-primary">{filledCount}/11</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(filledCount / 11) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* Campeão */}
        <ComboCard
          title="🏆 Campeão"
          points={100}
          icon={<Trophy className="w-4 h-4 text-primary" />}
          options={copaTeams}
          value={champion}
          onChange={setChampion}
          placeholder="Selecione o campeão..."
          disabled={locked}
          loading={teamsLoading}
        />

        {/* Finalistas */}
        <ComboCard
          title="Finalista 1"
          points={30}
          icon={<Star className="w-4 h-4 text-gold-light" />}
          options={copaTeams}
          value={finalist1}
          onChange={setFinalist1}
          placeholder="Selecione o finalista..."
          disabled={locked}
          loading={teamsLoading}
        />
        <ComboCard
          title="Finalista 2"
          points={30}
          icon={<Star className="w-4 h-4 text-gold-light" />}
          options={copaTeams}
          value={finalist2}
          onChange={setFinalist2}
          placeholder="Selecione o finalista..."
          disabled={locked}
          loading={teamsLoading}
        />

        {/* Semifinalistas */}
        <div className="pt-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Semifinalistas (20 pts cada)</h3>
          <div className="space-y-2">
            {[
              { v: semi1, s: setSemi1, label: "Semi 1" },
              { v: semi2, s: setSemi2, label: "Semi 2" },
              { v: semi3, s: setSemi3, label: "Semi 3" },
              { v: semi4, s: setSemi4, label: "Semi 4" },
            ].map(({ v, s, label }) => (
              <div key={label} className={`rounded-xl px-3 py-2 transition-colors ${v ? "bg-glass border border-green-500/30" : "bg-glass"}`}>
                {teamsLoading ? (
                  <div className="h-11 bg-muted rounded-lg animate-pulse" />
                ) : (
                  <CountryCombobox
                    options={copaTeams}
                    value={v}
                    onChange={s}
                    placeholder={label}
                    disabled={locked}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Artilheiro, Jovem, Destino Brasil */}
        <SelectCard title="⚽ Artilheiro da Copa" points={50} icon={<Target className="w-4 h-4 text-secondary" />} options={players} value={topScorer} onChange={setTopScorer} disabled={locked} />
        <SelectCard title="🇧🇷 Artilheiro do Brasil" points={40} icon={<Target className="w-4 h-4 text-secondary" />} options={["Vinícius Jr.", "Raphinha", "Endrick", "Rodrygo", "Richarlison", "Neymar"]} value={brScorer} onChange={setBrScorer} disabled={locked} />
        <SelectCard title="🌟 Melhor Jovem (≤21)" points={50} icon={<Star className="w-4 h-4 text-primary" />} options={youngPlayers} value={youngPlayer} onChange={setYoungPlayer} disabled={locked} />
        <SelectCard title="🇧🇷 Destino do Brasil" points={50} icon={<Trophy className="w-4 h-4 text-secondary" />} options={brazilPhases} value={brPhase} onChange={setBrPhase} disabled={locked} />

        {/* Lock Button */}
        {locked ? (
          <button
            disabled
            className="w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all mt-4 bg-secondary text-secondary-foreground"
          >
            <Check className="w-4 h-4" /> Previsões Travadas!
          </button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={filledCount < 11}
                className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all mt-4 ${lockButtonClass}`}
              >
                <Lock className="w-4 h-4" /> Salvar e Travar Previsões ({filledCount}/11)
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Travar previsões definitivamente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Após confirmar, suas previsões de longo prazo não poderão ser alteradas.
                  Esta ação é permanente. Tem certeza que preencheu tudo corretamente?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Revisar ainda</AlertDialogCancel>
                <AlertDialogAction onClick={handleLock}>Sim, travar agora</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
};

export default LongTerm;
