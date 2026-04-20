CREATE TABLE public.live_match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id integer NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('goal','yellow_card','red_card','penalty_awarded','kickoff','halftime','fulltime','overtime_start','shootout_start')),
  minute smallint,
  team text CHECK (team IN ('home','away')),
  player_name text,
  score_home smallint NOT NULL DEFAULT 0,
  score_away smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_live_match_events_match_id ON public.live_match_events(match_id);
CREATE INDEX idx_live_match_events_created_at ON public.live_match_events(created_at DESC);

ALTER TABLE public.live_match_events ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read live events
CREATE POLICY "Authenticated users can read live events"
  ON public.live_match_events FOR SELECT
  TO authenticated USING (true);

-- Only service_role can insert (via ingestor Edge Function)
-- No INSERT policy needed for authenticated — ingestors use service_role

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_match_events;
