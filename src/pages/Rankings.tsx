import { useState } from "react";
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award } from "lucide-react";

const mockRanking = [
  { pos: 1, name: "Carlos Silva", points: 847, change: 2, exactScores: 12, gabaritos: 2 },
  { pos: 2, name: "Ana Rodrigues", points: 823, change: -1, exactScores: 11, gabaritos: 1 },
  { pos: 3, name: "João Pedro", points: 801, change: 1, exactScores: 10, gabaritos: 2 },
  { pos: 4, name: "Maria Santos", points: 798, change: 0, exactScores: 9, gabaritos: 1 },
  { pos: 5, name: "Lucas Oliveira", points: 785, change: 3, exactScores: 8, gabaritos: 0 },
  { pos: 6, name: "Fernanda Lima", points: 770, change: -2, exactScores: 8, gabaritos: 1 },
  { pos: 7, name: "Rafael Costa", points: 756, change: 0, exactScores: 7, gabaritos: 0 },
  { pos: 8, name: "Juliana Alves", points: 742, change: 1, exactScores: 7, gabaritos: 1 },
  { pos: 9, name: "Thiago Mendes", points: 730, change: -1, exactScores: 6, gabaritos: 0 },
  { pos: 10, name: "Camila Souza", points: 715, change: 4, exactScores: 6, gabaritos: 0 },
];

const PosIcon = ({ pos }: { pos: number }) => {
  if (pos === 1) return <Crown className="w-5 h-5 text-primary" />;
  if (pos === 2) return <Medal className="w-5 h-5 text-gold-light" />;
  if (pos === 3) return <Award className="w-5 h-5 text-secondary" />;
  return <span className="text-sm font-black text-muted-foreground w-5 text-center">{pos}</span>;
};

const ChangeIndicator = ({ change }: { change: number }) => {
  if (change > 0) return <span className="flex items-center gap-0.5 text-[10px] font-bold text-secondary"><TrendingUp className="w-3 h-3" />+{change}</span>;
  if (change < 0) return <span className="flex items-center gap-0.5 text-[10px] font-bold text-destructive"><TrendingDown className="w-3 h-3" />{change}</span>;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
};

const Rankings = () => {
  const [tab, setTab] = useState<"geral" | "diario">("geral");

  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="px-4 mb-4">
        <h1 className="text-2xl font-black text-foreground">📊 Rankings</h1>
        <p className="text-xs text-muted-foreground mt-1">Acompanhe sua posição em tempo real</p>
      </div>

      {/* Your Position */}
      <div className="px-4 mb-4">
        <div className="bg-glass-gold rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Sua Posição</div>
            <div className="text-3xl font-black text-primary">#42</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Seus Pontos</div>
            <div className="text-3xl font-black text-foreground">632</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Até o Líder</div>
            <div className="text-xl font-black text-destructive">-215</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {(["geral", "diario"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {t === "geral" ? "🏆 Geral" : "📅 Diário"}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      <div className="px-4 mb-4">
        <div className="flex items-end justify-center gap-2">
          {[mockRanking[1], mockRanking[0], mockRanking[2]].map((user, i) => {
            const heights = ["h-20", "h-28", "h-16"];
            const order = [1, 0, 2];
            return (
              <div key={user.pos} className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground mb-1">
                  {user.name.charAt(0)}
                </div>
                <span className="text-[10px] font-bold text-foreground text-center truncate w-full">{user.name.split(" ")[0]}</span>
                <span className="text-[10px] font-bold text-primary">{user.points}</span>
                <div className={`w-full ${heights[i]} rounded-t-lg mt-1 flex items-center justify-center ${
                  order[i] === 0 ? "bg-primary/20 border border-primary/30" : "bg-muted"
                }`}>
                  <PosIcon pos={user.pos} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="px-4 space-y-2">
        {mockRanking.slice(3).map((user) => (
          <div key={user.pos} className="bg-glass rounded-xl p-3 flex items-center gap-3">
            <PosIcon pos={user.pos} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-foreground truncate">{user.name}</div>
              <div className="text-[10px] text-muted-foreground">
                {user.exactScores} exatos · {user.gabaritos} gabaritos
              </div>
            </div>
            <div className="text-right">
              <div className="font-black text-sm text-foreground">{user.points}</div>
              <ChangeIndicator change={user.change} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rankings;
