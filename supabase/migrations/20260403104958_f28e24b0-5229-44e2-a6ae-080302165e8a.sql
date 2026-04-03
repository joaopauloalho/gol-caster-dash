
CREATE TABLE public.matches (
  id SERIAL PRIMARY KEY,
  match_number INTEGER NOT NULL UNIQUE,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  stage TEXT NOT NULL,
  group_name TEXT NOT NULL,
  city TEXT NOT NULL,
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  flag_a TEXT NOT NULL DEFAULT '🏳️',
  flag_b TEXT NOT NULL DEFAULT '🏳️',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read matches" ON public.matches
  FOR SELECT TO anon, authenticated USING (true);
