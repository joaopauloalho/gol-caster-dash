import { useEffect, useReducer } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { LiveMatchEvent, LiveMatchState } from '@/types/realtime'

// ---------------------------------------------------------------------------
// Status derivation helpers
// ---------------------------------------------------------------------------

type MatchStatus = LiveMatchState['status']

function deriveStatus(events: LiveMatchEvent[]): MatchStatus {
  if (events.length === 0) return 'scheduled'

  // Walk backwards — the last status-changing event wins
  for (let i = events.length - 1; i >= 0; i--) {
    const type = events[i].event_type
    if (type === 'fulltime') return 'finished'
    if (type === 'shootout_start') return 'shootout'
    if (type === 'overtime_start') return 'overtime'
    if (type === 'halftime') return 'halftime'
    if (type === 'kickoff') return 'live'
  }

  // Events exist but none are lifecycle events (e.g. only goals before kickoff
  // was recorded) — treat as live to avoid hiding activity.
  return 'live'
}

function deriveMinute(events: LiveMatchEvent[]): number | null {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].minute !== null) return events[i].minute
  }
  return null
}

function deriveScore(events: LiveMatchEvent[]): { score_home: number; score_away: number } {
  if (events.length === 0) return { score_home: 0, score_away: 0 }
  const last = events[events.length - 1]
  return { score_home: last.score_home, score_away: last.score_away }
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type Action = { type: 'ADD_EVENT'; event: LiveMatchEvent } | { type: 'INIT'; events: LiveMatchEvent[] }

function buildState(match_id: string, events: LiveMatchEvent[]): LiveMatchState {
  const { score_home, score_away } = deriveScore(events)
  return {
    match_id,
    score_home,
    score_away,
    current_minute: deriveMinute(events),
    status: deriveStatus(events),
    events,
  }
}

function reducer(state: LiveMatchState, action: Action): LiveMatchState {
  switch (action.type) {
    case 'INIT':
      return buildState(state.match_id, action.events)

    case 'ADD_EVENT': {
      // Guard against duplicates (Realtime can occasionally re-deliver)
      if (state.events.some((e) => e.id === action.event.id)) return state
      const events = [...state.events, action.event]
      return buildState(state.match_id, events)
    }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRealtimeMatch(matchId: string): LiveMatchState {
  const [state, dispatch] = useReducer(reducer, {
    match_id: matchId,
    score_home: 0,
    score_away: 0,
    current_minute: null,
    status: 'scheduled',
    events: [],
  } satisfies LiveMatchState)

  useEffect(() => {
    if (!matchId) return

    let cancelled = false

    // 1. Fetch historical events ordered oldest-first so score derivation is
    //    correct (we always read the last element for the current score).
    supabase
      .from('live_match_events')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled || error) return
        dispatch({ type: 'INIT', events: (data ?? []) as LiveMatchEvent[] })
      })

    // 2. Subscribe to new INSERT events for this match only.
    //    The filter `match_id=eq.<uuid>` is pushed to the Supabase Realtime
    //    server so only rows matching the condition are broadcast to this
    //    client — no client-side filtering needed.
    const channel = supabase
      .channel(`live_match_events:match_id=eq.${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_match_events',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          if (cancelled) return
          dispatch({ type: 'ADD_EVENT', event: payload.new as LiveMatchEvent })
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [matchId])

  return state
}
