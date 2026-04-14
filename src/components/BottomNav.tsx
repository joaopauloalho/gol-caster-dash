import { Home, Target, Trophy, BarChart3, Users, User, Crosshair, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home,      label: "Início",    path: "/" },
  { icon: Target,    label: "Jogos",     path: "/jogos" },
  { icon: Crosshair, label: "Long Term", path: "/long-term" },
  { icon: Users,     label: "Grupos",    path: "/grupos" },
  { icon: BarChart3, label: "Rankings",  path: "/rankings" },
  { icon: User,      label: "Perfil",    path: "/perfil" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.app_metadata?.role === "admin";

  const allItems = isAdmin
    ? [...navItems, { icon: ShieldCheck, label: "Admin", path: "/admin" }]
    : navItems;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 safe-area-bottom"
      style={{
        background: "hsl(var(--color-surface) / 0.85)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
      }}
    >
      <div className="flex items-center justify-around py-1 px-1 max-w-lg mx-auto">
        {allItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          const isAdminTab = path === "/admin";

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              aria-current={isActive ? "page" : undefined}
              className="relative flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl min-w-[44px] min-h-[56px] justify-center transition-colors"
            >
              {/* Active pill background */}
              {isActive && (
                <motion.div
                  layoutId="bottomnav-indicator"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}

              <Icon
                className={[
                  "w-[22px] h-[22px] relative z-10 transition-colors",
                  isActive
                    ? "text-primary"
                    : isAdminTab
                      ? "text-amber-500"
                      : "text-muted-foreground",
                ].join(" ")}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={[
                  "text-[10px] font-semibold relative z-10 transition-colors leading-none",
                  isActive
                    ? "text-primary"
                    : isAdminTab
                      ? "text-amber-500"
                      : "text-muted-foreground",
                ].join(" ")}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
