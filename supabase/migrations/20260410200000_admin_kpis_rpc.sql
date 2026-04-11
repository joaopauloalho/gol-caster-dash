-- =============================================================================
-- ADMIN_KPIS — RPC SECURITY DEFINER para painel admin
-- Retorna métricas agregadas sem expor dados individuais via RLS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_kpis()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Apenas admin pode chamar
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Sem permissão de admin';
  END IF;

  SELECT jsonb_build_object(
    'total_participants', (SELECT count(*) FROM participants),
    'paid_participants',  (SELECT count(*) FROM participants WHERE payment_confirmed = true),
    'test_users',         (SELECT count(*) FROM participants WHERE is_test_user = true),
    'total_predictions',  (SELECT count(*) FROM predictions),
    'scored_matches',     (SELECT count(*) FROM matches WHERE scored = true),
    'total_matches',      (SELECT count(*) FROM matches),
    'active_coupons',     (SELECT count(*) FROM coupons WHERE active = true),
    'signups_7d',         (SELECT count(*) FROM participants WHERE created_at >= now() - interval '7 days'),
    'revenue_estimate',   (SELECT coalesce(sum(
                            CASE plan
                              WHEN 'pro-avista'    THEN 250
                              WHEN 'pro-parcelado' THEN 300
                              ELSE 0
                            END
                          ), 0) FROM participants WHERE payment_confirmed = true)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_kpis() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_kpis() TO authenticated;
