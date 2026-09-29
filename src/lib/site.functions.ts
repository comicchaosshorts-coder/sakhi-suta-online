import { createServerFn } from "@tanstack/react-start";
import { createPublicClient } from "./supabase-public.server";

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return data;
});

export const getMapSvg = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("map_svg_url")
    .eq("id", 1)
    .maybeSingle();
  const path = settings?.map_svg_url;
  if (!path) return { svg: null as string | null };

  // path is stored as "bucket/key" or just "key" in brand-assets
  const key = path.startsWith("brand-assets/") ? path.slice("brand-assets/".length) : path;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage.from("brand-assets").download(key);
  if (error || !data) return { svg: null };
  const svg = await data.text();
  return { svg };
});
