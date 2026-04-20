import { useQuery } from "@tanstack/react-query";
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
  const { data: settings = {}, isLoading: loading } = useQuery({
    queryKey: ["siteSettings"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings_public")
        .select("key, value");

      const map: SiteSettings = {};
      if (data) {
        for (const row of data) {
          (map as Record<string, unknown>)[row.key] = row.value;
        }
      }
      return map;
    },
  });

  return { settings, loading };
}
