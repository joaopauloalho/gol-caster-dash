import { Home, Target, Trophy, BarChart3, Users, User, Crosshair, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Target, label: "Jogos", path: "/jogos" },
  { icon: Crosshair, label: "Long Term", path: "/long-term" },
  { icon: Users, label: "Grupos", path: "/grupos" },
  { icon: BarChart3, label: "Rankings", path: "/rankings" },
  { icon: User, label: "Perfil", path: "/perfil" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.app_metadata?.role === "admin";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-glass border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-1 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-lg transition-all duration-200 min-w-0 min-h-[48px] justify-center ${
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-medium">{label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          );
        })}

        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            aria-current={location.pathname === "/admin" ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-lg transition-all duration-200 min-w-0 min-h-[48px] justify-center ${
              location.pathname === "/admin"
                ? "text-primary scale-105"
                : "text-amber-500 hover:text-amber-400"
            }`}
          >
            <ShieldCheck className="w-5 h-5" strokeWidth={location.pathname === "/admin" ? 2.5 : 2} />
            <span className="text-[11px] font-medium">Admin</span>
            {location.pathname === "/admin" && (
              <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
            )}
          </button>
        )}
      </div>
    </nav>
  );
};

export default BottomNav;
