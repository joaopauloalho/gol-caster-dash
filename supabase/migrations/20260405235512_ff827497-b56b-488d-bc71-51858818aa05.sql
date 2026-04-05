
CREATE TABLE public.participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  cpf text NOT NULL UNIQUE,
  birth_date date NOT NULL,
  payment_confirmed boolean NOT NULL DEFAULT false,
  plan text NOT NULL DEFAULT 'pro-avista',
  amount integer NOT NULL DEFAULT 25000,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own participant" ON public.participants
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own participant" ON public.participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participant" ON public.participants
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
