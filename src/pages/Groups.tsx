import { useState, useEffect } from "react";
import { Users, Plus, Copy, LogIn, Check, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Group {
  id: string;
  name: string;
  invite_code: string;
  admin_id: string;
  member_count?: number;
}

const Groups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchGroups = async () => {
    if (!user) return;
    setLoading(true);

    // Busca grupos onde é membro OU onde é admin (criador)
    const [{ data: memberships }, { data: adminGroups }] = await Promise.all([
      supabase.from("group_members").select("group_id").eq("user_id", user.id),
      supabase.from("groups").select("*").eq("admin_id", user.id),
    ]);

    const memberGroupIds = memberships?.map((m) => m.group_id) || [];
    const adminGroupIds = (adminGroups || []).map((g) => g.id);
    const allGroupIds = [...new Set([...memberGroupIds, ...adminGroupIds])];

    if (allGroupIds.length === 0) {
      setMyGroups([]);
      setLoading(false);
      return;
    }

    const { data: groups } = await supabase
      .from("groups")
      .select("*")
      .in("id", allGroupIds);

    setMyGroups((groups as Group[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !groupName.trim()) return;
    setCreating(true);
    try {
      const { data: group, error } = await supabase
        .from("groups")
        .insert({ name: groupName.trim(), admin_id: user.id })
        .select()
        .single();
      if (error) throw error;

      const { error: memberErr } = await supabase
        .from("group_members")
        .insert({ group_id: group.id, user_id: user.id, participant_id: user.id });

      if (memberErr) {
        console.warn("group_members insert:", memberErr.message);
      }

      toast.success("Grupo criado com sucesso!");
      setGroupName("");
      setShowCreate(false);
      fetchGroups();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar grupo.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setJoining(true);
    try {
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("id")
        .ilike("invite_code", joinCode.trim())
        .maybeSingle();

      if (!group) {
        toast.error("Código de convite inválido.");
        return;
      }

      const { error } = await supabase
        .from("group_members")
        .insert({ group_id: group.id, user_id: user.id, participant_id: user.id });

      if (error?.code === "23505") {
        toast.info("Você já está neste grupo.");
        return;
      }
      if (error) throw error;

      toast.success("Você entrou no grupo!");
      setJoinCode("");
      fetchGroups();
    } catch (err: any) {
      toast.error(err.message || "Erro ao entrar no grupo.");
    } finally {
      setJoining(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Código copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen pb-24 pt-4 px-4">
        <h1 className="text-2xl font-black text-foreground mb-2">👥 Grupos</h1>
        <p className="text-sm text-muted-foreground">Faça login para criar ou entrar em grupos.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="px-4 mb-4">
        <h1 className="text-2xl font-black text-foreground">👥 Grupos</h1>
        <p className="text-xs text-muted-foreground mt-1">Crie ou entre em grupos de amigos</p>
      </div>

      {/* Actions */}
      <div className="px-4 mb-4 flex gap-2">
        <Button
          onClick={() => setShowCreate(!showCreate)}
          variant={showCreate ? "secondary" : "default"}
          className="flex-1 rounded-xl font-bold text-xs"
        >
          <Plus className="w-4 h-4 mr-1" /> Criar Grupo
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="px-4 mb-4">
          <Card className="border-primary/20">
            <CardContent className="pt-4 space-y-3">
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nome do grupo"
                maxLength={50}
              />
              <Button onClick={handleCreate} disabled={creating || !groupName.trim()} className="w-full btn-gold rounded-xl font-bold">
                {creating ? "Criando..." : "Criar Grupo"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Join Form */}
      <div className="px-4 mb-6">
        <Card className="border-border">
          <CardContent className="pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Entrar com código</p>
            <div className="flex gap-2">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Cole o código do convite"
                maxLength={8}
              />
              <Button onClick={handleJoin} disabled={joining || !joinCode.trim()} variant="secondary" className="rounded-xl font-bold">
                <LogIn className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Groups */}
      <div className="px-4">
        <h2 className="text-sm font-black text-foreground mb-3">Meus Grupos</h2>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
        ) : myGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Você ainda não está em nenhum grupo. Crie um ou entre com um código!
          </div>
        ) : (
          <div className="space-y-2">
            {myGroups.map((g) => (
              <div
                key={g.id}
                className="bg-glass rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-glass/80 transition-colors"
                onClick={() => navigate(`/grupos/${g.id}`)}
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-foreground truncate">{g.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    Código: <span className="font-mono text-foreground">{g.invite_code}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); copyCode(g.invite_code, g.id); }}
                  className="text-muted-foreground hover:text-foreground transition-colors p-2 shrink-0"
                >
                  {copiedId === g.id ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
                </button>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;
