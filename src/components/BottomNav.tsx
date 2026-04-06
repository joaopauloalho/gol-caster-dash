import { Home, Target, Trophy, BarChart3, Users, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Target, label: "Jogos", path: "/jogos" },
  { icon: Users, label: "Grupos", path: "/grupos" },
  { icon: BarChart3, label: "Rankings", path: "/rankings" },
  { icon: User, label: "Perfil", path: "/perfil" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-glass border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-1 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
