import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BRASILEIRAO_MATCHES = [
  // Rodada 1
  { match_number: 1001, date: "12/04/2026", time: "16:00", stage: "Brasileirão", group_name: "Rodada 1", city: "Rio de Janeiro",  team_a: "Flamengo",      team_b: "Botafogo",      flag_a: "", flag_b: "" },
  { match_number: 1002, date: "12/04/2026", time: "18:30", stage: "Brasileirão", group_name: "Rodada 1", city: "São Paulo",       team_a: "Palmeiras",     team_b: "Corinthians",   flag_a: "", flag_b: "" },
  { match_number: 1003, date: "12/04/2026", time: "21:00", stage: "Brasileirão", group_name: "Rodada 1", city: "São Paulo",       team_a: "São Paulo",     team_b: "Fluminense",    flag_a: "", flag_b: "" },
  { match_number: 1004, date: "13/04/2026", time: "16:00", stage: "Brasileirão", group_name: "Rodada 1", city: "Porto Alegre",    team_a: "Internacional", team_b: "Cruzeiro",      flag_a: "", flag_b: "" },
  { match_number: 1005, date: "13/04/2026", time: "18:30", stage: "Brasileirão", group_name: "Rodada 1", city: "Belo Horizonte",  team_a: "Atlético-MG",   team_b: "Grêmio",        flag_a: "", flag_b: "" },
  // Rodada 2
  { match_number: 1006, date: "19/04/2026", time: "16:00", stage: "Brasileirão", group_name: "Rodada 2", city: "Rio de Janeiro",  team_a: "Botafogo",      team_b: "Palmeiras",     flag_a: "", flag_b: "" },
  { match_number: 1007, date: "19/04/2026", time: "18:30", stage: "Brasileirão", group_name: "Rodada 2", city: "Rio de Janeiro",  team_a: "Fluminense",    team_b: "Flamengo",      flag_a: "", flag_b: "" },
  { match_number: 1008, date: "19/04/2026", time: "21:00", stage: "Brasileirão", group_name: "Rodada 2", city: "São Paulo",       team_a: "Corinthians",   team_b: "Internacional", flag_a: "", flag_b: "" },
  { match_number: 1009, date: "20/04/2026", time: "16:00", stage: "Brasileirão", group_name: "Rodada 2", city: "Porto Alegre",    team_a: "Grêmio",        team_b: "São Paulo",     flag_a: "", flag_b: "" },
  { match_number: 1010, date: "20/04/2026", time: "18:30", stage: "Brasileirão", group_name: "Rodada 2", city: "Belo Horizonte",  team_a: "Cruzeiro",      team_b: "Atlético-MG",   flag_a: "", flag_b: "" },
  // Rodada 3
  { match_number: 1011, date: "26/04/2026", time: "16:00", stage: "Brasileirão", group_name: "Rodada 3", city: "Rio de Janeiro",  team_a: "Flamengo",      team_b: "Corinthians",   flag_a: "", flag_b: "" },
  { match_number: 1012, date: "26/04/2026", time: "18:30", stage: "Brasileirão", group_name: "Rodada 3", city: "São Paulo",       team_a: "Palmeiras",     team_b: "Internacional", flag_a: "", flag_b: "" },
  { match_number: 1013, date: "26/04/2026", time: "21:00", stage: "Brasileirão", group_name: "Rodada 3", city: "São Paulo",       team_a: "São Paulo",     team_b: "Atlético-MG",   flag_a: "", flag_b: "" },
  { match_number: 1014, date: "27/04/2026", time: "16:00", stage: "Brasileirão", group_name: "Rodada 3", city: "Rio de Janeiro",  team_a: "Botafogo",      team_b: "Grêmio",        flag_a: "", flag_b: "" },
  { match_number: 1015, date: "27/04/2026", time: "18:30", stage: "Brasileirão", group_name: "Rodada 3", city: "Rio de Janeiro",  team_a: "Fluminense",    team_b: "Cruzeiro",      flag_a: "", flag_b: "" },
  // Rodada 4
  { match_number: 1016, date: "03/05/2026", time: "16:00", stage: "Brasileirão", group_name: "Rodada 4", city: "Porto Alegre",    team_a: "Internacional", team_b: "Flamengo",      flag_a: "", flag_b: "" },
  { match_number: 1017, date: "03/05/2026", time: "18:30", stage: "Brasileirão", group_name: "Rodada 4", city: "Belo Horizonte",  team_a: "Atlético-MG",   team_b: "Palmeiras",     flag_a: "", flag_b: "" },
  { match_number: 1018, date: "03/05/2026", time: "21:00", stage: "Brasileirão", group_name: "Rodada 4", city: "Porto Alegre",    team_a: "Grêmio",        team_b: "Fluminense",    flag_a: "", flag_b: "" },
  { match_number: 1019, date: "04/05/2026", time: "16:00", stage: "Brasileirão", group_name: "Rodada 4", city: "Belo Horizonte",  team_a: "Cruzeiro",      team_b: "Corinthians",   flag_a: "", flag_b: "" },
  { match_number: 1020, date: "04/05/2026", time: "18:30", stage: "Brasileirão", group_name: "Rodada 4", city: "São Paulo",       team_a: "São Paulo",     team_b: "Botafogo",      flag_a: "", flag_b: "" },
  // Rodada 5
  { match_number: 1021, date: "10/05/2026", time: "16:00", stage: "Brasileirão", group_name: "Rodada 5", city: "Rio de Janeiro",  team_a: "Flamengo",      team_b: "Atlético-MG",   flag_a: "", flag_b: "" },
  { match_number: 1022, date: "10/05/2026", time: "18:30", stage: "Brasileirão", group_name: "Rodada 5", city: "São Paulo",       team_a: "Palmeiras",     team_b: "Grêmio",        flag_a: "", flag_b: "" },
  { match_number: 1023, date: "10/05/2026", time: "21:00", stage: "Brasileirão", group_name: "Rodada 5", city: "Rio de Janeiro",  team_a: "Botafogo",      team_b: "Cruzeiro",      flag_a: "", flag_b: "" },
  { match_number: 1024, date: "11/05/2026", time: "16:00", stage: "Brasileirão", group_name: "Rodada 5", city: "São Paulo",       team_a: "Corinthians",   team_b: "Fluminense",    flag_a: "", flag_b: "" },
  { match_number: 1025, date: "11/05/2026", time: "18:30", stage: "Brasileirão", group_name: "Rodada 5", city: "Porto Alegre",    team_a: "Internacional", team_b: "São Paulo",     flag_a: "", flag_b: "" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const clearFirst = body.clear_first === true;

    if (clearFirst) {
      await supabase.from("matches").delete().eq("stage", "Brasileirão");
    }

    const { error, count } = await supabase
      .from("matches")
      .insert(BRASILEIRAO_MATCHES, { count: "exact" });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, inserted: BRASILEIRAO_MATCHES.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
