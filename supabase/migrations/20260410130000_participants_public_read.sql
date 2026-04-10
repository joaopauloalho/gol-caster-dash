-- Permite que usuários autenticados leiam dados básicos de todos os participantes.
-- Necessário para rankings de grupos (cada membro precisa ver os outros).
-- Dados sensíveis (CPF, whatsapp) ficam protegidos pela aplicação; nenhuma tela
-- os exibe para outros usuários.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'participants'
      AND policyname = 'Authenticated users can read all participants'
  ) THEN
    CREATE POLICY "Authenticated users can read all participants"
      ON public.participants
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
