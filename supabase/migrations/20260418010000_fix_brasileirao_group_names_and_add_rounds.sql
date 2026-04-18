-- Fix group_name for existing Brasileirão matches (preserves IDs → preserves predictions)
UPDATE matches
SET group_name = 'Rodada 1'
WHERE stage = 'Brasileirão';

-- Insert Rodadas 2-5 (match_numbers 1006-1025, no conflict with ESPN-synced matches 41xxx)
INSERT INTO matches (match_number, date, time, stage, group_name, city, team_a, team_b, flag_a, flag_b, starts_at) VALUES
(1006, '19/04/2026', '16:00', 'Brasileirão', 'Rodada 2', 'Rio de Janeiro',  'Botafogo',      'Palmeiras',     '', '', '2026-04-19 19:00:00+00'),
(1007, '19/04/2026', '18:30', 'Brasileirão', 'Rodada 2', 'Rio de Janeiro',  'Fluminense',    'Flamengo',      '', '', '2026-04-19 21:30:00+00'),
(1008, '19/04/2026', '21:00', 'Brasileirão', 'Rodada 2', 'São Paulo',       'Corinthians',   'Internacional', '', '', '2026-04-20 00:00:00+00'),
(1009, '20/04/2026', '16:00', 'Brasileirão', 'Rodada 2', 'Porto Alegre',    'Grêmio',        'São Paulo',     '', '', '2026-04-20 19:00:00+00'),
(1010, '20/04/2026', '18:30', 'Brasileirão', 'Rodada 2', 'Belo Horizonte',  'Cruzeiro',      'Atlético-MG',   '', '', '2026-04-20 21:30:00+00'),
(1011, '26/04/2026', '16:00', 'Brasileirão', 'Rodada 3', 'Rio de Janeiro',  'Flamengo',      'Corinthians',   '', '', '2026-04-26 19:00:00+00'),
(1012, '26/04/2026', '18:30', 'Brasileirão', 'Rodada 3', 'São Paulo',       'Palmeiras',     'Internacional', '', '', '2026-04-26 21:30:00+00'),
(1013, '26/04/2026', '21:00', 'Brasileirão', 'Rodada 3', 'São Paulo',       'São Paulo',     'Atlético-MG',   '', '', '2026-04-27 00:00:00+00'),
(1014, '27/04/2026', '16:00', 'Brasileirão', 'Rodada 3', 'Rio de Janeiro',  'Botafogo',      'Grêmio',        '', '', '2026-04-27 19:00:00+00'),
(1015, '27/04/2026', '18:30', 'Brasileirão', 'Rodada 3', 'Rio de Janeiro',  'Fluminense',    'Cruzeiro',      '', '', '2026-04-27 21:30:00+00'),
(1016, '03/05/2026', '16:00', 'Brasileirão', 'Rodada 4', 'Porto Alegre',    'Internacional', 'Flamengo',      '', '', '2026-05-03 19:00:00+00'),
(1017, '03/05/2026', '18:30', 'Brasileirão', 'Rodada 4', 'Belo Horizonte',  'Atlético-MG',   'Palmeiras',     '', '', '2026-05-03 21:30:00+00'),
(1018, '03/05/2026', '21:00', 'Brasileirão', 'Rodada 4', 'Porto Alegre',    'Grêmio',        'Fluminense',    '', '', '2026-05-04 00:00:00+00'),
(1019, '04/05/2026', '16:00', 'Brasileirão', 'Rodada 4', 'Belo Horizonte',  'Cruzeiro',      'Corinthians',   '', '', '2026-05-04 19:00:00+00'),
(1020, '04/05/2026', '18:30', 'Brasileirão', 'Rodada 4', 'São Paulo',       'São Paulo',     'Botafogo',      '', '', '2026-05-04 21:30:00+00'),
(1021, '10/05/2026', '16:00', 'Brasileirão', 'Rodada 5', 'Rio de Janeiro',  'Flamengo',      'Atlético-MG',   '', '', '2026-05-10 19:00:00+00'),
(1022, '10/05/2026', '18:30', 'Brasileirão', 'Rodada 5', 'São Paulo',       'Palmeiras',     'Grêmio',        '', '', '2026-05-10 21:30:00+00'),
(1023, '10/05/2026', '21:00', 'Brasileirão', 'Rodada 5', 'Rio de Janeiro',  'Botafogo',      'Cruzeiro',      '', '', '2026-05-11 00:00:00+00'),
(1024, '11/05/2026', '16:00', 'Brasileirão', 'Rodada 5', 'São Paulo',       'Corinthians',   'Fluminense',    '', '', '2026-05-11 19:00:00+00'),
(1025, '11/05/2026', '18:30', 'Brasileirão', 'Rodada 5', 'Porto Alegre',    'Internacional', 'São Paulo',     '', '', '2026-05-11 21:30:00+00');
