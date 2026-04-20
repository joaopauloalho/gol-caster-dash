// The canonical shape of a live match event written to the DB by any ingestor
export type LiveMatchEventType =
  | 'goal'
  | 'yellow_card'
  | 'red_card'
  | 'penalty_awarded'
  | 'kickoff'
  | 'halftime'
  | 'fulltime'
  | 'overtime_start'
  | 'shootout_start'

export interface LiveMatchEvent {
  id: string
  match_id: number           // FK to matches.id (integer)
  event_type: LiveMatchEventType
  minute: number | null      // match minute (null for kickoff/halftime/fulltime)
  team: 'home' | 'away' | null
  player_name: string | null
  score_home: number
  score_away: number
  created_at: string
}

// Shape the live scoreboard state derived from events
export interface LiveMatchState {
  match_id: number
  score_home: number
  score_away: number
  current_minute: number | null
  status: 'scheduled' | 'live' | 'halftime' | 'overtime' | 'shootout' | 'finished'
  events: LiveMatchEvent[]
}

// Interface that any future ingestor Edge Function MUST implement
// when writing to live_match_events table
export interface LiveEventPayload {
  match_id: number
  event_type: LiveMatchEventType
  minute?: number
  team?: 'home' | 'away'
  player_name?: string
  score_home: number
  score_away: number
}
