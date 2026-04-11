# Deploy Checklist — Super Bolão da Copa 2026

## 1. Supabase

```bash
supabase db push          # aplica todas as migrations pendentes
supabase functions deploy # deploya todas as edge functions
```

Confirmar no dashboard:
- [ ] Migrations aplicadas (Settings → Database → Migrations)
- [ ] RLS ativo em: participants, predictions, tournament_predictions, group_members, webhook_events, subscriptions
- [ ] View `participants_public_view` existe e tem GRANT SELECT para `authenticated`
- [ ] Usuário admin tem `app_metadata.role = "admin"` (Authentication → Users → Edit)

## 2. Secrets no Supabase (Edge Functions → Secrets)

| Variável           | Descrição                                 |
|--------------------|-------------------------------------------|
| `MP_ACCESS_TOKEN`  | Token de produção do Mercado Pago         |
| `MP_WEBHOOK_SECRET`| Chave HMAC para validar webhooks do MP    |
| `SITE_URL`         | URL pública do app, ex: `https://pietah.com.br` |
| `SUPABASE_URL`     | (auto-injetado pelo Supabase)             |
| `SUPABASE_SERVICE_ROLE_KEY` | (auto-injetado pelo Supabase)  |

## 3. Variáveis Vercel

| Variável                      | Descrição                            |
|-------------------------------|--------------------------------------|
| `VITE_SUPABASE_URL`           | URL do projeto Supabase              |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key (pública, segura no client) |

> Nenhuma chave secreta deve estar nas variáveis `VITE_*` — elas ficam no bundle público.

## 4. vercel.json (SPA rewrite)

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

## 5. Testes antes do go-live

```bash
npm run build          # build de produção (zero erros TypeScript)
npm run test           # testes unitários (vitest)
npx playwright test e2e/smoke.spec.ts --reporter=list  # smoke E2E
```

Para smoke E2E com login de tester:
```bash
E2E_TESTER_USER=nome_do_tester BASE_URL=https://pietah.com.br npx playwright test e2e/
```

## 6. Índices aplicados (migration 20260410170000)

- `predictions(user_id, match_id)` — UNIQUE + índice
- `group_members(user_id)` e `group_members(group_id)`
- `participants(user_id)` e `participants(referral_code)`
- `tournament_predictions(user_id)`
