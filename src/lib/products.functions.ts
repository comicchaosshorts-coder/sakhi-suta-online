import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPublicClient, resolveImage, resolveImages } from "./supabase-public.server";

async function resolveCardImage(imageRefs: string[] | null, supabase: ReturnType<typeof createPublicClient>) {
  const firstImage = imageRefs?.[0];
  return firstImage ? [await resolveImage(supabase, firstImage)] : [];
}

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        featured: z.boolean().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    let q = supabase
      .from("products")
      .select("id,name,slug,price_inr,compare_at_price_inr,images,saree_type,fabric,state_id,featured")
      .eq("in_stock", true)
      .order("created_at", { ascending: false });
    if (data.featured) q = q.eq("featured", true);
    if (data.limit) q = q.limit(data.limit);
    const { data: rows, error } = await q;
    if (error) throw error;
    return await Promise.all(
      (rows ?? []).map(async (r) => ({ ...r, images: await resolveCardImage(r.images, supabase) })),
    );
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { data: product, error } = await supabase
      .from("products")
      .select("*, states(name, slug)")
      .eq("slug", data.slug)
      .eq("in_stock", true)
      .maybeSingle();
    if (error) throw error;
    if (!product) return null;

    const images = await resolveImages(supabase, product.images);

    const { data: reviews } = await supabase
      .from("reviews")
      .select("id,rating,body,created_at,user_id")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false });

    return { product: { ...product, images }, reviews: reviews ?? [] };
  });

export const searchProducts = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ q: z.string().min(1).max(100) }).parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { data: rows } = await supabase
      .from("products")
      .select("id,name,slug,price_inr,images,saree_type")
      .ilike("name", `%${data.q}%`)
      .eq("in_stock", true)
      .limit(12);
    return await Promise.all(
      (rows ?? []).map(async (r) => ({ ...r, images: await resolveCardImage(r.images, supabase) })),
    );
  });
