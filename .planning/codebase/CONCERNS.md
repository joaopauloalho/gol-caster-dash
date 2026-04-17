# Codebase Concerns

**Analysis Date:** 2026-04-17

---

## CRITICAL

---

### Phase Multiplier Divergence Between Frontend and Score Engine

- **Issue:** `src/data/matches.ts` (`PHASE_MULTIPLIERS`) and `supabase/functions/score-match/index.ts` (`MULTIPLIERS`) use different numeric multipliers for the same knockout rounds. The two must be identical per the project's own stated invariant.
- **Files:**
  - `src/data/matches.ts` lines 32–40 (frontend preview)
  - `supabase/functions/score-match/index.ts` lines 26–33 (authoritative scoring)
- **Specific divergence:**

  | Stage (DB value) | score-match multiplier | frontend PHASE_MULTIPLIERS |
  |---|---|---|
  | `Round of 16` / `Oitavas` | 2 | **3** |
  | `Quarter-finals` / `Quartas` | 3 | **5** |
  | `Semi-finals` / `Semis` | 4 | **7** |
  | `Final` | 5 | **10** |

- **Impact:** Every "Potencial: até X pts" hint shown to the user in `MatchCard` (line 1019) is wrong for all knockout rounds. Worse, the hint will make users believe they earned far more points than they actually did. This is a user-trust issue and potential support/complaint driver at scale.
- **Fix approach:** Decide on canonical multiplier table, update **both** files simultaneously. Consider extracting into a shared constant (even a JSON file committed to the repo) referenced from both the Vite build and the Deno edge function via a fetch/import.

---

### `get_server_time` RPC Used in Production But Not in Tracked Migrations

- **Issue:** `src/components/MatchCard.tsx` line 551 calls `supabase.rpc("get_server_time")` as a server-side time check to prevent late prediction saves. This function is defined only in `scripts/sprint1_migration.sql` (an untracked script), **not** in any file under `supabase/migrations/`. If the DB is re-provisioned or the team runs `npx supabase db push`, the function will be absent and every prediction save attempt will silently fall through the `if (!timeErr && serverTime)` guard — meaning the client-side clock becomes the sole lock enforcement.
- **Files:**
  - `src/components/MatchCard.tsx` lines 550–558
  - `scripts/sprint1_migration.sql` lines 90–91 (only definition)
  - `supabase/migrations/` (absent)
- **Impact:** Without `get_server_time`, the 30-minute prediction deadline is only enforced client-side. A user with a tampered system clock or who intercepts the request can submit predictions after match start.
- **Fix approach:** Create a new tracked migration (e.g., `supabase/migrations/YYYYMMDD_add_get_server_time.sql`) containing `CREATE OR REPLACE FUNCTION get_server_time() RETURNS timestamptz LANGUAGE sql STABLE AS $$ SELECT now(); $$;`. Add appropriate REVOKE/GRANT.

---

### Predictions RLS UPDATE Policy Blocks Score-Match Engine

