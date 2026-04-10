/**
 * create-tester.cjs
 * Cria usuários de teste sem precisar acessar o painel admin.
 * Chama a edge function setup-test-user diretamente.
 *
 * Uso:
 *   node scripts/create-tester.cjs username1 username2 ...
 *
 * Exemplo:
 *   node scripts/create-tester.cjs joao pedro maria ana
 *
 * Credenciais criadas:
 *   Email:  username@bolao.test
 *   Senha:  123456
 *   Login via magic link também funciona com o email acima.
 */

const https = require('https');

const SUPABASE_URL = 'https://mmeiehwqgyhnsriqazcw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_FhdZwPm1cTAf6eJ_U2SxKw_sbE3QKBV';

const usernames = process.argv.slice(2);

function callEdgeFunction(body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const options = {
      hostname: 'mmeiehwqgyhnsriqazcw.supabase.co',
      path: '/functions/v1/setup-test-user',
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
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
    req.write(bodyStr);
    req.end();
  });
}

(async () => {
  if (usernames.length === 0) {
    console.log('Uso: node scripts/create-tester.cjs username1 username2 ...');
    console.log('');
    console.log('Exemplos:');
    console.log('  node scripts/create-tester.cjs joao pedro maria');
    console.log('  node scripts/create-tester.cjs amigo1 amigo2 amigo3');
    console.log('');
    console.log('Credenciais geradas:');
    console.log('  Email: <username>@bolao.test');
    console.log('  Senha: 123456');
    process.exit(0);
  }

  console.log(`🔧 Criando ${usernames.length} tester(s)...\n`);

  const results = [];

  for (const raw of usernames) {
    const slug = raw.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (slug.length < 2) {
      console.log(`⚠️  "${raw}" → username inválido (mín. 2 caracteres), pulando.`);
      continue;
    }

    process.stdout.write(`  @${slug.padEnd(20)} → `);

    try {
      const { status, data } = await callEdgeFunction({ create_username: slug });

      if (status >= 200 && status < 300 && data.ok) {
        console.log(`✅  email: ${slug}@bolao.test  |  senha: 123456`);
        results.push({ username: slug, email: `${slug}@bolao.test`, password: '123456' });
      } else {
        const errMsg = data?.error || JSON.stringify(data);
        console.log(`❌  ${errMsg}`);
      }
    } catch (err) {
      console.log(`❌  ${err.message}`);
    }
  }

  if (results.length > 0) {
    console.log('\n─────────────────────────────────────────');
    console.log('📋 Resumo — envie para seus amigos:\n');
    for (const r of results) {
      console.log(`  Usuário: ${r.username}`);
      console.log(`  Email:   ${r.email}`);
      console.log(`  Senha:   ${r.password}`);
      console.log(`  Link:    https://super-bolao-copa.vercel.app/auth`);
      console.log('');
    }
    console.log('─────────────────────────────────────────');
    console.log('⚡ Para confirmar pagamento destes testers,');
    console.log('   acesse o painel admin → aba Testers → Ativar.');
  }
})();
