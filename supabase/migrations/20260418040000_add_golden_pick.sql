-- Palpite de Ouro: is_double_points doubles all earned points for that match.
-- Constraint: one golden pick per user per match day (based on starts_at UTC date).
ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS is_double_points boolean DEFAULT false NOT NULL;

CREATE OR REPLACE FUNCTION public.fn_check_double_points()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_count INT;
BEGIN
  IF NEW.is_double_points = false THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM predictions p
  JOIN matches m  ON m.id = p.match_id
  JOIN matches m2 ON m2.id = NEW.match_id
  WHERE p.user_id = NEW.user_id
    AND p.is_double_points = true
    AND date_trunc('day', m.starts_at)  = date_trunc('day', m2.starts_at)
    AND p.match_id != NEW.match_id;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'GOLDEN_ALREADY_USED'
      USING HINT = 'User already has a golden prediction for this match date';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_check_double_points ON public.predictions;
CREATE TRIGGER trg_check_double_points
  BEFORE INSERT OR UPDATE ON public.predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_check_double_points();
