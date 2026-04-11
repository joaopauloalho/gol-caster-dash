/**
 * sync-matches — busca jogos do Brasileirão na API ESPN e faz upsert na tabela matches
 *
 * Segurança: requer admin (app_metadata.role === "admin")
 * ESPN é pública — fetch feito server-side para evitar CORS e centralizar lógica
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Converte Date UTC para BRT (UTC-3)
function toBRT(date: Date) {
  return new Date(date.getTime() - 3 * 60 * 60 * 1000);
}

function formatDate(date: Date): string {
  const brt = toBRT(date);
  const d = String(brt.getUTCDate()).padStart(2, "0");
  const m = String(brt.getUTCMonth() + 1).padStart(2, "0");
  const y = brt.getUTCFullYear();
  return `${d}/${m}/${y}`;
}

function formatTime(date: Date): string {
  const brt = toBRT(date);
  const h = String(brt.getUTCHours()).padStart(2, "0");
  const min = String(brt.getUTCMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

// Converte date "DD/MM/YYYY" + time "HH:MM" (BRT) para ISO UTC
function toStartsAt(dateStr: string, timeStr: string): string | null {
  try {
    const [day, month, year] = dateStr.split("/");
    const localDate = new Date(`${year}-${month}-${day}T${timeStr}:00-03:00`);
    return localDate.toISOString();
  } catch {
    return null;
  }
}

// "20260411" → data formatada p/ query ESPN
function toESPNDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${dd}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ── Verificação de admin ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Autenticação obrigatória" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (user.app_metadata?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Sem permissão de admin" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ── Fim verificação ───────────────────────────────────────────────────

    const body = await req.json().catch(() => ({}));

    // Datas a sincronizar: padrão = hoje + amanhã (BRT)
    let dates: string[];
    if (Array.isArray(body.dates) && body.dates.length) {
      dates = body.dates; // ex: ["20260411", "20260412"]
    } else {
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      dates = [toESPNDate(today), toESPNDate(tomorrow)];
    }

    const upserted: unknown[] = [];
    const errors: string[] = [];

    for (const dateStr of dates) {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/bra.1/scoreboard?lang=pt&dates=${dateStr}`
      );
      if (!res.ok) {
        errors.push(`ESPN ${dateStr}: HTTP ${res.status}`);
        continue;
      }

      const json = await res.json();
      const events = json.events ?? [];
      const roundLabel = json.week?.number
        ? `Rodada ${json.week.number}`
        : (events[0]?.season?.slug ?? "Brasileirão");

      for (const event of events) {
        try {
          const competition = event.competitions[0];
          const comps = competition.competitors ?? [];
          const home = comps.find((c: { homeAway: string }) => c.homeAway === "home");
          const away = comps.find((c: { homeAway: string }) => c.homeAway === "away");
          if (!home || !away) continue;

          const startDate = new Date(event.date);
          const matchNumber = parseInt(event.id.slice(-5)); // ex: 41068

          const formattedDate = formatDate(startDate);
          const formattedTime = formatTime(startDate);

          const row = {
            espn_id:      String(event.id),
            match_number: matchNumber,
            team_a:       home.team.displayName,
            team_b:       away.team.displayName,
            flag_a:       home.team.logo ?? "",
            flag_b:       away.team.logo ?? "",
            date:         formattedDate,
            time:         formattedTime,
            starts_at:    toStartsAt(formattedDate, formattedTime),
            city:         competition.venue?.address?.city ?? "",
            stage:        "Brasileirão",
            group_name:   roundLabel,
            // Placar se o jogo já terminou
            ...(event.status?.type?.completed && {
              scored:      true,
              result_home: parseInt(home.score ?? "0"),
              result_away: parseInt(away.score ?? "0"),
              result_winner: home.score > away.score ? "A"
                           : away.score > home.score ? "B"
                           : "X",
            }),
          };

          upserted.push(row);
        } catch (e) {
          errors.push(`Evento ${event.id}: ${(e as Error).message}`);
        }
      }
    }

    if (upserted.length > 0) {
      const { error: dbErr } = await supabase
        .from("matches")
        .upsert(upserted, { onConflict: "espn_id" });

      if (dbErr) throw new Error(`DB upsert: ${dbErr.message}`);
    }

    return new Response(
      JSON.stringify({ synced: upserted.length, errors, dates }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
