import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") || "*", // "*" only in dev; set SITE_URL in prod
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Verificação de admin ──────────────────────────────────────────────────
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
    const { data: { user: caller }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (caller.app_metadata?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Sem permissão de admin" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ── Fim verificação ───────────────────────────────────────────────────────

    const body = await req.json();

    // ── MODE 1: create fresh tester from just a username ──────────────────────
    if (body.create_username) {
      const slug = String(body.create_username).toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (!slug || slug.length < 2) {
        return new Response(JSON.stringify({ error: "Username inválido" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const testEmail = `${slug}@bolao.test`;

      // Create auth user
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: "123456",
        email_confirm: true,
      });

      if (authErr) {
        return new Response(JSON.stringify({ error: authErr.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = authData.user.id;

      // CPF único: 11 primeiros dígitos do UUID
      const fakeCpf = userId.replace(/-/g, "").replace(/[^0-9]/g, "").padEnd(11, "0").slice(0, 11);

      // Create participant row
      const { error: pErr } = await supabase.from("participants").insert({
        id: userId,
        user_id: userId,
        full_name: slug,
        username: slug,
        email: testEmail,
        whatsapp: "00000000000",
        cpf: fakeCpf,
        birth_date: "2000-01-01",
        state: "SP",
        city: "Teste",
        plan: "basico",
        payment_confirmed: false,
        is_test_user: true,
      });

      if (pErr) {
        // Rollback auth user
        await supabase.auth.admin.deleteUser(userId);
        return new Response(JSON.stringify({ error: pErr.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ ok: true, username: slug, email: testEmail }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── MODE 2: convert existing participant(s) to tester ─────────────────────
    const ids: string[] = Array.isArray(body.participant_ids)
      ? body.participant_ids
      : body.participant_id
      ? [body.participant_id]
      : [];

    if (ids.length === 0) {
      return new Response(JSON.stringify({ error: "participant_id(s) ou create_username obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { id: string; username: string | null; ok: boolean; error?: string }[] = [];

    for (const participantId of ids) {
      const { data: p } = await supabase
        .from("participants")
        .select("id, user_id, username, full_name, is_test_user")
        .eq("id", participantId)
        .maybeSingle();

      if (!p) {
        results.push({ id: participantId, username: null, ok: false, error: "Participante não encontrado" });
        continue;
      }

      const slug = (p.username || p.full_name.split(" ")[0]).toLowerCase().replace(/[^a-z0-9_]/g, "");
      const testEmail = `${slug}@bolao.test`;

      const { error: authErr } = await supabase.auth.admin.updateUserById(p.user_id, {
        email: testEmail,
        password: "123456",
        email_confirm: true,
      });

      if (authErr) {
        results.push({ id: participantId, username: p.username, ok: false, error: authErr.message });
        continue;
      }

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
