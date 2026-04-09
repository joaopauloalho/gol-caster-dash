const fs = require('fs');
const path = require('path');

const rawPath = path.join(process.env.USERPROFILE, 'espn_raw.json');
const outPath = path.join(__dirname, '..', 'jogos_copa_2026.json');

const data = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

// ─── Dicionário de tradução ───────────────────────────────────────────────────
const traducoes = {
  // América do Norte/Central/Caribe
  'Mexico': 'México',
  'United States': 'Estados Unidos',
  'Canada': 'Canadá',
  'Costa Rica': 'Costa Rica',
  'Panama': 'Panamá',
  'Honduras': 'Honduras',
  'El Salvador': 'El Salvador',
  'Jamaica': 'Jamaica',
  'Trinidad and Tobago': 'Trinidad e Tobago',
  'Haiti': 'Haiti',
  'Cuba': 'Cuba',
  'Guatemala': 'Guatemala',
  // América do Sul
  'Brazil': 'Brasil',
  'Argentina': 'Argentina',
  'Colombia': 'Colômbia',
  'Uruguay': 'Uruguai',
  'Ecuador': 'Equador',
  'Chile': 'Chile',
  'Peru': 'Peru',
  'Bolivia': 'Bolívia',
  'Paraguay': 'Paraguai',
  'Venezuela': 'Venezuela',
  // Europa
  'France': 'França',
  'Germany': 'Alemanha',
  'Spain': 'Espanha',
  'England': 'Inglaterra',
  'Portugal': 'Portugal',
  'Netherlands': 'Holanda',
  'Belgium': 'Bélgica',
  'Italy': 'Itália',
  'Croatia': 'Croácia',
  'Switzerland': 'Suíça',
  'Denmark': 'Dinamarca',
  'Sweden': 'Suécia',
  'Norway': 'Noruega',
  'Poland': 'Polônia',
  'Czech Republic': 'República Tcheca',
  'Czechia': 'República Tcheca',
  'Austria': 'Áustria',
  'Hungary': 'Hungria',
  'Romania': 'Romênia',
  'Serbia': 'Sérvia',
  'Ukraine': 'Ucrânia',
  'Scotland': 'Escócia',
  'Wales': 'País de Gales',
  'Turkey': 'Turquia',
  'Greece': 'Grécia',
  'Slovakia': 'Eslováquia',
  'Slovenia': 'Eslovênia',
  'Albania': 'Albânia',
  'Georgia': 'Geórgia',
  'Kosovo': 'Kosovo',
  'Iceland': 'Islândia',
  'Finland': 'Finlândia',
  'North Macedonia': 'Macedônia do Norte',
  'Bosnia and Herzegovina': 'Bósnia e Herzegovina',
  'Montenegro': 'Montenegro',
  'Bulgaria': 'Bulgária',
  'Russia': 'Rússia',
  'Belarus': 'Bielorrússia',
  'Luxembourg': 'Luxemburgo',
  'Ireland': 'Irlanda',
  'Northern Ireland': 'Irlanda do Norte',
  // África
  'South Africa': 'África do Sul',
  'Morocco': 'Marrocos',
  'Egypt': 'Egito',
  'Nigeria': 'Nigéria',
  'Senegal': 'Senegal',
  'Cameroon': 'Camarões',
  'Ghana': 'Gana',
  'Ivory Coast': 'Costa do Marfim',
  "Cote d'Ivoire": 'Costa do Marfim',
  'Algeria': 'Argélia',
  'Tunisia': 'Tunísia',
  'Mali': 'Mali',
  'Burkina Faso': 'Burkina Faso',
  'Congo DR': 'Congo',
  'Zimbabwe': 'Zimbábue',
  'Angola': 'Angola',
  'Tanzania': 'Tanzânia',
  'Uganda': 'Uganda',
  'Kenya': 'Quênia',
  'Ethiopia': 'Etiópia',
  'Mozambique': 'Moçambique',
  'Zambia': 'Zâmbia',
  'Cape Verde': 'Cabo Verde',
  'Benin': 'Benim',
  'Guinea': 'Guiné',
  'Mauritania': 'Mauritânia',
  // Ásia / Oceania
  'Japan': 'Japão',
  'South Korea': 'Coreia do Sul',
  'Australia': 'Austrália',
  'Saudi Arabia': 'Arábia Saudita',
  'Iran': 'Irã',
  'Qatar': 'Catar',
  'China PR': 'China',
  'China': 'China',
  'Iraq': 'Iraque',
  'Jordan': 'Jordânia',
  'United Arab Emirates': 'Emirados Árabes',
  'Indonesia': 'Indonésia',
  'Uzbekistan': 'Uzbequistão',
  'Oman': 'Omã',
  'Bahrain': 'Bahrein',
  'Kuwait': 'Kuwait',
  'New Zealand': 'Nova Zelândia',
  // Países com nomes alternativos na ESPN
  'IR Iran': 'Irã',
  'Curacao': 'Curaçao',
  'Türkiye': 'Turquia',
  // TBD
  'TBD': 'A Definir',
};

