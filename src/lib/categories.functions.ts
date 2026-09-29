import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPublicClient, resolveImage, resolveImages } from "./supabase-public.server";

export const listMainCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("main_categories")
    .select("id,name,slug,image_url,display_order,opens_saree_categories")
    .eq("enabled", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return Promise.all((data ?? []).map(async (row) => ({
    ...row,
    image_url: row.image_url ? await resolveImage(supabase, row.image_url) : "",
  })));
});

export const listSareeCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("saree_categories")
    .select("id,name,slug,image_url,display_order")
    .eq("enabled", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return Promise.all((data ?? []).map(async (row) => ({
    ...row,
    image_url: row.image_url ? await resolveImage(supabase, row.image_url) : "",
  })));
});

const categoryProductsInput = z.object({
  mainSlug: z.string().min(1).max(100),
  sareeSlug: z.string().min(1).max(100).optional(),
});

export const getCategoryProducts = createServerFn({ method: "GET" })
  .inputValidator((input) => categoryProductsInput.parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { data: main, error: mainError } = await supabase
      .from("main_categories")
      .select("id,name,slug,opens_saree_categories")
      .eq("slug", data.mainSlug)
      .eq("enabled", true)
      .maybeSingle();
    if (mainError) throw mainError;
    if (!main) return null;

    let sareeCategory: { id: string; name: string; slug: string } | null = null;
    if (data.sareeSlug) {
      const { data: row, error } = await supabase
        .from("saree_categories")
        .select("id,name,slug")
        .eq("slug", data.sareeSlug)
        .eq("enabled", true)
        .maybeSingle();
      if (error) throw error;
      if (!row) return null;
      sareeCategory = row;
    }

    let query = supabase
      .from("products")
      .select("id,name,slug,price_inr,compare_at_price_inr,images,saree_type,fabric,state_id,featured")
      .eq("in_stock", true)
      .eq("main_category_id", main.id)
      .order("created_at", { ascending: false });
    if (sareeCategory) query = query.eq("saree_category_id", sareeCategory.id);
    const { data: products, error } = await query;
    if (error) throw error;
    return {
      main,
      sareeCategory,
      products: await Promise.all((products ?? []).map(async (row) => ({
        ...row,
        images: await resolveImages(supabase, row.images),
      }))),
    };
  });