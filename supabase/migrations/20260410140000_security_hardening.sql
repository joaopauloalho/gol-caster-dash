-- =============================================================================
-- SECURITY HARDENING — 2026-04-10
-- Auditoria completa pré-lançamento. Cada bloco explica o risco corrigido.
-- =============================================================================

-- =============================================================================
-- 1. PARTICIPANTS — remover UPDATE direto por usuário
--
-- RISCO CRÍTICO: qualquer usuário autenticado podia executar
--   supabase.from('participants').update({ payment_confirmed:true, bonus_points:99999 })
-- O frontend nunca precisa fazer UPDATE direto; todos os updates legítimos
-- acontecem via service role em edge functions (webhook, score-match, admin).
-- =============================================================================
DROP POLICY IF EXISTS "Users can update own participant" ON public.participants;

-- =============================================================================
-- 2. SUBSCRIPTIONS — remover UPDATE direto por usuário
--
-- RISCO CRÍTICO: qualquer usuário autenticado podia executar
--   supabase.from('subscriptions').update({ payment_status:'active' })
-- Confirmação de pagamento DEVE ocorrer apenas via webhook/admin com service role.
-- =============================================================================
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

-- =============================================================================
-- 3. PARTICIPANTS SELECT — consolidar em política segura
--
-- RISCO ALTO: políticas anteriores "Admin can read all participants" e
-- "Authenticated users can read all participants" expunham CPF, whatsapp,
-- birth_date de todos os usuários a qualquer autenticado — violação de LGPD.
--
-- Nova policy: usuário lê apenas o próprio; admin lê tudo.
-- Admin identificado por app_metadata.role = 'admin' (configurado via dashboard
-- ou edge function setup-admin-role).
-- ATENÇÃO: Admin.tsx ainda faz SELECT direto com JWT do usuário; funciona
-- enquanto o admin tiver o role configurado. TODO pré-launch: migrar Admin.tsx
-- para edge function com service role e remover esta policy permissiva de admin.
-- =============================================================================
DROP POLICY IF EXISTS "Authenticated users can read all participants" ON public.participants;
DROP POLICY IF EXISTS "Admin can read all participants"              ON public.participants;
DROP POLICY IF EXISTS "Admin or own: read participants"              ON public.participants;
DROP POLICY IF EXISTS "Users can read own participant or admin reads all" ON public.participants;

-- Função auxiliar: verifica se o usuário logado é admin via app_metadata
-- SECURITY DEFINER => roda como postgres, pode ler auth.users
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (raw_app_meta_data->>'role') = 'admin'
     FROM auth.users WHERE id = auth.uid()),
    false
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Policy consolidada
CREATE POLICY "Participants: own row or admin"
  ON public.participants FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- =============================================================================
-- 4. VIEW PÚBLICA DE RANKING (sem PII)
--
-- Usada em GroupDetail, Rankings e qualquer tela que mostre outros usuários.
-- A view roda com privilégios do owner (postgres), bypassa RLS da tabela
-- base → retorna TODOS os participantes mas APENAS as colunas não-sensíveis.
-- CPF, whatsapp, email, birth_date NÃO são expostos.
-- =============================================================================
DROP VIEW IF EXISTS public.participants_public_view;
CREATE VIEW public.participants_public_view AS
SELECT
  user_id,
  username,
  full_name,
  state,
  city,
  bonus_points,
  plan,
  favorite_team,
  is_test_user
FROM public.participants;

GRANT SELECT ON public.participants_public_view TO authenticated;

-- =============================================================================
-- 5. increment_points — restringir execução ao service role
--
-- RISCO ALTO: se exposta via RPC ao authenticated, qualquer usuário podia
-- chamar supabase.rpc('increment_points', { uid: 'outro', pts: 99999 }).
-- Apenas score-match (service role) deve chamar essa função.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.increment_points(uid uuid, pts integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.participants SET bonus_points = bonus_points + pts WHERE user_id = uid;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_points(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_points(uuid, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_points(uuid, integer) FROM anon;
GRANT  EXECUTE ON FUNCTION public.increment_points(uuid, integer) TO service_role;

-- =============================================================================
-- 6. WEBHOOK_EVENTS — idempotência de pagamentos
--
-- RISCO CRÍTICO: sem esta tabela, um replay do webhook do MP (ou chamada
-- maliciosa para a URL pública) confirmaria o pagamento múltiplas vezes.
-- A UNIQUE (provider, event_id) garante que cada payment_id é processado
-- exatamente uma vez. INSERT falha com conflito → skip seguro.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     text        NOT NULL DEFAULT 'mercadopago',
  event_id     text        NOT NULL,
  event_type   text        NOT NULL DEFAULT 'payment',
  status       text        NOT NULL DEFAULT 'processed', -- processed | failed
  user_id      uuid,                                     -- para auditoria
  payload      jsonb       NOT NULL DEFAULT '{}',
  processed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- Sem policies públicas: NENHUM usuário autenticado acessa; apenas service role.

-- =============================================================================
-- 7. PREDICTIONS RLS
--
-- Tabela não tinha RLS ativo — qualquer INSERT/SELECT era público via anon key.
-- Usuário só pode criar/ler/alterar seus próprios palpites.
-- UPDATE permitido apenas enquanto o jogo não foi pontuado (points_earned = 0).
-- =============================================================================
ALTER TABLE IF EXISTS public.predictions ENABLE ROW LEVEL SECURITY;

-- user_id em predictions é TEXT (não uuid) → cast explícito
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'predictions') THEN

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='predictions'
      AND policyname='Predictions: read own') THEN
      CREATE POLICY "Predictions: read own" ON public.predictions
        FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='predictions'
      AND policyname='Predictions: insert own') THEN
      CREATE POLICY "Predictions: insert own" ON public.predictions
        FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='predictions'
      AND policyname='Predictions: update own unscored') THEN
      CREATE POLICY "Predictions: update own unscored" ON public.predictions
        FOR UPDATE TO authenticated
        USING  (auth.uid()::text = user_id AND points_earned = 0)
        WITH CHECK (auth.uid()::text = user_id AND points_earned = 0);
    END IF;
  END IF;
END $$;

-- =============================================================================
-- 8. TOURNAMENT_PREDICTIONS RLS
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tournament_predictions') THEN

    EXECUTE 'ALTER TABLE public.tournament_predictions ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tournament_predictions'
      AND policyname='TournamentPredictions: read own') THEN
      CREATE POLICY "TournamentPredictions: read own" ON public.tournament_predictions
        FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tournament_predictions'
      AND policyname='TournamentPredictions: insert own') THEN
      CREATE POLICY "TournamentPredictions: insert own" ON public.tournament_predictions
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tournament_predictions'
      AND policyname='TournamentPredictions: update own unlocked') THEN
      CREATE POLICY "TournamentPredictions: update own unlocked" ON public.tournament_predictions
        FOR UPDATE TO authenticated
        USING  (auth.uid() = user_id AND locked = false)
        WITH CHECK (auth.uid() = user_id AND locked = false);
    END IF;
  END IF;
END $$;

-- =============================================================================
-- 9. GROUP_MEMBERS — reforçar política de insert/delete
--
-- Garante que um usuário só pode inserir a si mesmo como membro.
-- =============================================================================
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "group_members: insert own"
  ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
CREATE POLICY "group_members: delete own"
  ON public.group_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