- **Issue:** Migration `20260410140000_security_hardening.sql` (lines 162–168) sets the `predictions` UPDATE policy to `USING (auth.uid()::text = user_id AND points_earned = 0)`. The `score-match` edge function updates `points_earned` using the `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS — so this is not the direct problem. However, if `points_earned` is ever null (not 0) at save time, the initial user upsert in `MatchCard.tsx` line 572 sets `points_earned: 0`. If that column is already non-zero from a re-scoring scenario, the user's UPDATE attempt will fail silently: `error` is checked (line 576) but only a toast is shown, and the policy USING clause rejects the update at DB level without a clear policy violation error being surfaced.
- **Files:**
  - `supabase/migrations/20260410140000_security_hardening.sql` lines 162–168
  - `src/components/MatchCard.tsx` lines 561–576
- **Impact:** Silent prediction save failures for previously scored matches that get re-opened for correction.
- **Fix approach:** The existing `isLocked` check (line 535) should prevent saves on scored matches. Verify this path is fully covered and add server-side enforcement in the edge function rather than relying on RLS alone.

---

## HIGH

---

### `useParticipant` Silently Swallows DB Errors — No Error State Exposed

- **Issue:** `src/hooks/useParticipant.tsx` (lines 30–40) performs a Supabase query and calls `setParticipant(data as Participant | null)` without ever checking the returned `error`. A network error, RLS rejection, or schema mismatch returns `null` for `data`, making the hook indistinguishable from "user has no participant row". The `hasPaid` flag then returns `false`, blocking the user from submitting predictions.
- **Files:** `src/hooks/useParticipant.tsx` lines 31–39
- **Impact:** A transient network error silently locks out a paying user from the entire product. No error state is exposed for the calling page to show a retry UI.
- **Fix approach:** Destructure `{ data, error }`, set a separate `error` state, expose it from the hook return value. Callers (`Matches`, `Profile`, `LongTerm`) can then show a retry button.

---

### `useSubscription` Fetches Missing `subscriptions` Table — Not in Tracked Migrations

- **Issue:** `src/hooks/useSubscription.tsx` line 25 queries `supabase.from("subscriptions")`. This table appears in the Mercado Pago webhook (`mp-webhook/index.ts` line 181) but there is no tracked migration in `supabase/migrations/` that creates it. The generated `types.ts` would need to include it for type safety. Currently `data` is cast `as Subscription | null` (line 29), masking any query error.
- **Files:**
  - `src/hooks/useSubscription.tsx` lines 24–30
  - `supabase/functions/mp-webhook/index.ts` lines 181–191
- **Impact:** If the `subscriptions` table does not exist in a clean environment, every `useSubscription` call returns null silently. The `isActive` flag stays false, and the paywall blocks all paying users. No error is surfaced.
- **Fix approach:** Add a tracked migration creating the `subscriptions` table with proper RLS. Expose the query `error` from the hook.

---

### `useSubscription.createMpPreference` Sends `amount` from Client — Ignored by Server but Still a Bad Pattern

- **Issue:** `src/hooks/useSubscription.tsx` line 54 sends `amount` in the POST body to `create-mp-preference`. The edge function (correctly) ignores this value and uses `PLAN_AMOUNTS` server-side. However, the frontend computes this value in `createMpPreference(plan, amount)` where `amount` is passed by the caller. If a future code change ever causes the edge function to read the body `amount`, this becomes a critical price manipulation vector.
- **Files:**
  - `src/hooks/useSubscription.tsx` lines 39–67
  - `supabase/functions/create-mp-preference/index.ts` lines 63–68
- **Impact:** Currently safe; latent risk if edge function logic changes.
- **Fix approach:** Remove `amount` from the POST body in `useSubscription.tsx`. The `createMpPreference` signature should only accept `plan: string`.

---

### Admin Panel Fetches All Participants Including PII With Direct Client Query

- **Issue:** `src/pages/Admin.tsx` line 139 calls `supabase.from("participants").select("*")` directly with the user's JWT. This works because the `is_admin()` RLS policy allows admins full read access (migration `20260410140000_security_hardening.sql` line 65). However, the raw `participants` table contains `cpf`, `whatsapp`, `email`, and `birth_date` — LGPD-sensitive fields. The migration itself (lines 35–37) contains a `TODO` noting this should be migrated to a service-role edge function before launch.
- **Files:**
  - `src/pages/Admin.tsx` line 139
  - `supabase/migrations/20260410140000_security_hardening.sql` lines 35–37
- **Impact:** Admin JWT (a bearer token) is transmitted in browser requests. If intercepted or if the admin account is compromised, all PII is accessible. The `TODO pré-launch` in the migration acknowledges this.
- **Fix approach:** Create an `admin-participants` edge function that uses service role, returns participants with appropriate PII masking (e.g., partial CPF, masked phone), and add rate limiting.

---

### `MatchCard` `fetchFromServer` Has Suppressed `exhaustive-deps` Warning — Stale Closure Risk

- **Issue:** `src/components/MatchCard.tsx` line 452 has `// eslint-disable-line react-hooks/exhaustive-deps` on the `useEffect` that calls `fetchFromServer`. The dependency array only includes `[user]` but `fetchFromServer` is a `useCallback` that also depends on `predictionLoaded` and `localKey`. If `localKey` changes after initial mount (e.g., user object reference changes), the fetch will not re-run with the updated key.
- **Files:** `src/components/MatchCard.tsx` lines 450–452
- **Impact:** Stale localStorage key used in server fetch — prediction could be written to wrong localStorage slot.
- **Fix approach:** Add `fetchFromServer` to the `useEffect` dependency array (it is already memoized with `useCallback`). Remove the `eslint-disable` comment.