function traduzir(nome) {
  if (traducoes[nome]) return traducoes[nome];
  let m;
  // Group A Winner / Group B 2nd Place
  m = nome.match(/^Group ([A-Z]+) Winner$/);
  if (m) return 'Vencedor Grupo ' + m[1];
  m = nome.match(/^Group ([A-Z]+) 2nd Place$/);
  if (m) return '2º Lugar Grupo ' + m[1];
  m = nome.match(/^Group ([A-Z]+) Runner-Up$/);
  if (m) return '2º Lugar Grupo ' + m[1];
  // Third Place Group A/B/C/...
  m = nome.match(/^Third Place (.+)$/);
  if (m) return '3º Lugar ' + m[1];
  // Round of 32 N Winner / Round of 16 N Winner
  m = nome.match(/^Round of 32 (\d+) Winner$/);
  if (m) return 'Vencedor 32avos J' + m[1];
  m = nome.match(/^Round of 16 (\d+) Winner$/);
  if (m) return 'Vencedor Oitavas J' + m[1];
  // Quarterfinal N Winner
  m = nome.match(/^Quarterfinal (\d+) Winner$/);
  if (m) return 'Vencedor Quartas J' + m[1];
  // Semifinal N Winner / Loser
  m = nome.match(/^Semifinal (\d+) Winner$/);
  if (m) return 'Vencedor Semi J' + m[1];
  m = nome.match(/^Semifinal (\d+) Loser$/);
  if (m) return 'Perdedor Semi J' + m[1];
  // Generic fallbacks
  m = nome.match(/^Winner of (.+)$/);
  if (m) return 'Vencedor de ' + m[1];
  m = nome.match(/^Loser of (.+)$/);
  if (m) return 'Perdedor de ' + m[1];
  m = nome.match(/^(.+) Loser$/);
  if (m) return 'Perdedor - ' + m[1];
  return nome;
}

// ─── UTC → Brasília (UTC-3, sem horário de verão desde 2019) ─────────────────
function toBrasilia(isoDate) {
  const d = new Date(isoDate);
  const local = new Date(d.getTime() + (-3 * 60) * 60000);
  const dd   = String(local.getUTCDate()).padStart(2, '0');
  const mm   = String(local.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = local.getUTCFullYear();
  const hh   = String(local.getUTCHours()).padStart(2, '0');
  const min  = String(local.getUTCMinutes()).padStart(2, '0');
  return { data: `${dd}/${mm}/${yyyy}`, hora: `${hh}:${min}` };
}

// ─── Processamento ────────────────────────────────────────────────────────────
const semTrad = new Set();

const jogos = data.events.map(event => {
  const comp = event.competitions[0];
  const { data: dataJogo, hora } = toBrasilia(event.date);

  const home = comp.competitors.find(c => c.homeAway === 'home');
  const away = comp.competitors.find(c => c.homeAway === 'away');

  const nomeHome = home?.team?.displayName || 'TBD';
  const nomeAway = away?.team?.displayName || 'TBD';

  if (traduzir(nomeHome) === nomeHome && !traducoes.hasOwnProperty(nomeHome) && nomeHome !== 'TBD') semTrad.add(nomeHome);
  if (traduzir(nomeAway) === nomeAway && !traducoes.hasOwnProperty(nomeAway) && nomeAway !== 'TBD') semTrad.add(nomeAway);

  return {
    id_referencia: event.id,
    data: dataJogo,
    hora,
    time_casa: traduzir(nomeHome),
    time_visitante: traduzir(nomeAway),
    estadio: comp.venue?.fullName || '',
    logo_casa: home?.team?.logo || '',
    logo_visitante: away?.team?.logo || '',
    id_api_paga: null,
  };
});

// ─── Relatório ────────────────────────────────────────────────────────────────
console.log(`Total de jogos processados: ${jogos.length}`);

if (jogos.length !== 104) {
  console.warn(`ATENÇÃO: esperado 104 jogos, encontrados ${jogos.length}. Verificar paginação.`);
}

if (semTrad.size > 0) {
  console.warn('ATENÇÃO - Nomes SEM tradução (adicionar ao dicionário):');
  [...semTrad].sort().forEach(n => console.warn('  -', n));
} else {
  console.log('Todos os nomes foram traduzidos com sucesso!');
}

console.log('\nPrimeiros 3 jogos:');
jogos.slice(0, 3).forEach(j => console.log(JSON.stringify(j, null, 2)));

console.log('\nÚltimos 3 jogos:');
jogos.slice(-3).forEach(j => console.log(JSON.stringify(j, null, 2)));

// ─── Salva o arquivo ──────────────────────────────────────────────────────────
fs.writeFileSync(outPath, JSON.stringify(jogos, null, 2), 'utf8');
console.log(`\nArquivo salvo: ${outPath}`);
