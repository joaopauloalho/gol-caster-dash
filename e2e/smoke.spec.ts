/**
 * Smoke tests — validam que as rotas principais carregam sem erro crítico.
 * Não requerem conta real: testam UI pública e redirecionamentos.
 *
 * Para rodar: npx playwright test e2e/smoke.spec.ts --reporter=list
 * No CI: npx playwright test --project=chromium
 */
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:8080";

test.describe("Smoke — rotas públicas", () => {
  test("landing page carrega", async ({ page }) => {
    await page.goto(BASE);
    await expect(page).not.toHaveTitle(/error|404/i);
    // Botão de inscrição visível
    await expect(page.getByRole("button", { name: /inscrever|entrar/i }).first()).toBeVisible();
  });

  test("/auth carrega sem erros de console críticos", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto(`${BASE}/auth`);
    await page.waitForLoadState("networkidle");

    // Erros de rede externos (MP, CDN) são ignorados; apenas erros JS locais importam
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("flagcdn") &&
        !e.includes("mercadopago") &&
        !e.includes("favicon")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("/rankings carrega lista ou estado vazio", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto(`${BASE}/rankings`);
    await page.waitForLoadState("networkidle");

    // Deve ter título de ranking
    await expect(page.getByText(/ranking/i).first()).toBeVisible();

    const criticalErrors = errors.filter(
      (e) => !e.includes("flagcdn") && !e.includes("favicon")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("/grupos carrega sem erro crítico", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto(`${BASE}/grupos`);
    await page.waitForLoadState("networkidle");

    const criticalErrors = errors.filter(
      (e) => !e.includes("flagcdn") && !e.includes("favicon")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("/jogos carrega lista ou estado vazio sem erro", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto(`${BASE}/jogos`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/jogos|partida|rodada/i).first()).toBeVisible();

    const criticalErrors = errors.filter(
      (e) => !e.includes("flagcdn") && !e.includes("favicon")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("rota inexistente exibe 404/NotFound", async ({ page }) => {
    await page.goto(`${BASE}/rota-inexistente-xyz`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/404|não encontrada|not found/i)).toBeVisible();
  });
});

test.describe("Smoke — tester login", () => {
  const TESTER_USER = process.env.E2E_TESTER_USER || "e2etest";
  const TESTER_PASS = "123456";

  test.skip(
    !process.env.E2E_TESTER_USER,
    "Defina E2E_TESTER_USER para rodar teste de login"
  );

  test("login de tester e redirecionamento para /jogos", async ({ page }) => {
    await page.goto(`${BASE}/auth`);

    // Selecionar aba Acesso Rápido
    await page.getByRole("button", { name: /acesso rápido/i }).click();

    // Preencher username
    await page.getByPlaceholder(/seu_username/i).fill(TESTER_USER);

    // Submeter
    await page.getByRole("button", { name: /entrar/i }).click();

    // Aguardar navegação
    await page.waitForURL(/\/jogos/, { timeout: 10000 });
    expect(page.url()).toContain("/jogos");
  });
});
