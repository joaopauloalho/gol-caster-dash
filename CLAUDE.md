# CLAUDE.md — Super Bolão da Copa 2026

## Visão Geral do Projeto

Plataforma de bolão para a Copa do Mundo 2026. Usuários se inscrevem, pagam via Mercado Pago, fazem palpites em partidas e competem em rankings. O produto é um PWA mobile-first hospedado na Vercel.

**Stack:**
- Frontend: React 18 + TypeScript + Vite
- Estilização: Tailwind CSS + shadcn/ui (componentes em `src/components/ui/`)
- Backend: Supabase (Auth, Postgres, Edge Functions em Deno, RLS)
- Pagamentos: Mercado Pago (checkout externo via `init_point`)
- Testes: Vitest (unitários) + Playwright (e2e)
- Deploy: Vercel (frontend) + Supabase Cloud (backend)

---

## Comandos Essenciais

```bash
# Desenvolvimento
npm run dev           # Vite dev server (porta 8080)
npm run build         # Build de produção
npm run preview       # Preview do build

# Testes
npm run test          # Vitest (unitários)
npx playwright test e2e/smoke.spec.ts --reporter=list   # Smoke tests e2e
npx playwright test --project=chromium                  # CI

# Supabase
npx supabase functions serve      # Edge Functions locais
npx supabase db push              # Aplicar migrations
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

# Scripts utilitários
node scripts/create-tester.cjs    # Cria usuário tester
node scripts/sync-brasileirao-now.cjs  # Sincroniza jogos do Brasileirão
```

---

## Arquitetura

### Frontend (`src/`)

```
src/
  pages/          # Rotas principais (uma página = um arquivo)
  components/
    ui/           # shadcn/ui — NÃO editar diretamente; regenerar via CLI do shadcn
    *.tsx         # Componentes de domínio (MatchCard, Header, BottomNav, etc.)
  hooks/          # React hooks customizados
  integrations/
    supabase/
      client.ts   # Instância singleton do Supabase
      types.ts    # Tipos gerados — NÃO editar manualmente
  lib/
    scoring.ts    # Lógica de pontuação (MANTER SINCRONIZADO com score-match Edge Function)
    cpf.ts        # Validação/formatação de CPF e telefone
    utils.ts      # cn() e helpers gerais
  data/
    teams.ts      # Lista de times da Copa 2026
    matches.ts    # Dados estáticos de partidas (fallback)
```

### Rotas (React Router)

| Rota | Página | Acesso |
|---|---|---|
| `/` | `Landing` | Público |
| `/auth` | `Auth` | Público |
| `/jogos` | `Matches` | Autenticado |
| `/rankings` | `Rankings` | Público |
| `/grupos` | `Groups` | Autenticado |
| `/grupos/:id` | `GroupDetail` | Autenticado |
| `/perfil` | `Profile` | Autenticado |
| `/planos` | `Pricing` | Autenticado |
| `/long-term` | `LongTerm` | Autenticado (pago) |
| `/admin` | `Admin` | Admin only |
| `/privacy` | `Privacy` | Público |
| `/payment-return` | `PaymentReturn` | Autenticado |

### Backend — Supabase Edge Functions (`supabase/functions/`)

| Função | Descrição |
|---|---|
| `register-participant` | Cadastro no onboarding (valida CPF, cria participant) |
| `create-mp-preference` | Cria preferência de pagamento no Mercado Pago |
| `mp-webhook` | Recebe notificações do MP, confirma pagamento |
| `admin-confirm-payment` | Confirmação manual pelo admin |
| `score-match` | Calcula e persiste pontos de palpites após resultado |
| `validate-coupon` | Valida cupom de desconto server-side |
| `sync-matches` | Sincroniza partidas via ESPN API |
| `seed-brasileirao` | Seed de partidas do Brasileirão |
| `setup-test-user` | Cria usuário de teste para e2e |

---

## Banco de Dados — Tabelas Principais

| Tabela | Descrição |
|---|---|
| `participants` | Dados do participante (CPF, nome, estado, cidade, plano, `payment_confirmed`) |
| `matches` | Partidas da Copa (team_a, team_b, stage, date, `starts_at`, `espn_id`) |
| `predictions` | Palpites do usuário por partida |
| `match_results` | Resultado oficial de cada partida |
| `groups` / `group_members` | Grupos de bolão com `invite_code` |
| `long_term_predictions` | Palpites de longo prazo (campeão, artilheiro, etc.) |
| `coupons` | Cupons de desconto (`percent` ou `fixed`) |
| `site_settings` | Configurações dinâmicas (flag `registrations_open`, etc.) |

**Views úteis:**
- `participants_public_view` — dados públicos dos participantes (sem CPF/WhatsApp)
- `site_settings_public` — configurações acessíveis a `anon`