---

### `scores-match` Does Individual `UPDATE` Per Prediction — N+1 Query Pattern

- **Issue:** `supabase/functions/score-match/index.ts` lines 195–207 iterate over all predictions for a match and issue one `UPDATE` per prediction plus one `RPC` call per prediction with points > 0. For a popular match with 10,000 predictions, this is 10,000–20,000 sequential DB round-trips inside a single Edge Function invocation (which has a 60-second timeout by default).
- **Files:** `supabase/functions/score-match/index.ts` lines 195–207
- **Impact:** Function will time out for matches with high prediction counts. Partial scoring (some users scored, others not) will occur with no rollback.
- **Fix approach:** Use a single `UPDATE predictions SET points_earned = CASE ... END WHERE match_id = $1` with all point values computed in the application layer and sent as a bulk payload, or move scoring to a Postgres function that runs entirely in-database. At minimum, wrap in a transaction.

---

### `stageToPhase` Falls Through to "Final" for Unknown Stages

- **Issue:** `src/data/matches.ts` function `stageToPhase` (lines 53–61) returns `"Final"` for any unrecognized stage string. The `PHASE_MULTIPLIERS["Final"]` value is 10. If ESPN sync introduces a new stage string (e.g., `"Third Place"`), all its matches will silently get a 10x multiplier in the UI preview.
- **Files:** `src/data/matches.ts` lines 53–61
- **Impact:** Points preview shown to users is wildly incorrect for any stage not in the explicit list.
- **Fix approach:** Change the fallthrough to return `"Grupos"` (multiplier 1) and add a `console.warn` for unknown stages. Or add `"Third Place"` explicitly (it already appears in the `stageMap` fetch list on line 87).

---

### `LongTerm.tsx` Fetches Teams from External ESPN API Without Timeout or Fallback Retry

- **Issue:** `src/pages/LongTerm.tsx` line 156 fetches directly from `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams` — an undocumented, unofficial ESPN endpoint with no SLA. There is no request timeout. If ESPN is slow, `teamsLoading` remains `true` indefinitely, rendering all ComboCard fields as a pulsing skeleton with no fallback message.
- **Files:** `src/pages/LongTerm.tsx` lines 154–178
- **Impact:** Users cannot complete long-term predictions if ESPN is slow/down at a critical time (e.g., days before tournament starts).
- **Fix approach:** Add `AbortController` with a timeout (e.g., 5 seconds). On timeout, fall through to `TEAMS_FALLBACK` and set `teamsLoading(false)` immediately. Consider caching the team list in Supabase via the `sync-matches` function.

---

### `Profile.tsx` Uses `window.location.reload()` After Team Save

- **Issue:** `src/pages/Profile.tsx` line 123 calls `window.location.reload()` to refresh the `participant` data after saving the favorite team. This destroys all React state, triggers a full page reload, and invalidates the auth session cache (requiring a round-trip to `getSession`).
- **Files:** `src/pages/Profile.tsx` line 123
- **Impact:** Jarring UX; on slow connections it briefly shows the unauthenticated state before re-hydration.
- **Fix approach:** Expose a `refetch` function from `useParticipant` (analogous to `refetch` in `useSubscription`) and call it instead of `window.location.reload()`.

---

## MEDIUM

---

### `useParticipant` Does Not Refetch After Payment Confirmation

