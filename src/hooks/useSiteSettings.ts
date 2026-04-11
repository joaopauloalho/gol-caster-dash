import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  hero_title?: string;
  hero_subtitle?: string;
  prizes_json?: Array<{ pos: string; prize: string }>;
  feature_flags?: {
    show_ranking: boolean;
    show_groups: boolean;
    show_longterm: boolean;
    paywall_active: boolean;
  };
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("site_settings_public")
      .select("key, value")
      .then(({ data }) => {
        if (data) {
          const map: SiteSettings = {};
          for (const row of data) {
            (map as Record<string, unknown>)[row.key] = row.value;
          }
          setSettings(map);
        }
        setLoading(false);
      });
  }, []);

  return { settings, loading };
}
