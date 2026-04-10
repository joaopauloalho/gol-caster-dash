import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("E-mail ou senha incorretos.");
    } else {
      toast.success("Login realizado com sucesso!");
      navigate("/jogos");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24">
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-foreground">
            Super Bolão <span className="text-gradient-gold">Nacional</span>
          </h1>
          <p className="text-sm text-muted-foreground">Entre na sua conta</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted text-foreground border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted text-foreground border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gold py-3 rounded-xl font-bold text-sm disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="text-center space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">ou</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">Ainda não participa?</p>
          <button
            onClick={() => navigate("/")}
            className="w-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors py-3 rounded-xl font-bold text-sm"
          >
            Fazer minha inscrição
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
