-- Adiciona coluna espn_id para upsert via API ESPN
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS espn_id text UNIQUE;

-- Índice para lookup rápido no sync
CREATE INDEX IF NOT EXISTS matches_espn_id_idx ON public.matches (espn_id);
