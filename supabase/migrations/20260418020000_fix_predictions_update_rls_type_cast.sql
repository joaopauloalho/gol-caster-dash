-- Fix: UPDATE policy was using auth.uid() = user_id but user_id is TEXT, not uuid.
-- operator does not exist: uuid = text caused all prediction upserts to fail on conflict path.
DROP POLICY IF EXISTS "Predictions: update own unscored" ON public.predictions;

CREATE POLICY "Predictions: update own unscored" ON public.predictions
  FOR UPDATE TO authenticated
  USING (
    auth.uid()::text = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = predictions.match_id
        AND matches.scored = true
    )
  )
  WITH CHECK (
    auth.uid()::text = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = predictions.match_id
        AND matches.scored = true
    )
  );
