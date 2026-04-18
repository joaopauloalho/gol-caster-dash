-- =============================================================================
-- INDEXES E CONSTRAINTS — performance e integridade
-- =============================================================================

-- =============================================================================
-- CREATE PREDICTIONS TABLE (Missing from previous migrations)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.predictions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    match_id bigint NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    home_score integer,
    away_score integer,
    winner_pick text,
    goal_first_half boolean,
    goal_second_half boolean,
    has_red_card boolean,
    has_penalty boolean,
    has_var_goal boolean,
    first_to_score text,
    possession_winner text,
    points_earned integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- predictions: índice composto para lookup por usuário+jogo (onConflict em MatchCard)
CREATE INDEX IF NOT EXISTS idx_predictions_user_match
  ON public.predictions (user_id, match_id);

-- predictions: constraint única — alinha com o onConflict: "user_id,match_id" do client
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.predictions'::regclass
      AND conname = 'predictions_user_id_match_id_key'
  ) THEN
    ALTER TABLE public.predictions
      ADD CONSTRAINT predictions_user_id_match_id_key UNIQUE (user_id, match_id);
  END IF;
END $$;