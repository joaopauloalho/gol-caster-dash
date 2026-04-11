/**
 * sync-brasileirao-now.cjs
 * 1. Apaga todos os jogos stage='Brasileirão' do banco
 * 2. Busca os 10 jogos do fim de semana na ESPN (11/04 e 12/04)
 * 3. Insere no banco com logos reais e horários em BRT
 * 4. Se ESPN retornar vazio, insere os 10 jogos manualmente (fallback)
 *
 * Uso:
 *   SUPABASE_URL=https://<ref>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role> \
 *   node scripts/sync-brasileirao-now.cjs
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Helpers de data ────────────────────────────────────────────────────────

function toBRT(date) {
  return new Date(date.getTime() - 3 * 60 * 60 * 1000);
}

function formatDate(date) {
  const brt = toBRT(date);
  const d = String(brt.getUTCDate()).padStart(2, "0");
  const m = String(brt.getUTCMonth() + 1).padStart(2, "0");
  const y = brt.getUTCFullYear();
  return `${d}/${m}/${y}`;
}

function formatTime(date) {
  const brt = toBRT(date);
  const h = String(brt.getUTCHours()).padStart(2, "0");
  const min = String(brt.getUTCMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

// ── Fallback manual — 10 jogos do fim de semana ────────────────────────────

const FALLBACK_MATCHES = [
  // 11/04 — Rodada 2
  { espn_id:"401841073", match_number:41073, date:"11/04/2026", time:"16:30", team_a:"Vitória",      team_b:"São Paulo",   flag_a:"https://a.espncdn.com/i/teamlogos/soccer/500/3457.png", flag_b:"https://a.espncdn.com/i/teamlogos/soccer/500/2026.png",  city:"Salvador",        stage:"Brasileirão", group_name:"Rodada 2" },
  { espn_id:"401841075", match_number:41075, date:"11/04/2026", time:"16:30", team_a:"Remo",         team_b:"Vasco da Gama",flag_a:"https://a.espncdn.com/i/teamlogos/soccer/500/4936.png", flag_b:"https://a.espncdn.com/i/teamlogos/soccer/500/3454.png",  city:"Belém",           stage:"Brasileirão", group_name:"Rodada 2" },
  { espn_id:"401841076", match_number:41076, date:"11/04/2026", time:"18:30", team_a:"Mirassol",     team_b:"Bahia",        flag_a:"https://a.espncdn.com/i/teamlogos/soccer/500/9169.png", flag_b:"https://a.espncdn.com/i/teamlogos/soccer/500/9967.png",  city:"Mirassol",        stage:"Brasileirão", group_name:"Rodada 2" },
  { espn_id:"401841074", match_number:41074, date:"11/04/2026", time:"20:00", team_a:"Santos",       team_b:"Atlético-MG",  flag_a:"https://a.espncdn.com/i/teamlogos/soccer/500/2674.png", flag_b:"https://a.espncdn.com/i/teamlogos/soccer/500/7632.png",  city:"Santos",          stage:"Brasileirão", group_name:"Rodada 2" },
  { espn_id:"401841077", match_number:41077, date:"11/04/2026", time:"20:30", team_a:"Internacional",team_b:"Grêmio",       flag_a:"https://a.espncdn.com/i/teamlogos/soccer/500/1936.png", flag_b:"https://a.espncdn.com/i/teamlogos/soccer/500/6273.png",  city:"Porto Alegre",    stage:"Brasileirão", group_name:"Rodada 2" },
  // 12/04 — Rodada 2
  { espn_id:"401841071", match_number:41071, date:"12/04/2026", time:"11:00", team_a:"Chapecoense",  team_b:"Athletico-PR", flag_a:"https://a.espncdn.com/i/teamlogos/soccer/500/9318.png", flag_b:"https://a.espncdn.com/i/teamlogos/soccer/500/3458.png",  city:"Chapecó",         stage:"Brasileirão", group_name:"Rodada 2" },
  { espn_id:"401841070", match_number:41070, date:"12/04/2026", time:"16:00", team_a:"Coritiba",     team_b:"Botafogo",     flag_a:"https://a.espncdn.com/i/teamlogos/soccer/500/3456.png", flag_b:"https://a.espncdn.com/i/teamlogos/soccer/500/6086.png",  city:"Curitiba",        stage:"Brasileirão", group_name:"Rodada 2" },
  { espn_id:"401841072", match_number:41072, date:"12/04/2026", time:"18:00", team_a:"Flamengo",     team_b:"Fluminense",   flag_a:"https://a.espncdn.com/i/teamlogos/soccer/500/819.png",  flag_b:"https://a.espncdn.com/i/teamlogos/soccer/500/3445.png", city:"Rio de Janeiro",  stage:"Brasileirão", group_name:"Rodada 2" },
  { espn_id:"401841069", match_number:41069, date:"12/04/2026", time:"18:30", team_a:"Palmeiras",    team_b:"Corinthians",  flag_a:"https://a.espncdn.com/i/teamlogos/soccer/500/2029.png", flag_b:"https://a.espncdn.com/i/teamlogos/soccer/500/874.png",   city:"São Paulo",       stage:"Brasileirão", group_name:"Rodada 2" },
  { espn_id:"401841068", match_number:41068, date:"12/04/2026", time:"18:30", team_a:"Bragantino",   team_b:"Cruzeiro",     flag_a:"https://a.espncdn.com/i/teamlogos/soccer/500/6079.png", flag_b:"https://a.espncdn.com/i/teamlogos/soccer/500/2022.png",  city:"Bragança Paulista",stage:"Brasileirão", group_name:"Rodada 2" },
];

// ── Fetch ESPN ─────────────────────────────────────────────────────────────

async function fetchESPN(dateStr) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/bra.1/scoreboard?lang=pt&dates=${dateStr}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN HTTP ${res.status}`);
  const json = await res.json();
  return json.events ?? [];
}

function mapEvent(event) {
  const competition = event.competitions[0];
  const comps = competition.competitors ?? [];
  const home = comps.find(c => c.homeAway === "home");
  const away = comps.find(c => c.homeAway === "away");
  if (!home || !away) return null;

  const startDate = new Date(event.date);
  const completed = event.status?.type?.completed ?? false;

  return {
    espn_id:      String(event.id),
    match_number: parseInt(event.id.slice(-5)),
    team_a:       home.team.displayName,
    team_b:       away.team.displayName,
    flag_a:       home.team.logo ?? "",
    flag_b:       away.team.logo ?? "",
    date:         formatDate(startDate),
    time:         formatTime(startDate),
    city:         competition.venue?.address?.city ?? "",
    stage:        "Brasileirão",
    group_name:   "Rodada 2",
    ...(completed && {
      scored:        true,
      result_home:   parseInt(home.score ?? "0"),
      result_away:   parseInt(away.score ?? "0"),
      result_winner: home.score > away.score ? "A" : away.score > home.score ? "B" : "X",
    }),
  };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  // 1. Apaga todos os jogos do Brasileirão
  console.log("🗑️  Apagando jogos do Brasileirão...");
  const { error: delErr, count } = await supabase
    .from("matches")
    .delete({ count: "exact" })
    .eq("stage", "Brasileirão");

  if (delErr) { console.error("❌  Erro ao deletar:", delErr.message); process.exit(1); }
  console.log(`   → ${count ?? "?"} jogos removidos`);

  // 2. Tenta ESPN
  console.log("\n🌐  Buscando dados na ESPN...");
  let matches = [];

  try {
    const [ev11, ev12] = await Promise.all([
      fetchESPN("20260411"),
      fetchESPN("20260412"),
    ]);

    const all = [...ev11, ...ev12];
    matches = all.map(mapEvent).filter(Boolean);
    console.log(`   → ${matches.length} jogos obtidos da ESPN`);
  } catch (e) {
    console.warn("⚠️  ESPN falhou:", e.message);
  }

  // 3. Fallback se ESPN retornar vazio
  if (matches.length === 0) {
    console.log("⚠️  ESPN sem dados — usando fallback manual (10 jogos)");
    matches = FALLBACK_MATCHES;
  }

  // 4. Insere no banco
  console.log("\n💾  Inserindo jogos no banco...");
  const { error: insErr } = await supabase.from("matches").upsert(matches, { onConflict: "espn_id" });
  if (insErr) { console.error("❌  Erro ao inserir:", insErr.message); process.exit(1); }

  console.log(`\n✅  ${matches.length} jogos inseridos com sucesso!\n`);
  matches.forEach(m => {
    console.log(`   ${m.date} ${m.time}  ${m.team_a} x ${m.team_b}  (${m.city})`);
  });
}

main().catch(e => { console.error(e); process.exit(1); });
