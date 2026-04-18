-- Fix: fn_award_prediction_milestone compared participants.user_id (uuid) with
-- NEW.user_id (text) from predictions table causing "operator does not exist: uuid = text"
-- on every prediction INSERT, blocking all palpite saves.
CREATE OR REPLACE FUNCTION public.fn_award_prediction_milestone()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_count    INT;
  v_referrer UUID;
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM predictions WHERE user_id = NEW.user_id;

  IF v_count = 10 THEN
    SELECT referred_by INTO v_referrer
      FROM participants
      WHERE user_id = NEW.user_id::uuid
      LIMIT 1;

    IF v_referrer IS NOT NULL THEN
      UPDATE participants
        SET bonus_points = bonus_points + 100
        WHERE id = v_referrer;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
