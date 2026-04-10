-- Seed: Brasileirão Série A 2026
-- Execute no Supabase Dashboard → SQL Editor
-- Ou via CLI: supabase db push
--
-- Remove jogos anteriores do Brasileirão (se existirem)
DELETE FROM matches WHERE stage = 'Brasileirão';

-- Rodada 1 — 12-13 Abr 2026
INSERT INTO matches (match_number, date, time, stage, group_name, city, team_a, team_b, flag_a, flag_b) VALUES
(1001, '12/04/2026', '16:00', 'Brasileirão', 'Rodada 1', 'Rio de Janeiro',  'Flamengo',      'Botafogo',      '', ''),
(1002, '12/04/2026', '18:30', 'Brasileirão', 'Rodada 1', 'São Paulo',       'Palmeiras',     'Corinthians',   '', ''),
(1003, '12/04/2026', '21:00', 'Brasileirão', 'Rodada 1', 'São Paulo',       'São Paulo',     'Fluminense',    '', ''),
(1004, '13/04/2026', '16:00', 'Brasileirão', 'Rodada 1', 'Porto Alegre',    'Internacional', 'Cruzeiro',      '', ''),
(1005, '13/04/2026', '18:30', 'Brasileirão', 'Rodada 1', 'Belo Horizonte',  'Atlético-MG',   'Grêmio',        '', ''),

-- Rodada 2 — 19-20 Abr 2026
(1006, '19/04/2026', '16:00', 'Brasileirão', 'Rodada 2', 'Rio de Janeiro',  'Botafogo',      'Palmeiras',     '', ''),
(1007, '19/04/2026', '18:30', 'Brasileirão', 'Rodada 2', 'Rio de Janeiro',  'Fluminense',    'Flamengo',      '', ''),
(1008, '19/04/2026', '21:00', 'Brasileirão', 'Rodada 2', 'São Paulo',       'Corinthians',   'Internacional', '', ''),
(1009, '20/04/2026', '16:00', 'Brasileirão', 'Rodada 2', 'Porto Alegre',    'Grêmio',        'São Paulo',     '', ''),
(1010, '20/04/2026', '18:30', 'Brasileirão', 'Rodada 2', 'Belo Horizonte',  'Cruzeiro',      'Atlético-MG',   '', ''),

-- Rodada 3 — 26-27 Abr 2026
(1011, '26/04/2026', '16:00', 'Brasileirão', 'Rodada 3', 'Rio de Janeiro',  'Flamengo',      'Corinthians',   '', ''),
(1012, '26/04/2026', '18:30', 'Brasileirão', 'Rodada 3', 'São Paulo',       'Palmeiras',     'Internacional', '', ''),
(1013, '26/04/2026', '21:00', 'Brasileirão', 'Rodada 3', 'São Paulo',       'São Paulo',     'Atlético-MG',   '', ''),
(1014, '27/04/2026', '16:00', 'Brasileirão', 'Rodada 3', 'Rio de Janeiro',  'Botafogo',      'Grêmio',        '', ''),
(1015, '27/04/2026', '18:30', 'Brasileirão', 'Rodada 3', 'Rio de Janeiro',  'Fluminense',    'Cruzeiro',      '', ''),

-- Rodada 4 — 3-4 Mai 2026
(1016, '03/05/2026', '16:00', 'Brasileirão', 'Rodada 4', 'Porto Alegre',    'Internacional', 'Flamengo',      '', ''),
(1017, '03/05/2026', '18:30', 'Brasileirão', 'Rodada 4', 'Belo Horizonte',  'Atlético-MG',   'Palmeiras',     '', ''),
(1018, '03/05/2026', '21:00', 'Brasileirão', 'Rodada 4', 'Porto Alegre',    'Grêmio',        'Fluminense',    '', ''),
(1019, '04/05/2026', '16:00', 'Brasileirão', 'Rodada 4', 'Belo Horizonte',  'Cruzeiro',      'Corinthians',   '', ''),
(1020, '04/05/2026', '18:30', 'Brasileirão', 'Rodada 4', 'São Paulo',       'São Paulo',     'Botafogo',      '', ''),

-- Rodada 5 — 10-11 Mai 2026
(1021, '10/05/2026', '16:00', 'Brasileirão', 'Rodada 5', 'Rio de Janeiro',  'Flamengo',      'Atlético-MG',   '', ''),
(1022, '10/05/2026', '18:30', 'Brasileirão', 'Rodada 5', 'São Paulo',       'Palmeiras',     'Grêmio',        '', ''),
(1023, '10/05/2026', '21:00', 'Brasileirão', 'Rodada 5', 'Rio de Janeiro',  'Botafogo',      'Cruzeiro',      '', ''),
(1024, '11/05/2026', '16:00', 'Brasileirão', 'Rodada 5', 'São Paulo',       'Corinthians',   'Fluminense',    '', ''),
(1025, '11/05/2026', '18:30', 'Brasileirão', 'Rodada 5', 'Porto Alegre',    'Internacional', 'São Paulo',     '', '');
