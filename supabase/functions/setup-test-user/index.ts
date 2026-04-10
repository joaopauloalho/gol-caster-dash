import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    // Accept a single participant_id or a list
    const ids: string[] = Array.isArray(body.participant_ids)
      ? body.participant_ids
      : body.participant_id
      ? [body.participant_id]
      : [];

    if (ids.length === 0) {
      return new Response(JSON.stringify({ error: "participant_id(s) obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { id: string; username: string | null; ok: boolean; error?: string }[] = [];

    for (const participantId of ids) {
      // Fetch participant
      const { data: p, error: pErr } = await supabase
        .from("participants")
        .select("id, user_id, username, full_name, is_test_user")
        .eq("id", participantId)
        .maybeSingle();

      if (pErr || !p) {
        results.push({ id: participantId, username: null, ok: false, error: "Participante não encontrado" });
        continue;
      }

      // Derive test email from username (fallback: first name)
      const slug = (p.username || p.full_name.split(" ")[0]).toLowerCase().replace(/[^a-z0-9_]/g, "");
      const testEmail = `${slug}@bolao.test`;

      // Update auth user: set email + password + confirm email
      const { error: authErr } = await supabase.auth.admin.updateUserById(p.user_id, {
        email: testEmail,
        password: "123456",
        email_confirm: true,
      });

      if (authErr) {
        results.push({ id: participantId, username: p.username, ok: false, error: authErr.message });
        continue;
      }

      // Mark as test user
      const { error: updateErr } = await supabase
        .from("participants")
        .update({ is_test_user: true, username: p.username ?? slug })
        .eq("id", participantId);

      if (updateErr) {
        results.push({ id: participantId, username: p.username, ok: false, error: updateErr.message });
        continue;
      }

      results.push({ id: participantId, username: slug, ok: true });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