**RLS:** Todas as tabelas têm RLS habilitado. Sempre usar o `supabase` client autenticado nas Edge Functions com `SUPABASE_SERVICE_ROLE_KEY` quando precisar bypass de RLS.

---

## Lógica de Pontuação

Definida em `src/lib/scoring.ts` — **manter IDÊNTICA** à Edge Function `score-match/index.ts`.

| Evento | Pontos |
|---|---|
| Gabarito perfeito (todos os 8 campos) | **100 pts** (sobrescreve individuais) |
| Placar exato | 25 pts |
| Vencedor/empate correto | 10 pts |
| Saldo de gols correto (sem placar exato) | 15 pts (substitui os 10 do vencedor) |
| Gol no 1º tempo | 5 pts |
| Gol no 2º tempo | 5 pts |
| Cartão vermelho correto (acertou "Sim") | 12 pts |
| Cartão vermelho correto (acertou "Não") | 5 pts |
| Pênalti correto (acertou "Sim") | 12 pts |
| Pênalti correto (acertou "Não") | 5 pts |
| 1º a marcar correto | 8 pts |
| Posse de bola correta | 5 pts |

---

## Planos de Pagamento

Preços **em centavos** (nunca aceitar valores do cliente):

| ID | Nome | Valor |
|---|---|---|
| `pro-avista` | Pro à vista | R$ 250,00 (25000 centavos) |
| `pro-parcelado` | Pro parcelado | R$ 300,00 (30000 centavos) |

Fluxo: `create-mp-preference` → redirect para `init_point` do MP → webhook `mp-webhook` confirma → `payment_confirmed = true`.

---

## Hooks Principais

- **`useAuth()`** — sessão Supabase, `user`, `signOut`
- **`useParticipant()`** — dados do participante logado, `hasPaid`, `isAdmin`
- **`useSubscription()`** — status da assinatura
- **`useSiteSettings()`** — configurações do site (ex: `registrations_open`)

---

## Convenções de Código

- **TypeScript strict** — sem `any` sem justificativa
- **Componentes UI**: sempre importar de `@/components/ui/` (shadcn)
- **Alias de importação**: usar `@/` para `src/` (configurado no `tsconfig` e `vite.config`)
- **Estilização**: Tailwind utilities. Classes customizadas globais em `src/index.css`:
  - `btn-gold` — botão dourado principal
  - `bg-glass` / `bg-glass-gold` — cards com blur
  - `shadow-[var(--shadow-gold)]` — sombra dourada
- **Toasts**: usar `toast` de `sonner` (não o hook legado `use-toast`)
- **Datas/horários**: campo `starts_at` (timestamptz) é a fonte de verdade; `date`+`time` são legados

---

## Testes

```bash
# Unitários (Vitest)
npm run test
# Arquivos: src/test/hooks/*.test.tsx

# E2E (Playwright)
# Requer app rodando em localhost:8080
BASE_URL=http://localhost:8080 npx playwright test e2e/smoke.spec.ts
# Para teste de login: definir E2E_TESTER_USER=<username>
```

---

## Variáveis de Ambiente

### Frontend (`.env.local`)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Edge Functions (Supabase Secrets)
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
MP_ACCESS_TOKEN          # Mercado Pago token de produção
SITE_URL                 # URL do frontend (CORS)
```

---

## Deploy

- **Frontend**: push para `main` → deploy automático na Vercel
- **Edge Functions**: `npx supabase functions deploy <nome-da-função>`
- **Migrations**: `npx supabase db push` (produção via Supabase dashboard)
- Configurações adicionais em `DEPLOY.md`

---

## Armadilhas Conhecidas

1. **`scoring.ts` vs `score-match/index.ts`** — qualquer mudança na lógica de pontos deve ser aplicada nos dois lugares simultaneamente.
2. **Tipos do Supabase** — sempre regenerar após criar/alterar tabelas: `npx supabase gen types typescript --local > src/integrations/supabase/types.ts`. Nunca editar `types.ts` manualmente.
3. **Componentes `ui/`** — gerados pelo shadcn CLI. Não editar diretamente; customizar via CSS variables em `index.css` ou criando wrappers.
4. **RLS** — ao criar novas tabelas, sempre habilitar RLS e definir políticas explícitas. Usar `SUPABASE_SERVICE_ROLE_KEY` apenas em Edge Functions server-side.
5. **Preços em centavos** — `create-mp-preference` e `validate-coupon` usam a constante `PLAN_AMOUNTS` como fonte de verdade. Nunca aceitar valores monetários vindos do cliente.
6. **`espn_id`** — campo único em `matches`; upserts devem usar `onConflict: "espn_id"`.
