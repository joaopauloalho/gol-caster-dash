import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { LogIn, LogOut } from "lucide-react";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-glass border-b border-border px-4 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <button onClick={() => navigate("/")} className="font-black text-sm text-foreground">
          ⚽ Super Bolão
        </button>

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
