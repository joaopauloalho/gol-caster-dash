-- =============================================================================
-- GROUP_MEMBERS SELECT — fechar leitura ampla sem recursão RLS
--
-- RISCO: sem policy de SELECT, group_members era legível por qualquer
-- autenticado (table com RLS ativo mas sem SELECT policy = acesso negado por
-- padrão no Postgres RLS). Com SELECT policy ingênua que consulte group_members
-- de dentro do USING, ocorre recursão infinita.
--
-- Solução: SECURITY DEFINER function `my_group_ids()` lê group_members como
-- postgres (bypassa RLS), retorna apenas os group_ids do usuário logado.
-- A policy SELECT usa `group_id = ANY(my_group_ids())` → sem recursão.
-- =============================================================================

-- Função auxiliar: retorna os group_ids onde o usuário logado é membro ou admin
-- SECURITY DEFINER => roda como postgres, pode ler group_members sem RLS
CREATE OR REPLACE FUNCTION public.my_group_ids()
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
      UNION
      SELECT id       FROM public.groups          WHERE admin_id = auth.uid()
    ),
    '{}'::uuid[]
  );
$$;

REVOKE EXECUTE ON FUNCTION public.my_group_ids() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.my_group_ids() TO authenticated;

-- Remove qualquer policy SELECT existente para garantir idempotência
DROP POLICY IF EXISTS "group_members: select own groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can view group members"     ON public.group_members;
DROP POLICY IF EXISTS "group_members: read"              ON public.group_members;

-- Policy: um usuário só vê membros de grupos aos quais pertence (ou é admin)
CREATE POLICY "group_members: select own groups"
  ON public.group_members FOR SELECT TO authenticated
  USING (group_id = ANY(public.my_group_ids()));
