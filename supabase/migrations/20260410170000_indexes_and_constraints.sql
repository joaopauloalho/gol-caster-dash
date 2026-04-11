-- =============================================================================
-- INDEXES E CONSTRAINTS — performance e integridade
-- =============================================================================

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

-- group_members: índice por user_id (RLS my_group_ids, Rankings grupo, Profile)
CREATE INDEX IF NOT EXISTS idx_group_members_user_id
  ON public.group_members (user_id);

-- group_members: índice por group_id (busca de membros de um grupo)
CREATE INDEX IF NOT EXISTS idx_group_members_group_id
  ON public.group_members (group_id);

-- participants: índice por user_id (lookup em useParticipant, PaymentReturn, register-participant)
CREATE INDEX IF NOT EXISTS idx_participants_user_id
  ON public.participants (user_id);

-- participants: índice por referral_code (lookup de indicação no onboarding)
CREATE INDEX IF NOT EXISTS idx_participants_referral_code
  ON public.participants (referral_code);

-- tournament_predictions: RLS UPDATE só quando locked=false (índice parcial ajuda filter)
CREATE INDEX IF NOT EXISTS idx_tournament_predictions_user_id
  ON public.tournament_predictions (user_id);
