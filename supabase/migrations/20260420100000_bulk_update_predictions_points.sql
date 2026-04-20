-- Migration: bulk_update_predictions_points
-- Provides a single-statement bulk UPDATE to replace the N+1 loop in score-match Edge Function.
-- Used by: supabase/functions/score-match/index.ts

CREATE OR REPLACE FUNCTION bulk_update_predictions_points(updates jsonb)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE predictions
  SET points_earned = (elem->>'points_earned')::int
  FROM jsonb_array_elements(updates) AS elem
  WHERE predictions.id = (elem->>'id')::uuid;
$$;

GRANT EXECUTE ON FUNCTION bulk_update_predictions_points(jsonb) TO service_role;
