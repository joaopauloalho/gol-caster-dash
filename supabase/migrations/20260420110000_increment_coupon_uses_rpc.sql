-- =============================================================================
-- RPC: increment_coupon_uses — atomic coupon counter update
-- Called by mp-webhook and asaas-webhook after payment confirmation.
-- Uses SECURITY DEFINER so it can be called via service_role without
-- granting direct UPDATE on coupons to the webhook role.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_coupon_uses(coupon_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE coupons SET uses_count = uses_count + 1 WHERE code = coupon_code;
$$;

GRANT EXECUTE ON FUNCTION public.increment_coupon_uses(text) TO service_role;
