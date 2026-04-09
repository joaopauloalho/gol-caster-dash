const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://mmeiehwqgyhnsriqazcw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FhdZwPm1cTAf6eJ_U2SxKw_sbE3QKBV';

const rawPath = path.join(process.env.USERPROFILE, 'espn_raw.json');
const data = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

// ─── Grupos (inferidos dos confrontos da fase de grupos) ──────────────────────
const GRUPOS = {
  'Mexico': 'A',        'South Africa': 'A',  'South Korea': 'A',  'Czechia': 'A',
  'Canada': 'B',        'Bosnia and Herzegovina': 'B', 'Qatar': 'B', 'Switzerland': 'B',
  'United States': 'B', // Wait, let me fix: US plays Paraguay, Türkiye, Australia → Group C
};

// Correct mapping derived from matchup analysis
const TEAM_GROUP = {
  // Group A
  'Mexico': 'A', 'South Africa': 'A', 'South Korea': 'A', 'Czechia': 'A',
  // Group B
  'Canada': 'B', 'Bosnia and Herzegovina': 'B', 'Qatar': 'B', 'Switzerland': 'B',
  // Group C
  'United States': 'C', 'Paraguay': 'C', 'Australia': 'C', 'Türkiye': 'C',
  // Group D
  'Brazil': 'D', 'Morocco': 'D', 'Haiti': 'D', 'Scotland': 'D',
  // Group E
  'Germany': 'E', 'Curacao': 'E', 'Ivory Coast': 'E', 'Ecuador': 'E',
  // Group F
  'Netherlands': 'F', 'Japan': 'F', 'Sweden': 'F', 'Tunisia': 'F',
  // Group G
  'Spain': 'G', 'Cape Verde': 'G', 'Saudi Arabia': 'G', 'Uruguay': 'G',
  // Group H
  'Belgium': 'H', 'Egypt': 'H', 'IR Iran': 'H', 'New Zealand': 'H',
  // Group I
  'France': 'I', 'Senegal': 'I', 'Iraq': 'I', 'Norway': 'I',
  // Group J
  'Argentina': 'J', 'Algeria': 'J', 'Austria': 'J', 'Jordan': 'J',
  // Group K
  'Portugal': 'K', 'Congo DR': 'K', 'Uzbekistan': 'K', 'Colombia': 'K',
  // Group L
  'England': 'L', 'Croatia': 'L', 'Ghana': 'L', 'Panama': 'L',
};

// ─── Slug ESPN → stage value esperado pelo app ────────────────────────────────
const SLUG_TO_STAGE = {
  'group-stage':    'Group Stage',
  'round-of-32':    'Round of 32',
  'round-of-16':    'Round of 16',
  'quarterfinals':  'Quarter-finals',
  'semifinals':     'Semi-finals',
  '3rd-place-match':'Third Place',
  'final':          'Final',
};

// ─── Tradução de nomes ────────────────────────────────────────────────────────
const TRADUCOES = {
  'Mexico': 'México', 'United States': 'Estados Unidos', 'Canada': 'Canadá',
  'Brazil': 'Brasil', 'Argentina': 'Argentina', 'Colombia': 'Colômbia',
  'Uruguay': 'Uruguai', 'Ecuador': 'Equador', 'Paraguay': 'Paraguai',
  'Bolivia': 'Bolívia', 'Peru': 'Peru', 'Chile': 'Chile', 'Venezuela': 'Venezuela',
  'Costa Rica': 'Costa Rica', 'Panama': 'Panamá', 'Honduras': 'Honduras',
  'El Salvador': 'El Salvador', 'Jamaica': 'Jamaica', 'Haiti': 'Haiti',
  'France': 'França', 'Germany': 'Alemanha', 'Spain': 'Espanha',
  'England': 'Inglaterra', 'Portugal': 'Portugal', 'Netherlands': 'Holanda',
  'Belgium': 'Bélgica', 'Italy': 'Itália', 'Croatia': 'Croácia',
  'Switzerland': 'Suíça', 'Denmark': 'Dinamarca', 'Sweden': 'Suécia',
  'Norway': 'Noruega', 'Poland': 'Polônia', 'Czechia': 'República Tcheca',
  'Austria': 'Áustria', 'Scotland': 'Escócia', 'Türkiye': 'Turquia',
  'Bosnia and Herzegovina': 'Bósnia e Herzegovina', 'Serbia': 'Sérvia',
  'Ukraine': 'Ucrânia', 'Georgia': 'Geórgia', 'Slovakia': 'Eslováquia',
  'Slovenia': 'Eslovênia', 'Albania': 'Albânia', 'Romania': 'Romênia',
  'South Africa': 'África do Sul', 'Morocco': 'Marrocos', 'Egypt': 'Egito',
  'Nigeria': 'Nigéria', 'Senegal': 'Senegal', 'Cameroon': 'Camarões',
  'Ghana': 'Gana', 'Ivory Coast': 'Costa do Marfim', 'Algeria': 'Argélia',
  'Tunisia': 'Tunísia', 'Congo DR': 'Congo', 'Cape Verde': 'Cabo Verde',
  'Japan': 'Japão', 'South Korea': 'Coreia do Sul', 'Australia': 'Austrália',
  'Saudi Arabia': 'Arábia Saudita', 'IR Iran': 'Irã', 'Qatar': 'Catar',
  'Iraq': 'Iraque', 'Jordan': 'Jordânia', 'Indonesia': 'Indonésia',
  'Uzbekistan': 'Uzbequistão', 'New Zealand': 'Nova Zelândia',
  'Curacao': 'Curaçao',
};

