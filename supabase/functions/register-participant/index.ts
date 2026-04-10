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
    const body = await req.json();
    const { userId, fullName, email, whatsapp, cpf, birthDate, state, city, plan, referredById, favoriteTeam, groupInviteCode } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role ignora RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("participants").insert({
      id: userId,
      user_id: userId,
      full_name: fullName,
      email,
      whatsapp,
      cpf,
      birth_date: birthDate,
      state,
      city,
      plan,
      referred_by: referredById ?? null,
      payment_confirmed: false,
      favorite_team: favoriteTeam ?? null,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca referral_code gerado
    const { data: participant } = await supabase
      .from("participants")
      .select("referral_code")
      .eq("user_id", userId)
      .maybeSingle();

    // Entra no grupo automaticamente se veio com invite code
    if (groupInviteCode) {
      const { data: group } = await supabase
        .from("groups")
        .select("id")
        .eq("invite_code", groupInviteCode)
        .maybeSingle();

      if (group?.id) {
        // upsert para não quebrar se já for membro
        await supabase
          .from("group_members")
          .upsert({ group_id: group.id, participant_id: userId }, { onConflict: "group_id,participant_id" });
      }
    }

    return new Response(
      JSON.stringify({ referral_code: participant?.referral_code ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
