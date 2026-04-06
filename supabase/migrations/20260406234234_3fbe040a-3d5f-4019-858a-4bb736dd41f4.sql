
-- Add state and city to participants
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT '';
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '';
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS referral_code uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.participants(id);
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS bonus_points integer NOT NULL DEFAULT 0;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create unique index on referral_code
CREATE UNIQUE INDEX IF NOT EXISTS participants_referral_code_idx ON public.participants(referral_code);

-- Groups table
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text NOT NULL DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX groups_invite_code_idx ON public.groups(invite_code);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read groups" ON public.groups
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create groups" ON public.groups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can update own groups" ON public.groups
  FOR UPDATE TO authenticated USING (auth.uid() = admin_id);

-- Group members table
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read own groups" ON public.group_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join groups" ON public.group_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON public.group_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
