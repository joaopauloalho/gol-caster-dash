/**
 * seed-brasileirao.cjs
 * Insere jogos do Brasileirão Série A 2026 no Supabase para testes.
 *
 * Uso:
 *   node scripts/seed-brasileirao.cjs
 *
 * Para usar com API-Football (RapidAPI) e buscar jogos reais:
 *   API_FOOTBALL_KEY=sua_chave node scripts/seed-brasileirao.cjs
 *
 * Para limpar jogos existentes antes de inserir:
 *   CLEAR_FIRST=1 node scripts/seed-brasileirao.cjs
 */

const https = require('https');

const SUPABASE_URL = 'https://mmeiehwqgyhnsriqazcw.supabase.co';
// Prefere service role key (inserção sem restrição RLS); fallback para publishable
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_FhdZwPm1cTAf6eJ_U2SxKw_sbE3QKBV';
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || '';

// ── Jogos estáticos para testes ───────────────────────────────────────────────
// 5 rodadas × 5 jogos = 25 partidas
// match_number começa em 1001 para não colidir com jogos da Copa
const STATIC_MATCHES = [
  // Rodada 1 — 12-13 Abr 2026
  { match_number: 1001, date: '12/04/2026', time: '16:00', stage: 'Brasileirão', group_name: 'Rodada 1', city: 'Rio de Janeiro',  team_a: 'Flamengo',    team_b: 'Botafogo',    flag_a: '', flag_b: '' },
  { match_number: 1002, date: '12/04/2026', time: '18:30', stage: 'Brasileirão', group_name: 'Rodada 1', city: 'São Paulo',       team_a: 'Palmeiras',   team_b: 'Corinthians', flag_a: '', flag_b: '' },
  { match_number: 1003, date: '12/04/2026', time: '21:00', stage: 'Brasileirão', group_name: 'Rodada 1', city: 'São Paulo',       team_a: 'São Paulo',   team_b: 'Fluminense',  flag_a: '', flag_b: '' },
  { match_number: 1004, date: '13/04/2026', time: '16:00', stage: 'Brasileirão', group_name: 'Rodada 1', city: 'Porto Alegre',    team_a: 'Internacional', team_b: 'Cruzeiro', flag_a: '', flag_b: '' },
  { match_number: 1005, date: '13/04/2026', time: '18:30', stage: 'Brasileirão', group_name: 'Rodada 1', city: 'Belo Horizonte',  team_a: 'Atlético-MG', team_b: 'Grêmio',     flag_a: '', flag_b: '' },

  // Rodada 2 — 19-20 Abr 2026
  { match_number: 1006, date: '19/04/2026', time: '16:00', stage: 'Brasileirão', group_name: 'Rodada 2', city: 'Rio de Janeiro',  team_a: 'Botafogo',    team_b: 'Palmeiras',   flag_a: '', flag_b: '' },
  { match_number: 1007, date: '19/04/2026', time: '18:30', stage: 'Brasileirão', group_name: 'Rodada 2', city: 'Rio de Janeiro',  team_a: 'Fluminense',  team_b: 'Flamengo',    flag_a: '', flag_b: '' },
  { match_number: 1008, date: '19/04/2026', time: '21:00', stage: 'Brasileirão', group_name: 'Rodada 2', city: 'São Paulo',       team_a: 'Corinthians', team_b: 'Internacional', flag_a: '', flag_b: '' },
  { match_number: 1009, date: '20/04/2026', time: '16:00', stage: 'Brasileirão', group_name: 'Rodada 2', city: 'Porto Alegre',    team_a: 'Grêmio',      team_b: 'São Paulo',   flag_a: '', flag_b: '' },
  { match_number: 1010, date: '20/04/2026', time: '18:30', stage: 'Brasileirão', group_name: 'Rodada 2', city: 'Belo Horizonte',  team_a: 'Cruzeiro',    team_b: 'Atlético-MG', flag_a: '', flag_b: '' },

  // Rodada 3 — 26-27 Abr 2026
  { match_number: 1011, date: '26/04/2026', time: '16:00', stage: 'Brasileirão', group_name: 'Rodada 3', city: 'Rio de Janeiro',  team_a: 'Flamengo',    team_b: 'Corinthians', flag_a: '', flag_b: '' },
  { match_number: 1012, date: '26/04/2026', time: '18:30', stage: 'Brasileirão', group_name: 'Rodada 3', city: 'São Paulo',       team_a: 'Palmeiras',   team_b: 'Internacional', flag_a: '', flag_b: '' },
  { match_number: 1013, date: '26/04/2026', time: '21:00', stage: 'Brasileirão', group_name: 'Rodada 3', city: 'São Paulo',       team_a: 'São Paulo',   team_b: 'Atlético-MG', flag_a: '', flag_b: '' },
  { match_number: 1014, date: '27/04/2026', time: '16:00', stage: 'Brasileirão', group_name: 'Rodada 3', city: 'Rio de Janeiro',  team_a: 'Botafogo',    team_b: 'Grêmio',      flag_a: '', flag_b: '' },
  { match_number: 1015, date: '27/04/2026', time: '18:30', stage: 'Brasileirão', group_name: 'Rodada 3', city: 'Rio de Janeiro',  team_a: 'Fluminense',  team_b: 'Cruzeiro',    flag_a: '', flag_b: '' },

  // Rodada 4 — 3-4 Mai 2026
  { match_number: 1016, date: '03/05/2026', time: '16:00', stage: 'Brasileirão', group_name: 'Rodada 4', city: 'Porto Alegre',    team_a: 'Internacional', team_b: 'Flamengo',  flag_a: '', flag_b: '' },
  { match_number: 1017, date: '03/05/2026', time: '18:30', stage: 'Brasileirão', group_name: 'Rodada 4', city: 'Belo Horizonte',  team_a: 'Atlético-MG', team_b: 'Palmeiras',   flag_a: '', flag_b: '' },
  { match_number: 1018, date: '03/05/2026', time: '21:00', stage: 'Brasileirão', group_name: 'Rodada 4', city: 'Porto Alegre',    team_a: 'Grêmio',      team_b: 'Fluminense',  flag_a: '', flag_b: '' },
  { match_number: 1019, date: '04/05/2026', time: '16:00', stage: 'Brasileirão', group_name: 'Rodada 4', city: 'Belo Horizonte',  team_a: 'Cruzeiro',    team_b: 'Corinthians', flag_a: '', flag_b: '' },
  { match_number: 1020, date: '04/05/2026', time: '18:30', stage: 'Brasileirão', group_name: 'Rodada 4', city: 'São Paulo',       team_a: 'São Paulo',   team_b: 'Botafogo',    flag_a: '', flag_b: '' },

  // Rodada 5 — 10-11 Mai 2026
  { match_number: 1021, date: '10/05/2026', time: '16:00', stage: 'Brasileirão', group_name: 'Rodada 5', city: 'Rio de Janeiro',  team_a: 'Flamengo',    team_b: 'Atlético-MG', flag_a: '', flag_b: '' },
  { match_number: 1022, date: '10/05/2026', time: '18:30', stage: 'Brasileirão', group_name: 'Rodada 5', city: 'São Paulo',       team_a: 'Palmeiras',   team_b: 'Grêmio',      flag_a: '', flag_b: '' },
  { match_number: 1023, date: '10/05/2026', time: '21:00', stage: 'Brasileirão', group_name: 'Rodada 5', city: 'Rio de Janeiro',  team_a: 'Botafogo',    team_b: 'Cruzeiro',    flag_a: '', flag_b: '' },
  { match_number: 1024, date: '11/05/2026', time: '16:00', stage: 'Brasileirão', group_name: 'Rodada 5', city: 'São Paulo',       team_a: 'Corinthians', team_b: 'Fluminense',  flag_a: '', flag_b: '' },
  { match_number: 1025, date: '11/05/2026', time: '18:30', stage: 'Brasileirão', group_name: 'Rodada 5', city: 'Porto Alegre',    team_a: 'Internacional', team_b: 'São Paulo', flag_a: '', flag_b: '' },
];

