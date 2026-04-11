-- =============================================================================
-- participants_public_view — adicionar payment_confirmed (não é PII)
--
-- Motivo: Rankings precisa filtrar "quem pode participar" (pago | tester)
-- sem expor CPF, whatsapp, email ou birth_date.
-- payment_confirmed é status de negócio, não dado pessoal.
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
  is_test_user,
  payment_confirmed   -- usado para filtro de ranking (quem acessa o jogo)
FROM public.participants;

GRANT SELECT ON public.participants_public_view TO authenticated;
