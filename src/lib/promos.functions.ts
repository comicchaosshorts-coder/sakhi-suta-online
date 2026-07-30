import { createServerFn } from "@tanstack/react-start";
import { createPublicClient } from "./supabase-public.server";

export type PromoRow = {
  id: string;
  kind: string;
  text: string;
  subtext: string | null;
  link_url: string | null;
  display_order: number;
  active: boolean;
};

export const listPromoContent = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("promo_content")
    .select("id,kind,text,subtext,link_url,display_order,active")
    .eq("active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PromoRow[];
});
