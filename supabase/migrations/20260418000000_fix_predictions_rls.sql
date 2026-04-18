-- Drop the overly-restrictive policy
DROP POLICY IF EXISTS "Predictions: update own unscored" ON public.predictions;

-- New policy: allow update only when the match is not yet scored
CREATE POLICY "Predictions: update own unscored" ON public.predictions
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = predictions.match_id
        AND matches.scored = true
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = predictions.match_id
        AND matches.scored = true
    )
  );