function traduzir(nome) {
  if (TRADUCOES[nome]) return TRADUCOES[nome];
  let m;
  m = nome.match(/^Group ([A-Z]+) Winner$/);        if (m) return 'Vencedor Grupo ' + m[1];
  m = nome.match(/^Group ([A-Z]+) 2nd Place$/);     if (m) return '2º Lugar Grupo ' + m[1];
  m = nome.match(/^Group ([A-Z]+) Runner-Up$/);     if (m) return '2º Lugar Grupo ' + m[1];
  m = nome.match(/^Third Place (.+)$/);              if (m) return '3º Lugar ' + m[1];
  m = nome.match(/^Round of 32 (\d+) Winner$/);     if (m) return 'Vencedor 32avos J' + m[1];
  m = nome.match(/^Round of 16 (\d+) Winner$/);     if (m) return 'Vencedor Oitavas J' + m[1];
  m = nome.match(/^Quarterfinal (\d+) Winner$/);    if (m) return 'Vencedor Quartas J' + m[1];
  m = nome.match(/^Semifinal (\d+) Winner$/);       if (m) return 'Vencedor Semi J' + m[1];
  m = nome.match(/^Semifinal (\d+) Loser$/);        if (m) return 'Perdedor Semi J' + m[1];
  return nome;
}

// ─── UTC → Brasília ────────────────────────────────────────────────────────────
function toBrasilia(isoDate) {
  const d = new Date(isoDate);
  const local = new Date(d.getTime() + (-3 * 60) * 60000);
  const dd  = String(local.getUTCDate()).padStart(2, '0');
  const mm  = String(local.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = local.getUTCFullYear();
  const hh  = String(local.getUTCHours()).padStart(2, '0');
  const min = String(local.getUTCMinutes()).padStart(2, '0');
  return { data: `${dd}/${mm}/${yyyy}`, hora: `${hh}:${min}` };
}

// ─── Monta os registros ───────────────────────────────────────────────────────
const matches = data.events.map((event, idx) => {
  const comp = event.competitions[0];
  const { data: dataJogo, hora } = toBrasilia(event.date);
  const slug = event.season.slug;
  const stage = SLUG_TO_STAGE[slug] || slug;

  const home = comp.competitors.find(c => c.homeAway === 'home');
  const away = comp.competitors.find(c => c.homeAway === 'away');

  const nomeHome = home?.team?.displayName || 'TBD';
  const nomeAway = away?.team?.displayName || 'TBD';
  const grupo = TEAM_GROUP[nomeHome] || TEAM_GROUP[nomeAway] || '';

  return {
    match_number: idx + 1,
    date: dataJogo,
    time: hora,
    stage,
    group_name: grupo,
    city: comp.venue?.address?.city || '',
    team_a: traduzir(nomeHome),
    team_b: traduzir(nomeAway),
    flag_a: home?.team?.logo || '',
    flag_b: away?.team?.logo || '',
  };
});

console.log(`Preparados ${matches.length} jogos para inserção.`);
console.log('Amostra:', JSON.stringify(matches[0], null, 2));

// ─── Insere via Supabase REST API ─────────────────────────────────────────────
function supabaseInsert(rows) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(rows);
    const url = new URL('/rest/v1/matches', SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  try {
    console.log('\nInserindo no Supabase...');
    await supabaseInsert(matches);
    console.log(`✅ ${matches.length} jogos inseridos com sucesso!`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
})();
