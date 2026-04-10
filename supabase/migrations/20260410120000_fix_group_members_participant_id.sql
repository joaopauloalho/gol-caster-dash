-- group_members.participant_id era NOT NULL mas o código usa user_id.
-- Torna nullable para não quebrar inserts existentes.
ALTER TABLE public.group_members ALTER COLUMN participant_id DROP NOT NULL;

-- Garante unique constraint usando user_id (já que participant_id pode ser null)
-- Remove o índice antigo que usava participant_id e recria com user_id
DROP INDEX IF EXISTS group_members_unique_idx;
CREATE UNIQUE INDEX IF NOT EXISTS group_members_unique_user_idx ON public.group_members(group_id, user_id) WHERE user_id IS NOT NULL;