- **Issue:** `src/hooks/useParticipant.tsx` fetches participant data once on `user` change and never re-fetches. After `mp-webhook` confirms payment and sets `payment_confirmed = true`, the in-memory `hasPaid` value stays `false` until the user manually refreshes. The paywall check in `MatchCard.tsx` (line 537) and `LongTerm.tsx` (line 213) relies on `hasPaid`.
- **Files:** `src/hooks/useParticipant.tsx`, `src/pages/PaymentReturn.tsx`
- **Impact:** User is redirected to `/jogos` after successful payment (via `PaymentReturn`) but the paywall remains active until hard refresh.
- **Fix approach:** Expose a `refetch` function. `PaymentReturn.tsx` already polls `subscriptions` — it should also call participant `refetch` when `payment_status === "active"`.

---

### `Rankings.tsx` `group` Tab Makes 3 Sequential Queries Without Error Handling

- **Issue:** `src/pages/Rankings.tsx` lines 60–76 chains three Supabase queries sequentially (`group_members` → `group_members` again → `participants_public_view`) with no error handling on any of them. If any query fails, `participants` is set to `[]` silently and the UI shows "Entre em um grupo para ver o ranking" even though the user is in a group.
- **Files:** `src/pages/Rankings.tsx` lines 59–76
- **Impact:** Silently incorrect ranking display if any intermediate query fails.
- **Fix approach:** Check `error` return values and display a meaningful error state.

---

### `data/matches.ts` `fetchMatchesByPhase` Uses `row: any` Cast

- **Issue:** `src/data/matches.ts` line 101 maps with `(row: any)`. The `Database` types generated by Supabase include a typed `matches` table row. Using `any` here means that any column rename or type change in the DB will compile without error but produce `undefined` values at runtime (e.g., `row.starts_at` silently becomes undefined if the column is renamed).
- **Files:** `src/data/matches.ts` line 101
- **Impact:** Runtime bugs from schema changes are not caught at compile time.
- **Fix approach:** Replace `row: any` with `Database["public"]["Tables"]["matches"]["Row"]` from `@/integrations/supabase/types`.

---

### `OnboardingWizard` Sends `amount` (Hardcoded) in Preference Request Body

- **Issue:** `src/components/OnboardingWizard.tsx` line 261 computes `planAmount` locally (`plan === "avista" ? 25000 : 30000`) and sends it to `create-mp-preference` (line 268). The edge function ignores it, but the wizard uses the string `"avista"` while `create-mp-preference` expects `"pro-avista"` — the `planId` is correctly derived on line 261 but the local amount computation duplicates the PLAN_AMOUNTS constant that only lives server-side.
- **Files:** `src/components/OnboardingWizard.tsx` lines 260–276
- **Impact:** The `amount` field in the POST body is a dead parameter. If the amount ever needs to change (e.g., early-bird pricing), there are now 3 places to update: `validate-coupon`, `create-mp-preference`, and `OnboardingWizard.tsx`.
- **Fix approach:** Remove `amount` from the wizard's POST body. It is already ignored server-side.

---

### `Admin.tsx` `useEffect` for Tab Lazy-Loading Has Missing Dependencies

- **Issue:** `src/pages/Admin.tsx` lines 179–183 — the lazy-load `useEffect` depends on `activeTab` but also accesses `kpis`, `kpisLoading`, `siteSettings`, `settingsLoading`, `coupons`, and `couponsLoading` without listing them as dependencies. This is the same stale-closure class of bug suppressed elsewhere. React may not re-evaluate the condition when these state values change.
- **Files:** `src/pages/Admin.tsx` lines 179–183
- **Impact:** Tabs may not reload data even when the backing state signals it should (e.g., after a failed fetch that clears `kpis` to null).
- **Fix approach:** Add all referenced state variables to the dependency array, or use refs for the "has loaded" flags.

---

### `Groups.tsx` `handleJoin` Does Not Check Supabase Error from `group` Query

- **Issue:** `src/pages/Groups.tsx` line 102 queries for a group by invite code but only checks `if (!group)` — it never inspects `groupError`. A RLS rejection or network error returns `null` for `data` and an error object, but the code shows "Código de convite inválido" instead of a network error message.
- **Files:** `src/pages/Groups.tsx` lines 101–107
- **Impact:** Misleading error message for legitimate users experiencing network issues.
- **Fix approach:** Also check `if (groupError)` and display appropriate message.

---

