-- =============================================================================
-- COUPONS — cupons de desconto gerenciáveis pelo admin
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.coupons (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text        NOT NULL UNIQUE,
  kind        text        NOT NULL CHECK (kind IN ('percent', 'fixed')),
  value       numeric     NOT NULL CHECK (value > 0),
  max_uses    int         NULL,              -- NULL = ilimitado
  uses_count  int         NOT NULL DEFAULT 0,
  valid_from  timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz NULL,              -- NULL = sem expiração
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Apenas admin gerencia cupons
CREATE POLICY "coupons: admin all"
  ON public.coupons FOR ALL TO authenticated
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- COUPON_REDEMPTIONS — histórico de resgates (para uso futuro no checkout)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id      uuid        NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id        uuid        NOT NULL REFERENCES auth.users(id),
  participant_id uuid        NULL REFERENCES public.participants(id),
  redeemed_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Admin lê tudo; usuário lê seus próprios resgates
CREATE POLICY "coupon_redemptions: admin all"
  ON public.coupon_redemptions FOR ALL TO authenticated
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "coupon_redemptions: user read own"
  ON public.coupon_redemptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Índice para lookup rápido no validate-coupon
CREATE INDEX IF NOT EXISTS coupons_code_idx ON public.coupons (code);
CREATE INDEX IF NOT EXISTS coupon_redemptions_user_coupon_idx ON public.coupon_redemptions (user_id, coupon_id);
