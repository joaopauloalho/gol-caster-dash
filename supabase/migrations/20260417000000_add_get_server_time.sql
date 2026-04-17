-- Migration: add get_server_time RPC function
-- This function is called by MatchCard.tsx (supabase.rpc("get_server_time"))
-- to enforce server-side prediction deadlines and prevent client clock manipulation.

CREATE OR REPLACE FUNCTION public.get_server_time()
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT now();
$$;

REVOKE EXECUTE ON FUNCTION public.get_server_time() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_server_time() TO authenticated;
