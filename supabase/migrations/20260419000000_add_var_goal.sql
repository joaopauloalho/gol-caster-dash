-- Adiciona campo VAR anulou gol nos resultados e palpites
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS result_var_goal boolean;

ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS has_var_goal boolean;
