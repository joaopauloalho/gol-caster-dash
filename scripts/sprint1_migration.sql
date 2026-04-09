-- ═══════════════════════════════════════════════════════════════════
-- SPRINT 1 — Super Bolão Copa 2026
-- Execute no Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Auto-gerar referral_code único no cadastro ───────────────
CREATE OR REPLACE FUNCTION fn_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := upper(left(md5(gen_random_uuid()::text), 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_referral_code ON participants;
CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT ON participants
  FOR EACH ROW
  EXECUTE FUNCTION fn_generate_referral_code();

-- Corrige participantes existentes sem código
UPDATE participants
  SET referral_code = upper(left(md5(gen_random_uuid()::text), 8))
  WHERE referral_code IS NULL OR referral_code = '';

-- ─── 2. +200 pts ao indicador quando pagamento confirmado ─────────
CREATE OR REPLACE FUNCTION fn_award_referral_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_confirmed = true AND (OLD.payment_confirmed IS DISTINCT FROM true) THEN
    IF NEW.referred_by IS NOT NULL THEN
      UPDATE participants
        SET bonus_points = bonus_points + 200
        WHERE id = NEW.referred_by;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_award_referral_payment ON participants;
CREATE TRIGGER trg_award_referral_payment
  AFTER UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION fn_award_referral_payment();

-- ─── 3. +100 pts bônus quando indicado faz o 10º palpite ─────────
CREATE OR REPLACE FUNCTION fn_award_prediction_milestone()
RETURNS TRIGGER AS $$
DECLARE
  v_count    INT;
  v_referrer UUID;
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM predictions WHERE user_id = NEW.user_id;

  IF v_count = 10 THEN
    SELECT referred_by INTO v_referrer
      FROM participants
      WHERE user_id = NEW.user_id
      LIMIT 1;

    IF v_referrer IS NOT NULL THEN
      UPDATE participants
        SET bonus_points = bonus_points + 100
        WHERE id = v_referrer;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prediction_milestone ON predictions;
CREATE TRIGGER trg_prediction_milestone
  AFTER INSERT ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION fn_award_prediction_milestone();

-- ─── 4. RLS em predictions — cada user só acessa os seus ─────────
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "predictions_own" ON predictions;
CREATE POLICY "predictions_own"
  ON predictions FOR ALL
  USING  (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- ─── 5. get_server_time (lock anti-fraude) ───────────────────────
CREATE OR REPLACE FUNCTION get_server_time()
RETURNS timestamptz
LANGUAGE sql SECURITY DEFINER
AS $$ SELECT now(); $$;

-- ─── 6. Contagem de indicados confirmados (para o dashboard MGM) ──
CREATE OR REPLACE FUNCTION get_referral_stats(p_participant_id UUID)
RETURNS TABLE (
  total_referred    INT,
  paid_referred     INT,
  bonus_earned      INT
) AS $$
  SELECT
    COUNT(*)::INT                                              AS total_referred,
    COUNT(*) FILTER (WHERE payment_confirmed = true)::INT     AS paid_referred,
    (COUNT(*) FILTER (WHERE payment_confirmed = true) * 200)::INT AS bonus_earned
  FROM participants
  WHERE referred_by = p_participant_id;
$$ LANGUAGE sql SECURITY DEFINER;
