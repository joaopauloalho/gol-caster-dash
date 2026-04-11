import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, ArrowLeft, AtSign, Zap } from "lucide-react";
import { toast } from "sonner";

type Tab = "normal" | "tester";

const Auth = () => {
  const [tab, setTab] = useState<Tab>("normal");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get("invite") || "";

  // ── Entra no grupo pelo invite_code (se vier na URL) ─────────────────────────
  const joinGroupIfInvited = async (userId: string) => {
    if (!inviteCode) return;
    // Códigos são gerados em minúsculo no banco (UUID-based)
    const { data: group } = await supabase
      .from("groups")
      .select("id, name")
      .ilike("invite_code", inviteCode)   // case-insensitive
      .maybeSingle();
    if (!group) {
      toast.error("Código de convite inválido ou expirado.");
      return;
    }
    const { error } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: userId, participant_id: userId });
    if (error && error.code !== "23505") {
      // 23505 = já é membro, ignora
      console.error("joinGroup error:", error.message);
      return;
    }
    toast.success(`Você entrou no grupo "${group.name}"! 🎉`);
  };

  // ── Login normal ──────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("E-mail ou senha incorretos.");
    } else {
      await joinGroupIfInvited(data.user.id);
      toast.success("Login realizado!");
      navigate("/jogos");
    }
    setLoading(false);
  };

  // ── Magic link ────────────────────────────────────────────────────────────────
  const handleMagicLink = async () => {
    if (!email) { toast.error("Digite seu e-mail primeiro."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/jogos` },
    });
    if (error) {
      toast.error("Erro ao enviar link: " + error.message);
    } else {
      toast.success("Link enviado! Verifique seu e-mail 📧");
    }
    setLoading(false);
  };

  // ── Login de tester (conta deve ser criada pelo admin via setup-test-user) ─────
  const handleTesterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = username.trim().toLowerCase();
    if (!slug) return;
    setLoading(true);

    const testEmail = `${slug}@bolao.test`;

    // Tenta login direto primeiro
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: "123456",
    });

    if (!loginErr) {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) await joinGroupIfInvited(u.id);
      toast.success(`Bem-vindo, @${slug}!`);
      navigate("/jogos");
      setLoading(false);
      return;
    }

    // Conta não encontrada — apenas admin pode criar testers
    toast.error("Conta não encontrada. Peça ao admin para criar seu acesso.");
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

      <div className="w-full max-w-sm space-y-7">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black text-foreground">
            Super Bolão <span className="text-gradient-gold">Nacional</span>
          </h1>
          <p className="text-sm text-muted-foreground">Entre na sua conta</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl overflow-hidden border border-border">
          {(["normal", "tester"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "normal" ? "Login" : "⚡ Acesso Rápido"}
            </button>
          ))}
        </div>

        {/* ── NORMAL LOGIN ── */}
        {tab === "normal" && (
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

            <button
              type="button"
              disabled={loading}
              onClick={handleMagicLink}
              className="w-full text-xs text-muted-foreground hover:text-primary transition-colors py-1 disabled:opacity-50"
            >
              Esqueci a senha — entrar por link no e-mail
            </button>
          </form>
        )}

        {/* ── ACESSO RÁPIDO ── */}
        {tab === "tester" && (
          <form onSubmit={handleTesterLogin} className="space-y-5">
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Digite seu <strong className="text-foreground">username</strong> de tester e a senha padrão para entrar.
                {inviteCode && (
                  <> Você vai entrar na liga <strong className="text-primary">#{inviteCode.toUpperCase()}</strong> automaticamente.</>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  required
                  placeholder="seu_username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted text-foreground border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full btn-gold py-3 rounded-xl font-bold text-sm disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        )}

        {/* Inscrição */}
        <div className="text-center space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">ou</span>
            </div>
          </div>
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