### `participants_public_view` Grants Access to Unauthenticated Users Via `anon` Role

- **Issue:** Migration `20260410130000_participants_public_read.sql` (filename suggests public read) and `20260410160000_view_add_payment_confirmed.sql` grant `SELECT` on `participants_public_view TO authenticated`. However, `Rankings.tsx` is listed as a public route (no auth required per `CLAUDE.md`). When an unauthenticated user visits `/rankings`, the Supabase query uses the `anon` key. If `anon` is not explicitly granted (or denied) on the view, the query will fail or return empty.
- **Files:**
  - `src/pages/Rankings.tsx` (public route)
  - `supabase/migrations/20260410160000_view_add_payment_confirmed.sql`
- **Impact:** Rankings page shows empty list for logged-out users even though the route is intended to be public.
- **Fix approach:** Either grant `SELECT ON participants_public_view TO anon` in a migration, or add a login prompt for the rankings page, or change the route to require auth.

---

### `validate-coupon` Does Not Increment `uses_count` at Validation Time

- **Issue:** `supabase/functions/validate-coupon/index.ts` (comment lines 3–4) notes that "resgate ocorre ao confirmar o pagamento." However, there is no edge function (and no migration trigger) that increments `uses_count` when payment is confirmed. The `mp-webhook` function (`mp-webhook/index.ts`) does not touch the `coupons` table.
- **Files:**
  - `supabase/functions/validate-coupon/index.ts` lines 3–4
  - `supabase/functions/mp-webhook/index.ts` (absent coupon handling)
- **Impact:** `max_uses` limit is never enforced in practice; coupon can be used unlimited times.
- **Fix approach:** In `mp-webhook`, after confirming payment, check if `external_reference` contains a coupon ID (requires storing it in the preference or `subscriptions` table), then increment `uses_count`.

---

### No Loading State Guard in `useAuth` Before `useParticipant` Fetch

- **Issue:** `src/hooks/useAuth.tsx` initializes `loading: true` (line 24) but `useParticipant.tsx` triggers its fetch as soon as `user` is non-null — which can happen before the `getSession()` promise resolves if `onAuthStateChange` fires first. The `useAuth` hook has both `onAuthStateChange` and `getSession()` running concurrently (lines 27–39), and both call `setLoading(false)`. There is a race condition where the auth state could flip from `null → user → null` on initial load if `getSession` resolves after `onAuthStateChange` with an expired token.
- **Files:** `src/hooks/useAuth.tsx` lines 26–40
- **Impact:** `useParticipant` may fire an initial fetch with a stale `user` and then not re-fetch when the correct session arrives.
- **Fix approach:** Only call `setLoading(false)` in `getSession().then()`, using `onAuthStateChange` solely for subsequent changes (not the initial load). Alternatively, rely exclusively on `onAuthStateChange` and remove the `getSession` call since `onAuthStateChange` fires with the initial session.

---

### `ScoreControl` Input Allows Values 0–20 Via Keyboard But Max Attribute Is 99

- **Issue:** `src/components/MatchCard.tsx` lines 212–223 — the `<input>` has `max={99}` but the `onChange` handler enforces `n <= 20`. The `max` attribute is misleading to browser accessibility tools and form validation.
- **Files:** `src/components/MatchCard.tsx` lines 212–223
- **Impact:** Minor: inconsistency between HTML attribute and JS validation; screen readers may announce incorrect range.
- **Fix approach:** Set `max={20}` to match the enforced limit.

---

## Tech Debt Notes

**Scoring duplication acknowledged:** The codebase comments note the duplication of `calculateMatchPoints` between `src/lib/scoring.ts` and `supabase/functions/score-match/index.ts` is intentional due to Deno/Vite incompatibility. The multiplier tables should be treated the same way — they must be kept in sync manually and should be compared in any code review touching either file.

**`scripts/sprint1_migration.sql`:** This file exists outside `supabase/migrations/` and likely represents DB state applied manually. Functions defined there (`get_server_time`, possibly others) are not guaranteed to exist in CI/CD deployments. An audit of this file against the tracked migrations should be performed before any environment rebuild.

---

*Concerns audit: 2026-04-17*
