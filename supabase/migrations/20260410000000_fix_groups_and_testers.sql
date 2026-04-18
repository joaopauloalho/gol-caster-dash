-- Groups table (create if not exists)
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text NOT NULL DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS groups_invite_code_idx ON public.groups(invite_code);

-- Add admin_id if table existed without it
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='groups' AND policyname='Anyone authenticated can read groups') THEN
    CREATE POLICY "Anyone authenticated can read groups" ON public.groups FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='groups' AND policyname='Users can create groups') THEN
    CREATE POLICY "Users can create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='groups' AND policyname='Admins can update own groups') THEN
    CREATE POLICY "Admins can update own groups" ON public.groups FOR UPDATE TO authenticated USING (auth.uid() = admin_id);
  END IF;
END $$;

-- Group members table (create if not exists)
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  participant_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS participant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS group_members_unique_idx ON public.group_members(group_id, participant_id);

-- Also support user_id column for Groups.tsx compatibility
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='group_members' AND policyname='Members can read own groups') THEN
    CREATE POLICY "Members can read own groups" ON public.group_members FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='group_members' AND policyname='Users can join groups') THEN
    CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='group_members' AND policyname='Users can leave groups') THEN
    CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- is_test_user column on participants
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS is_test_user boolean NOT NULL DEFAULT false;

-- username column on participants
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS username text;
CREATE UNIQUE INDEX IF NOT EXISTS participants_username_idx ON public.participants(username);

-- favorite_team column on participants
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS favorite_team text;