// ── API-Football: busca jogos reais do Brasileirão ────────────────────────────
// Liga 71 = Brasileirão Série A (api-football.com)
async function fetchFromApiFootball(apiKey, season = 2026) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'v3.football.api-sports.io',
      path: `/fixtures?league=71&season=${season}`,
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey,
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.response) { reject(new Error('Resposta inválida da API')); return; }

          const matches = json.response.map((fixture, idx) => {
            const d = new Date(fixture.fixture.date);
            // Brasília = UTC-3
            const bsb = new Date(d.getTime() - 3 * 60 * 60 * 1000);
            const dd = String(bsb.getUTCDate()).padStart(2, '0');
            const mm = String(bsb.getUTCMonth() + 1).padStart(2, '0');
            const yyyy = bsb.getUTCFullYear();
            const hh = String(bsb.getUTCHours()).padStart(2, '0');
            const min = String(bsb.getUTCMinutes()).padStart(2, '0');

            return {
              match_number: 1000 + idx + 1,
              date: `${dd}/${mm}/${yyyy}`,
              time: `${hh}:${min}`,
              stage: 'Brasileirão',
              group_name: `Rodada ${fixture.league.round?.replace('Regular Season - ', '') || idx + 1}`,
              city: fixture.fixture.venue?.city || '',
              team_a: fixture.teams.home.name,
              team_b: fixture.teams.away.name,
              flag_a: fixture.teams.home.logo || '',
              flag_b: fixture.teams.away.logo || '',
            };
          });

          resolve(matches);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ── Chama edge function seed-brasileirao (usa service role internamente) ──────
