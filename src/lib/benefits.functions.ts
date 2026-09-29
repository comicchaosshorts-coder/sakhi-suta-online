import { createServerFn } from "@tanstack/react-start";
import { createPublicClient, resolveImage } from "./supabase-public.server";

export const listBenefits = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("benefits")
    .select("id,name,text,icon,image_url,display_order")
    .eq("enabled", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return Promise.all((data ?? []).map(async (row) => ({
    ...row,
    image_url: row.image_url ? await resolveImage(supabase, row.image_url) : "",
  })));
});