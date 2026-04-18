-- Adiciona colunas de resultado nos jogos
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS result_home integer,
  ADD COLUMN IF NOT EXISTS result_away integer,
  ADD COLUMN IF NOT EXISTS result_winner text,
  ADD COLUMN IF NOT EXISTS result_goal_first_half boolean,
  ADD COLUMN IF NOT EXISTS result_goal_second_half boolean,
  ADD COLUMN IF NOT EXISTS result_red_card boolean,
  ADD COLUMN IF NOT EXISTS result_penalty boolean,
  ADD COLUMN IF NOT EXISTS result_first_to_score text,
  ADD COLUMN IF NOT EXISTS result_possession text,
  ADD COLUMN IF NOT EXISTS scored boolean NOT NULL DEFAULT false;

-- Policy para admin ler todos os participants
CREATE POLICY "Admin can read all participants" ON public.participants
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own participant" ON public.participants;

CREATE POLICY "Users can update own participant" ON public.participants
  FOR UPDATE
  USING (auth.uid() = user_id);
