-- Adiciona coluna starts_at (timestamp com timezone) na tabela matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS starts_at timestamptz;

-- Popula starts_at a partir de date + time já existentes (formato "DD/MM/YYYY" + "HH:MM", horário BRT = UTC-3)
-- Exemplo: date="12/06/2026", time="16:00" → starts_at = "2026-06-12 19:00:00+00"
UPDATE matches
SET starts_at = to_timestamp(
  regexp_replace(date, '^(\d{2})/(\d{2})/(\d{4})$', '\3-\2-\1') || ' ' || "time",
  'YYYY-MM-DD HH24:MI'
) AT TIME ZONE 'America/Sao_Paulo'
WHERE date IS NOT NULL AND "time" IS NOT NULL AND starts_at IS NULL;

-- Índice para queries de partidas abertas
CREATE INDEX IF NOT EXISTS idx_matches_starts_at ON matches(starts_at);
