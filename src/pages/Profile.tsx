import { User, Trophy, Target, Zap, Star, LogOut } from "lucide-react";

const Profile = () => {
  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="px-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">Jogador</h1>
            <p className="text-xs text-muted-foreground">jogador@email.com</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Trophy, label: "Posição", value: "#42", color: "text-primary" },
            { icon: Star, label: "Pontos", value: "632", color: "text-foreground" },
            { icon: Target, label: "Placares Exatos", value: "5", color: "text-secondary" },
            { icon: Zap, label: "Gabaritos", value: "0", color: "text-primary" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-glass rounded-xl p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
              <div className={`text-2xl font-black ${color}`}>{value}</div>
              <div className="text-[10px] text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button className="w-full bg-glass rounded-xl p-4 text-left flex items-center gap-3 text-foreground text-sm font-medium">
            <Trophy className="w-4 h-4 text-primary" /> Meus Palpites
          </button>
          <button className="w-full bg-glass rounded-xl p-4 text-left flex items-center gap-3 text-foreground text-sm font-medium">
            <Star className="w-4 h-4 text-primary" /> Histórico de Pontos
          </button>
          <button className="w-full bg-glass rounded-xl p-4 text-left flex items-center gap-3 text-destructive text-sm font-medium">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
