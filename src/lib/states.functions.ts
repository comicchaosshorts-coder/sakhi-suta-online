import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPublicClient, resolveImages } from "./supabase-public.server";

export const listStates = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("states")
    .select("id,name,slug,saree_types,hero_image_url,description,display_order")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
});

export const getStateBySlug = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(100) }).parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { data: state, error } = await supabase
      .from("states")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw error;
    if (!state) return null;

    const { data: products } = await supabase
      .from("products")
      .select("id,name,slug,price_inr,compare_at_price_inr,images,saree_type,fabric")
      .eq("state_id", state.id)
      .eq("in_stock", true)
      .order("created_at", { ascending: false });

    const withImgs = await Promise.all(
      (products ?? []).map(async (p) => ({ ...p, images: await resolveImages(supabase, p.images) })),
    );

    return { state, products: withImgs };
  });
