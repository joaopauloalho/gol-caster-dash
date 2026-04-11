-- =============================================================================
-- SITE_SETTINGS — configurações e conteúdo gerenciáveis pelo admin
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  key        text        PRIMARY KEY,
  value      jsonb       NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid        REFERENCES auth.users(id)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Apenas admin lê/escreve; usa is_admin() já definido em 20260410140000
CREATE POLICY "site_settings: admin all"
  ON public.site_settings FOR ALL TO authenticated
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

-- View pública: expõe só chaves não-sensíveis para o frontend ler sem auth
-- (hero, prizes, flags — nunca expor chaves de infra ou config interna)
DROP VIEW IF EXISTS public.site_settings_public;
CREATE VIEW public.site_settings_public AS
SELECT key, value
FROM public.site_settings
WHERE key IN ('hero_title', 'hero_subtitle', 'prizes_json', 'feature_flags');

GRANT SELECT ON public.site_settings_public TO anon, authenticated;

-- RPC read-only para o hook useSiteSettings (admin lê tudo, anon lê view pública)
-- A view já serve para o frontend; sem RPC extra necessária.

-- Seed: valores padrão (ON CONFLICT = não sobrescreve se admin já editou)
INSERT INTO public.site_settings (key, value) VALUES
  ('hero_title',     '"Super Bolão da Copa 2026"'),
  ('hero_subtitle',  '"Acerte os placares e concorra a uma Hilux 0km!"'),
  ('prizes_json',    '[
    {"pos":"🥇 1º","prize":"Hilux 0km"},
    {"pos":"🥈 2º","prize":"R$ 5.000"},
    {"pos":"🥉 3º","prize":"R$ 2.500"},
    {"pos":"🏅 Top 10","prize":"Camisa da Seleção"},
    {"pos":"⭐ Maior Indicador","prize":"JBL Charge 5"},
    {"pos":"🎯 Placar Perfeito","prize":"R$ 100 / rodada"}
  ]'),
  ('feature_flags',  '{"show_ranking":true,"show_groups":true,"show_longterm":true,"paywall_active":false}'),
  ('whatsapp_support', '"5511999999999"')
ON CONFLICT (key) DO NOTHING;