function callSeedFunction(clearFirst = false) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ clear_first: clearFirst });
    const options = {
      hostname: 'mmeiehwqgyhnsriqazcw.supabase.co',
      path: '/functions/v1/seed-brasileirao',
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('🇧🇷  Seed Brasileirão 2026\n');

  let matches;

  if (API_FOOTBALL_KEY) {
    console.log('📡 Buscando jogos reais via API-Football...');
    try {
      matches = await fetchFromApiFootball(API_FOOTBALL_KEY);
      console.log(`   ${matches.length} jogos encontrados na API.\n`);
    } catch (err) {
      console.warn(`   ⚠️  Falha na API (${err.message}). Usando dados estáticos.\n`);
      matches = STATIC_MATCHES;
    }
  } else {
    console.log('📋 Usando jogos estáticos (25 partidas, Rodadas 1-5).');
    console.log('   Dica: defina API_FOOTBALL_KEY para buscar jogos reais.\n');
    matches = STATIC_MATCHES;
  }

  const clearFirst = process.env.CLEAR_FIRST === '1';
  if (clearFirst) console.log('🗑  Limpando jogos anteriores do Brasileirão...');

  console.log(`⬆️  Chamando edge function seed-brasileirao...`);
  try {
    const { status, data } = await callSeedFunction(clearFirst);
    if (status >= 200 && status < 300 && data.ok) {
      console.log(`\n🎉 Pronto! ${data.inserted} jogos do Brasileirão inseridos.`);
      console.log('   Acesse /jogos → aba "Brasileirão" para ver os jogos.');
    } else {
      const msg = data?.error || JSON.stringify(data);
      console.error(`\n❌ Erro: ${msg}`);
      if (status === 404) {
        console.error('   Edge function não encontrada. Deploy com: supabase functions deploy seed-brasileirao');
      }
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    process.exit(1);
  }
})();
