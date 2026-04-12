import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { LogIn, LogOut } from "lucide-react";

const anchorLinks = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#pontuacao", label: "Pontuação" },
  { href: "#rankings", label: "Rankings" },
];

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className="sticky top-0 z-50 bg-glass border-b border-border px-4 py-3 safe-area-top">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <button onClick={() => navigate("/")} className="font-black text-sm text-foreground">
          ⚽ Super Bolão
        </button>

        {isHome && (
          <nav className="hidden sm:flex items-center gap-4" aria-label="Âncoras da página">
            {anchorLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        )}

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="text-destructive hover:text-destructive/80 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
          >
            <LogIn className="w-3.5 h-3.5" /> Entrar
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
